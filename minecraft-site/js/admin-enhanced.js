// Enhanced Admin JavaScript

// Load quick commands
async function loadQuickCommands() {
    try {
        const response = await fetch('/api/commands/quick');
        const data = await response.json();
        
        const container = document.getElementById('quick-commands');
        if (!container) return;
        
        if (data.commands && data.commands.length > 0) {
            container.innerHTML = data.commands.map(cmd => `
                <button class="quick-command-btn" onclick="executeQuickCommand('${cmd.command}')">
                    <span class="quick-command-icon">${cmd.icon}</span>
                    <span class="quick-command-name">${cmd.name}</span>
                </button>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load quick commands:', error);
    }
}

async function executeQuickCommand(command) {
    try {
        const response = await fetch('/api/server/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
        
        if (response.ok) {
            showNotification('コマンド実行', `「${command}」を実行しました`);
            setTimeout(loadLogs, 1000);
        } else {
            showNotification('エラー', 'コマンドの実行に失敗しました');
        }
    } catch (error) {
        console.error('Command execution error:', error);
    }
}

// Event management
async function createEvent() {
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;
    const type = document.getElementById('event-type').value;
    const description = document.getElementById('event-description').value;
    
    if (!title || !date) {
        alert('イベント名と日時を入力してください');
        return;
    }
    
    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                event_date: date,
                event_type: type,
                description
            })
        });
        
        if (response.ok) {
            showNotification('成功', 'イベントを作成しました');
            // Clear form
            document.getElementById('event-title').value = '';
            document.getElementById('event-date').value = '';
            document.getElementById('event-description').value = '';
        } else {
            showNotification('エラー', 'イベントの作成に失敗しました');
        }
    } catch (error) {
        console.error('Event creation error:', error);
    }
}

// Update admin statistics
function updateAdminStats(data) {
    if (!data) return;
    
    // Update player count
    const playersEl = document.getElementById('admin-online-players');
    if (playersEl && data.players) {
        playersEl.textContent = data.players.online || 0;
    }
    
    // Update uptime
    const uptimeEl = document.getElementById('admin-uptime');
    if (uptimeEl && data.uptime) {
        const hours = Math.floor(data.uptime / 3600);
        const minutes = Math.floor((data.uptime % 3600) / 60);
        uptimeEl.textContent = `${hours}h ${minutes}m`;
    }
    
    // Update CPU
    const cpuEl = document.getElementById('admin-cpu');
    if (cpuEl && data.performance) {
        cpuEl.textContent = (data.performance.cpu || 0).toFixed(1) + '%';
    }
    
    // Update Memory
    const memoryEl = document.getElementById('admin-memory');
    if (memoryEl && data.performance) {
        memoryEl.textContent = (data.performance.memory || 0).toFixed(1) + '%';
    }
}

// Simple notification function
function showNotification(title, message) {
    // You can enhance this with a custom notification UI
    console.log(`[${title}] ${message}`);
    
    // Simple alert for now
    if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
    }
}

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the admin page
    const dashboard = document.getElementById('admin-dashboard');
    if (dashboard && dashboard.style.display !== 'none') {
        loadQuickCommands();
    }
});

// Override the existing updateStatus to include admin stats
const originalUpdateStatus = window.updateStatus;
if (originalUpdateStatus) {
    window.updateStatus = function(data) {
        originalUpdateStatus(data);
        updateAdminStats(data);
    };
}

console.log('✅ Enhanced admin features loaded');
