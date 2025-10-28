const express = require('express');
const path = require('path');
const { exec, spawn } = require('child_process');
const session = require('express-session');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');
const dgram = require('dgram');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Store connected WebSocket clients
const clients = new Set();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'minecraft-server-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Serve static files
app.use(express.static(__dirname));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Login endpoint
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out' });
});

// Check auth status
app.get('/api/auth/status', (req, res) => {
    res.json({ authenticated: !!req.session.authenticated });
});

// Enhanced server status check
function checkMinecraftServer(callback) {
    let status = {
        online: false,
        processRunning: false,
        screenRunning: false,
        portOpen: false,
        players: { online: 0, max: 10 },
        uptime: 0
    };

    // Check if process is running
    exec('ps aux | grep bedrock_server | grep -v grep', (error, stdout) => {
        status.processRunning = stdout.trim().length > 0;
        
        // Check screen session
        exec('screen -ls | grep tama', (error, screenOutput) => {
            status.screenRunning = screenOutput.includes('tama') && screenOutput.includes('Detached');
            
            // Check if port is listening
            exec('lsof -i :4096 | grep bedrock', (error, portOutput) => {
                status.portOpen = portOutput.trim().length > 0;
                
                // Calculate uptime from process
                if (status.processRunning) {
                    exec("ps -p $(pgrep -f bedrock_server | head -1) -o etimes=", (error, uptimeOutput) => {
                        if (!error && uptimeOutput) {
                            status.uptime = parseInt(uptimeOutput.trim()) || 0;
                        }
                        
                        status.online = status.processRunning && status.portOpen;
                        callback(status);
                    });
                } else {
                    status.online = false;
                    callback(status);
                }
            });
        });
    });
}

// Server status endpoint
app.get('/api/status', (req, res) => {
    checkMinecraftServer((status) => {
        res.json({
            online: status.online,
            processRunning: status.processRunning,
            screenRunning: status.screenRunning,
            portOpen: status.portOpen,
            players: status.players,
            version: "Bedrock Edition",
            gamemode: "Survival",
            difficulty: "Easy",
            uptime: status.uptime,
            motd: "Bedrock Server - 統合版サーバー",
            address: "schale41.jp",
            port: 4096,
            timestamp: new Date().toISOString(),
            screenSession: status.screenRunning ? 'tama' : null
        });
    });
});

// Start server
app.post('/api/server/start', requireAuth, (req, res) => {
    checkMinecraftServer((status) => {
        if (status.online) {
            res.json({ 
                success: false, 
                message: 'サーバーは既に起動しています' 
            });
        } else {
            // Check if screen session exists
            exec('screen -ls | grep tama', (error, stdout) => {
                if (!stdout.includes('tama')) {
                    // Create screen session if it doesn't exist
                    exec('screen -dmS tama', (error) => {
                        if (error) {
                            res.status(500).json({ error: 'Screen session creation failed' });
                            return;
                        }
                        
                        setTimeout(() => {
                            exec('screen -S tama -X stuff "cd ~/tama/bedrock-server-1.21.114.1 && ./bedrock_server\\n"', (error) => {
                                if (error) {
                                    res.status(500).json({ error: 'Failed to start server' });
                                } else {
                                    res.json({ success: true, message: 'サーバーを起動しました' });
                                    broadcastStatusUpdate();
                                }
                            });
                        }, 1000);
                    });
                } else {
                    // Screen exists, send start command
                    exec('screen -S tama -X stuff "cd ~/tama/bedrock-server-1.21.114.1 && ./bedrock_server\\n"', (error) => {
                        if (error) {
                            res.status(500).json({ error: 'Failed to start server' });
                        } else {
                            res.json({ success: true, message: 'サーバーを起動しました' });
                            broadcastStatusUpdate();
                        }
                    });
                }
            });
        }
    });
});

// Stop server
app.post('/api/server/stop', requireAuth, (req, res) => {
    exec('screen -S tama -X stuff "stop\\n"', (error) => {
        if (error) {
            res.status(500).json({ error: 'Failed to stop server' });
        } else {
            res.json({ success: true, message: 'サーバーを停止しました' });
            setTimeout(broadcastStatusUpdate, 2000);
        }
    });
});

// Restart server
app.post('/api/server/restart', requireAuth, (req, res) => {
    exec('screen -S tama -X stuff "stop\\n"', (error) => {
        if (error) {
            res.status(500).json({ error: 'Failed to restart server' });
        } else {
            setTimeout(() => {
                exec('screen -S tama -X stuff "cd ~/tama/bedrock-server-1.21.114.1 && ./bedrock_server\\n"', (error) => {
                    if (error) {
                        res.status(500).json({ error: 'Failed to restart server' });
                    } else {
                        res.json({ success: true, message: 'サーバーを再起動しました' });
                        setTimeout(broadcastStatusUpdate, 5000);
                    }
                });
            }, 5000);
        }
    });
});

// Send command to server
app.post('/api/server/command', requireAuth, (req, res) => {
    const { command } = req.body;
    if (!command) {
        return res.status(400).json({ error: 'Command is required' });
    }
    
    exec(`screen -S tama -X stuff "${command}\\n"`, (error) => {
        if (error) {
            res.status(500).json({ error: 'Failed to send command' });
        } else {
            res.json({ success: true, message: 'Command sent' });
        }
    });
});

// Get server logs
app.get('/api/server/logs', requireAuth, (req, res) => {
    exec('screen -S tama -X hardcopy /tmp/screen-tama.log && cat /tmp/screen-tama.log | tail -100', (error, stdout) => {
        if (error) {
            res.status(500).json({ error: 'Failed to get logs' });
        } else {
            res.json({ logs: stdout });
        }
    });
});

// Broadcast status update to all connected WebSocket clients
function broadcastStatusUpdate() {
    checkMinecraftServer((status) => {
        const message = JSON.stringify({
            type: 'status_update',
            data: {
                online: status.online,
                processRunning: status.processRunning,
                screenRunning: status.screenRunning,
                portOpen: status.portOpen,
                players: status.players,
                uptime: status.uptime,
                timestamp: new Date().toISOString()
            }
        });
        
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
}

// WebSocket for real-time updates
wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    // Send initial status
    checkMinecraftServer((status) => {
        ws.send(JSON.stringify({
            type: 'status_update',
            data: {
                online: status.online,
                processRunning: status.processRunning,
                screenRunning: status.screenRunning,
                portOpen: status.portOpen,
                players: status.players,
                uptime: status.uptime,
                timestamp: new Date().toISOString()
            }
        }));
    });
    
    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'command') {
                exec(`screen -S tama -X stuff "${data.command}\\n"`, (error) => {
                    if (error) {
                        ws.send(JSON.stringify({ 
                            type: 'error', 
                            message: 'Failed to send command' 
                        }));
                    } else {
                        ws.send(JSON.stringify({ 
                            type: 'success', 
                            message: 'Command sent' 
                        }));
                        
                        setTimeout(() => {
                            exec('screen -S tama -X hardcopy /tmp/screen-tama.log && cat /tmp/screen-tama.log | tail -50', (error, stdout) => {
                                if (!error) {
                                    ws.send(JSON.stringify({ 
                                        type: 'logs', 
                                        data: stdout 
                                    }));
                                }
                            });
                        }, 500);
                    }
                });
            } else if (data.type === 'request_status') {
                broadcastStatusUpdate();
            }
        } catch (err) {
            console.error('WebSocket error:', err);
        }
    });
    
    // Send periodic log updates
    const logInterval = setInterval(() => {
        exec('screen -S tama -X hardcopy /tmp/screen-tama.log && cat /tmp/screen-tama.log | tail -20', (error, stdout) => {
            if (!error && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ 
                    type: 'logs', 
                    data: stdout 
                }));
            }
        });
    }, 5000);
    
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        clients.delete(ws);
        clearInterval(logInterval);
    });
});

// Periodic status broadcast (every 3 seconds)
setInterval(() => {
    if (clients.size > 0) {
        broadcastStatusUpdate();
    }
}, 3000);

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Minecraft Server Website running on port ${PORT}`);
    console.log(`📡 Public: http://localhost:${PORT}`);
    console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
    console.log(`🔑 Admin password: ${ADMIN_PASSWORD}`);
    console.log(`📊 Real-time monitoring enabled`);
});
