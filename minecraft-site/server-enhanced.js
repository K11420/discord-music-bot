const express = require('express');
const path = require('path');
const { exec, spawn } = require('child_process');
const session = require('express-session');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const multer = require('multer');
const moment = require('moment');
const Database = require('./database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Initialize Database
const db = new Database();

// Store connected WebSocket clients
const clients = new Set();
const adminClients = new Set();

// Store current online players
let onlinePlayers = [];
let currentServerStatus = null;

// Configure multer for screenshot uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/screenshots/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out' });
});

app.get('/api/auth/status', (req, res) => {
    res.json({ authenticated: !!req.session.authenticated });
});

// ============================================================================
// SERVER STATUS AND CONTROL
// ============================================================================

function parsePlayerList(logContent) {
    const players = [];
    const playerRegex = /Player connected: (.+?),/g;
    const disconnectRegex = /Player disconnected: (.+?),/g;
    
    let match;
    const connected = [];
    while ((match = playerRegex.exec(logContent)) !== null) {
        connected.push(match[1]);
    }
    
    const disconnected = [];
    while ((match = disconnectRegex.exec(logContent)) !== null) {
        disconnected.push(match[1]);
    }
    
    // Filter out disconnected players
    return connected.filter(p => !disconnected.includes(p));
}

function getSystemStats() {
    return new Promise((resolve) => {
        exec("ps aux | grep bedrock_server | grep -v grep | awk '{print $3, $4}'", (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve({ cpu: 0, memory: 0 });
                return;
            }
            const parts = stdout.trim().split(' ');
            resolve({
                cpu: parseFloat(parts[0]) || 0,
                memory: parseFloat(parts[1]) || 0
            });
        });
    });
}

async function checkMinecraftServer(callback) {
    let status = {
        online: false,
        processRunning: false,
        screenRunning: false,
        portOpen: false,
        players: { online: 0, max: 10, list: [] },
        uptime: 0,
        performance: { cpu: 0, memory: 0, tps: 20.0 }
    };

    // Check if process is running
    exec('ps aux | grep bedrock_server | grep -v grep', async (error, stdout) => {
        status.processRunning = stdout.trim().length > 0;
        
        // Check screen session
        exec('screen -ls | grep tama', (error, screenOutput) => {
            status.screenRunning = screenOutput.includes('tama') && screenOutput.includes('Detached');
            
            // Check if port is listening
            exec('lsof -i :4096 | grep bedrock', async (error, portOutput) => {
                status.portOpen = portOutput.trim().length > 0;
                
                // Get system stats
                const sysStats = await getSystemStats();
                status.performance.cpu = sysStats.cpu;
                status.performance.memory = sysStats.memory;
                
                // Calculate uptime from process
                if (status.processRunning) {
                    exec("ps -p $(pgrep -f bedrock_server | head -1) -o etimes=", (error, uptimeOutput) => {
                        if (!error && uptimeOutput) {
                            status.uptime = parseInt(uptimeOutput.trim()) || 0;
                        }
                        
                        // Get player list from logs
                        exec('screen -S tama -X hardcopy /tmp/screen-tama.log && cat /tmp/screen-tama.log | tail -200', (error, logOutput) => {
                            if (!error && logOutput) {
                                status.players.list = parsePlayerList(logOutput);
                                status.players.online = status.players.list.length;
                            }
                            
                            status.online = status.processRunning && status.portOpen;
                            currentServerStatus = status;
                            
                            // Record stats to database
                            db.recordServerStat({
                                online: status.online,
                                player_count: status.players.online,
                                max_players: status.players.max,
                                uptime: status.uptime,
                                cpu_usage: status.performance.cpu,
                                memory_usage: status.performance.memory,
                                tps: status.performance.tps
                            }).catch(err => console.error('DB error:', err));
                            
                            callback(status);
                        });
                    });
                } else {
                    status.online = false;
                    currentServerStatus = status;
                    callback(status);
                }
            });
        });
    });
}

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
            performance: status.performance,
            motd: "Bedrock Server - 統合版サーバー",
            address: "schale41.jp",
            port: 4096,
            timestamp: new Date().toISOString(),
            screenSession: status.screenRunning ? 'tama' : null
        });
    });
});

app.post('/api/server/start', requireAuth, (req, res) => {
    checkMinecraftServer((status) => {
        if (status.online) {
            res.json({ success: false, message: 'サーバーは既に起動しています' });
        } else {
            exec('screen -ls | grep tama', (error, stdout) => {
                if (!stdout.includes('tama')) {
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
                                    broadcastToAdmins({ type: 'notification', message: 'サーバーが起動しました' });
                                }
                            });
                        }, 1000);
                    });
                } else {
                    exec('screen -S tama -X stuff "cd ~/tama/bedrock-server-1.21.114.1 && ./bedrock_server\\n"', (error) => {
                        if (error) {
                            res.status(500).json({ error: 'Failed to start server' });
                        } else {
                            res.json({ success: true, message: 'サーバーを起動しました' });
                            broadcastStatusUpdate();
                            broadcastToAdmins({ type: 'notification', message: 'サーバーが起動しました' });
                        }
                    });
                }
            });
        }
    });
});

app.post('/api/server/stop', requireAuth, (req, res) => {
    exec('screen -S tama -X stuff "stop\\n"', (error) => {
        if (error) {
            res.status(500).json({ error: 'Failed to stop server' });
        } else {
            res.json({ success: true, message: 'サーバーを停止しました' });
            setTimeout(broadcastStatusUpdate, 2000);
            broadcastToAdmins({ type: 'notification', message: 'サーバーが停止しました' });
        }
    });
});

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
                        broadcastToAdmins({ type: 'notification', message: 'サーバーが再起動しました' });
                    }
                });
            }, 5000);
        }
    });
});

// ============================================================================
// COMMAND EXECUTION
// ============================================================================

const quickCommands = [
    { name: '天気を晴れに', command: 'weather clear', icon: '☀️' },
    { name: '天気を雨に', command: 'weather rain', icon: '🌧️' },
    { name: '時間を昼に', command: 'time set day', icon: '🌞' },
    { name: '時間を夜に', command: 'time set night', icon: '🌙' },
    { name: 'モンスター削除', command: 'kill @e[type=!player]', icon: '💀' },
    { name: 'プレイヤー全回復', command: 'effect @a regeneration 10 255', icon: '❤️' },
    { name: 'ゲームモード: サバイバル', command: 'gamemode survival @a', icon: '⚔️' },
    { name: 'ゲームモード: クリエイティブ', command: 'gamemode creative @a', icon: '🏗️' }
];

app.get('/api/commands/quick', requireAuth, (req, res) => {
    res.json({ commands: quickCommands });
});

app.post('/api/server/command', requireAuth, (req, res) => {
    const { command } = req.body;
    if (!command) {
        return res.status(400).json({ error: 'Command is required' });
    }
    
    exec(`screen -S tama -X stuff "${command}\\n"`, (error) => {
        if (error) {
            res.status(500).json({ error: 'Failed to send command' });
        } else {
            res.json({ success: true, message: 'Command sent', command: command });
            db.addChatLog('CONSOLE', command, 'command').catch(err => console.error('DB error:', err));
        }
    });
});

// ============================================================================
// SERVER LOGS AND CHAT
// ============================================================================

app.get('/api/server/logs', requireAuth, (req, res) => {
    exec('screen -S tama -X hardcopy /tmp/screen-tama.log && cat /tmp/screen-tama.log | tail -100', (error, stdout) => {
        if (error) {
            res.status(500).json({ error: 'Failed to get logs' });
        } else {
            res.json({ logs: stdout });
        }
    });
});

app.get('/api/chat/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    db.getChatLogs(limit)
        .then(logs => res.json({ chats: logs }))
        .catch(err => res.status(500).json({ error: 'Failed to fetch chat logs' }));
});

// ============================================================================
// STATISTICS AND ANALYTICS
// ============================================================================

app.get('/api/stats/server', (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    db.getServerStats(hours)
        .then(stats => res.json({ stats: stats }))
        .catch(err => res.status(500).json({ error: 'Failed to fetch stats' }));
});

app.get('/api/stats/players', (req, res) => {
    const type = req.query.type || 'total_playtime';
    const limit = parseInt(req.query.limit) || 10;
    db.getPlayerRankings(type, limit)
        .then(rankings => res.json({ rankings: rankings }))
        .catch(err => res.status(500).json({ error: 'Failed to fetch rankings' }));
});

app.get('/api/players/online', (req, res) => {
    if (currentServerStatus && currentServerStatus.players) {
        res.json({ 
            count: currentServerStatus.players.online,
            players: currentServerStatus.players.list 
        });
    } else {
        res.json({ count: 0, players: [] });
    }
});

// ============================================================================
// EVENTS/CALENDAR
// ============================================================================

app.get('/api/events', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    db.getEvents(limit)
        .then(events => res.json({ events: events }))
        .catch(err => res.status(500).json({ error: 'Failed to fetch events' }));
});

app.post('/api/events', requireAuth, (req, res) => {
    const { title, description, event_date, event_type } = req.body;
    if (!title || !event_date) {
        return res.status(400).json({ error: 'Title and date are required' });
    }
    
    db.createEvent({ title, description, event_date, event_type })
        .then(result => {
            res.json({ success: true, message: 'Event created', id: result.id });
            broadcastToAdmins({ type: 'event_created', event: { id: result.id, title, event_date } });
        })
        .catch(err => res.status(500).json({ error: 'Failed to create event' }));
});

app.delete('/api/events/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    db.deleteEvent(id)
        .then(() => res.json({ success: true, message: 'Event deleted' }))
        .catch(err => res.status(500).json({ error: 'Failed to delete event' }));
});

// ============================================================================
// SCREENSHOTS/GALLERY
// ============================================================================

app.get('/api/screenshots', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    db.getScreenshots(limit)
        .then(screenshots => res.json({ screenshots: screenshots }))
        .catch(err => res.status(500).json({ error: 'Failed to fetch screenshots' }));
});

app.post('/api/screenshots/upload', upload.single('screenshot'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { title, description, uploader } = req.body;
    
    try {
        const result = await db.addScreenshot({
            filename: req.file.filename,
            title: title || 'Untitled',
            description: description || '',
            uploader: uploader || 'Anonymous'
        });
        
        res.json({ 
            success: true, 
            message: 'Screenshot uploaded', 
            id: result.id,
            url: `/uploads/screenshots/${req.file.filename}`
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save screenshot' });
    }
});

app.post('/api/screenshots/:id/like', (req, res) => {
    const id = parseInt(req.params.id);
    db.likeScreenshot(id)
        .then(() => res.json({ success: true, message: 'Screenshot liked' }))
        .catch(err => res.status(500).json({ error: 'Failed to like screenshot' }));
});

// ============================================================================
// WEBSOCKET FOR REAL-TIME UPDATES
// ============================================================================

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
                performance: status.performance,
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

function broadcastToAdmins(data) {
    const message = JSON.stringify(data);
    adminClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    const isAdmin = req.url.includes('admin');
    
    clients.add(ws);
    if (isAdmin) {
        adminClients.add(ws);
    }
    
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
                performance: status.performance,
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
                        ws.send(JSON.stringify({ type: 'error', message: 'Failed to send command' }));
                    } else {
                        ws.send(JSON.stringify({ type: 'success', message: 'Command sent' }));
                        
                        setTimeout(() => {
                            exec('screen -S tama -X hardcopy /tmp/screen-tama.log && cat /tmp/screen-tama.log | tail -50', (error, stdout) => {
                                if (!error) {
                                    ws.send(JSON.stringify({ type: 'logs', data: stdout }));
                                }
                            });
                        }, 500);
                    }
                });
            } else if (data.type === 'request_status') {
                broadcastStatusUpdate();
            } else if (data.type === 'request_players') {
                if (currentServerStatus) {
                    ws.send(JSON.stringify({ 
                        type: 'player_list', 
                        data: currentServerStatus.players 
                    }));
                }
            }
        } catch (err) {
            console.error('WebSocket error:', err);
        }
    });
    
    // Send periodic log updates (only for admin connections)
    let logInterval = null;
    if (isAdmin) {
        logInterval = setInterval(() => {
            exec('screen -S tama -X hardcopy /tmp/screen-tama.log && cat /tmp/screen-tama.log | tail -20', (error, stdout) => {
                if (!error && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'logs', data: stdout }));
                }
            });
        }, 5000);
    }
    
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        clients.delete(ws);
        adminClients.delete(ws);
        if (logInterval) {
            clearInterval(logInterval);
        }
    });
});

// Periodic status broadcast (every 3 seconds)
setInterval(() => {
    if (clients.size > 0) {
        broadcastStatusUpdate();
    }
}, 3000);

// ============================================================================
// ROUTES
// ============================================================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-enhanced.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-enhanced.html'));
});

// Legacy routes (backward compatibility)
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ============================================================================
// START SERVER
// ============================================================================

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Minecraft Server Website running on port ${PORT}`);
    console.log(`📡 Public: http://localhost:${PORT}`);
    console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
    console.log(`🔑 Admin password: ${ADMIN_PASSWORD}`);
    console.log(`📊 Real-time monitoring enabled`);
    console.log(`💾 Database initialized`);
    console.log(`📸 Screenshot uploads enabled`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    db.close();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
