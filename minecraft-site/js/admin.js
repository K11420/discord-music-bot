// Admin Panel JavaScript

let ws = null;
let statusInterval = null;

// Check authentication on load
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (data.authenticated) {
            showDashboard();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLogin();
    }
}

// Show login screen
function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
}

// Show dashboard
function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'flex';
    
    // Start polling server status
    updateServerStatus();
    statusInterval = setInterval(updateServerStatus, 5000);
    
    // Connect WebSocket
    connectWebSocket();
    
    // Load initial logs
    refreshLogs();
    
    // Load quick commands (from admin-enhanced.js)
    if (typeof loadQuickCommands === 'function') {
        loadQuickCommands();
    }
    
    // Load admin events list (from admin-enhanced.js)
    if (typeof loadAdminEvents === 'function') {
        loadAdminEvents();
    }
}

// Login form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const passwordInput = document.getElementById('password-input') || document.getElementById('password');
            const password = passwordInput ? passwordInput.value : '';
            const errorDiv = document.getElementById('login-error');
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showDashboard();
                } else {
                    errorDiv.textContent = 'パスワードが正しくありません';
                }
            } catch (error) {
                errorDiv.textContent = 'ログインに失敗しました';
            }
        });
    }
    
    checkAuth();
});

// Logout
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        if (ws) ws.close();
        if (statusInterval) clearInterval(statusInterval);
        showLogin();
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Update server status
async function updateServerStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        updateRealtimeStatus(data);
    } catch (error) {
        console.error('Failed to update status:', error);
    }
}

// Update realtime status from WebSocket or HTTP
function updateRealtimeStatus(data) {
    // Update header status (enhanced version)
    const headerStatus = document.getElementById('header-status');
    if (headerStatus) {
        if (data.online) {
            headerStatus.textContent = '🟢 オンライン';
            headerStatus.style.color = '#4CAF50';
        } else {
            headerStatus.textContent = '🔴 オフライン';
            headerStatus.style.color = '#F44336';
        }
    }
    
    // Update status indicator (old version)
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('server-status');
    
    if (indicator && statusText) {
        if (data.online) {
            indicator.className = 'status-indicator online';
            statusText.textContent = '🟢 オンライン';
            statusText.style.color = '#4CAF50';
        } else {
            indicator.className = 'status-indicator offline';
            statusText.textContent = '🔴 オフライン';
            statusText.style.color = '#F44336';
        }
    }
    
    // Update status info (enhanced version)
    const processStatus = document.getElementById('process-status');
    const portStatus = document.getElementById('port-status');
    const screenStatus = document.getElementById('screen-status');
    
    if (processStatus) {
        processStatus.textContent = data.processRunning ? '✅ 起動中' : '❌ 停止中';
    }
    if (portStatus) {
        portStatus.textContent = data.portOpen ? '✅ OPEN' : '❌ CLOSED';
    }
    if (screenStatus) {
        screenStatus.textContent = data.screenRunning ? '✅ 接続中' : '❌ 切断';
    }
    
    // Update stats (old version)
    const onlinePlayers = document.getElementById('online-players');
    const maxPlayers = document.getElementById('max-players');
    const uptimeEl = document.getElementById('uptime');
    const screenSession = document.getElementById('screen-session');
    const serverAddress = document.getElementById('server-address');
    
    if (onlinePlayers) onlinePlayers.textContent = data.players?.online || 0;
    if (maxPlayers) maxPlayers.textContent = `${data.players?.max || 10}人`;
    
    if (data.uptime !== undefined && uptimeEl) {
        const hours = Math.floor(data.uptime / 3600);
        const minutes = Math.floor((data.uptime % 3600) / 60);
        uptimeEl.textContent = `${hours}h ${minutes}m`;
    }
    
    if (screenSession) screenSession.textContent = data.screenSession || '-';
    if (serverAddress) serverAddress.textContent = `${data.address}:${data.port}`;
    
    // Log detailed status
    console.log('Real-time status:', {
        online: data.online,
        process: data.processRunning,
        screen: data.screenRunning,
        port: data.portOpen,
        uptime: data.uptime,
        players: data.players
    });
}

// Make it globally accessible
window.updateStatus = updateRealtimeStatus;

// Server control functions
async function startServer() {
    showMessage('サーバーを起動しています...', 'info');
    try {
        const response = await fetch('/api/server/start', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message, 'success');
        } else {
            showMessage(data.message, 'error');
        }
        
        setTimeout(updateServerStatus, 2000);
    } catch (error) {
        showMessage('起動に失敗しました', 'error');
    }
}

async function stopServer() {
    if (!confirm('サーバーを停止しますか？')) return;
    
    showMessage('サーバーを停止しています...', 'info');
    try {
        const response = await fetch('/api/server/stop', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message, 'success');
        } else {
            showMessage(data.message, 'error');
        }
        
        setTimeout(updateServerStatus, 2000);
    } catch (error) {
        showMessage('停止に失敗しました', 'error');
    }
}

async function restartServer() {
    if (!confirm('サーバーを再起動しますか？')) return;
    
    showMessage('サーバーを再起動しています...', 'info');
    try {
        const response = await fetch('/api/server/restart', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message, 'success');
        } else {
            showMessage(data.message, 'error');
        }
        
        setTimeout(updateServerStatus, 5000);
    } catch (error) {
        showMessage('再起動に失敗しました', 'error');
    }
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('control-message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 5000);
    }
}

// Quick commands
async function sendQuickCommand(command) {
    await sendCommand(command);
}

// Send command
async function sendCommand(cmd) {
    const command = cmd || document.getElementById('terminal-input').value;
    if (!command.trim()) return;
    
    try {
        const response = await fetch('/api/server/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
        
        const data = await response.json();
        
        if (data.success) {
            addTerminalLine(`$ ${command}`);
            document.getElementById('terminal-input').value = '';
            setTimeout(refreshLogs, 1000);
        }
    } catch (error) {
        addTerminalLine(`Error: ${error.message}`);
    }
}

// Handle terminal input
function handleTerminalInput(event) {
    if (event.key === 'Enter') {
        sendCommand();
    }
}

// Add terminal line
function addTerminalLine(text) {
    const output = document.getElementById('terminal-output');
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = text;
    output.appendChild(line);
    
    // Auto scroll
    const terminal = document.getElementById('terminal');
    terminal.scrollTop = terminal.scrollHeight;
}

// Clear terminal
function clearTerminal() {
    document.getElementById('terminal-output').innerHTML = '';
}

// Refresh logs
async function refreshLogs() {
    try {
        const response = await fetch('/api/server/logs');
        const data = await response.json();
        
        if (data.logs) {
            // Support both old and new element IDs
            const logsElement = document.getElementById('logs-output') || document.getElementById('server-logs');
            if (logsElement) {
                logsElement.textContent = data.logs;
            }
            
            // Auto scroll
            const logsContainer = document.getElementById('logs-container');
            if (logsContainer) {
                logsContainer.scrollTop = logsContainer.scrollHeight;
            }
        }
    } catch (error) {
        console.error('Failed to load logs:', error);
    }
}

// Alias for compatibility
window.loadLogs = refreshLogs;

// WebSocket connection
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('WebSocket connected - Real-time monitoring active');
        addTerminalLine('Connected to server terminal');
        // Request initial status
        ws.send(JSON.stringify({ type: 'request_status' }));
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'status_update') {
                updateRealtimeStatus(data.data);
            } else if (data.type === 'logs') {
                document.getElementById('server-logs').textContent = data.data;
                const logsContainer = document.getElementById('logs-container');
                logsContainer.scrollTop = logsContainer.scrollHeight;
            } else if (data.type === 'connected') {
                addTerminalLine(data.message);
            } else if (data.type === 'error') {
                addTerminalLine(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        addTerminalLine('WebSocket connection error');
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        addTerminalLine('Disconnected from server');
        
        // Attempt reconnect after 5 seconds
        setTimeout(() => {
            if (document.getElementById('admin-dashboard').style.display !== 'none') {
                connectWebSocket();
            }
        }, 5000);
    };
}

// Periodically refresh logs
setInterval(() => {
    if (document.getElementById('admin-dashboard').style.display !== 'none') {
        refreshLogs();
    }
}, 10000);
