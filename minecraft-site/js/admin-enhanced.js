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
    console.log('📅 createEvent() called');
    
    const titleEl = document.getElementById('event-title');
    const dateEl = document.getElementById('event-date');
    const typeEl = document.getElementById('event-type');
    const descriptionEl = document.getElementById('event-description');
    const button = event.target;
    
    const title = titleEl.value;
    const date = dateEl.value;
    const type = typeEl.value;
    const description = descriptionEl.value;
    
    console.log('📝 Form values:', { title, date, type, description });
    
    if (!title || !date) {
        showAdminNotification('⚠️ 入力エラー', 'イベント名と日時を入力してください', 'warning');
        return;
    }
    
    // Disable button and show loading
    button.disabled = true;
    button.textContent = '作成中...';
    
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
        
        const data = await response.json();
        console.log('✅ Response:', response.status, data);
        
        if (response.ok) {
            showAdminNotification(
                '✅ 成功', 
                `イベント「${title}」を作成しました！`, 
                'success'
            );
            
            // Clear form
            titleEl.value = '';
            dateEl.value = '';
            descriptionEl.value = '';
            
            // Reload admin events list
            loadAdminEvents();
            
            // Reload events on public page if available
            if (typeof loadEvents === 'function') {
                loadEvents();
            }
        } else {
            showAdminNotification(
                '❌ エラー', 
                'イベントの作成に失敗しました: ' + (data.error || 'Unknown error'), 
                'error'
            );
        }
    } catch (error) {
        console.error('❌ Event creation error:', error);
        showAdminNotification(
            '❌ エラー', 
            'エラーが発生しました: ' + error.message, 
            'error'
        );
    } finally {
        // Re-enable button
        button.disabled = false;
        button.textContent = 'イベント作成';
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

// Enhanced notification function with custom UI
function showAdminNotification(title, message, type = 'info') {
    console.log(`🔔 Notification: [${title}] ${message} (type: ${type})`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.innerHTML = `
        <div class="admin-notification-content">
            <div class="admin-notification-title">${title}</div>
            <div class="admin-notification-message">${message}</div>
        </div>
        <button class="admin-notification-close" onclick="this.parentElement.remove()">✕</button>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    console.log('✅ Notification element added to body');
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
        console.log('✅ Notification animation triggered');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
            console.log('✅ Notification removed');
        }, 300);
    }, 5000);
    
    // Browser notification (check if supported)
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
            new Notification(title, { body: message });
            console.log('✅ Browser notification sent');
        } catch (e) {
            console.log('⚠️ Browser notification not available:', e);
        }
    }
}

// Legacy function for compatibility
function showNotification(title, message) {
    showAdminNotification(title, message, 'info');
}

// Load admin events list
async function loadAdminEvents() {
    try {
        const response = await fetch('/api/events?limit=50');
        const data = await response.json();
        
        console.log('📅 Admin events loaded:', data);
        
        const container = document.getElementById('admin-events-list');
        if (!container) {
            console.warn('⚠️ Admin events container not found');
            return;
        }
        
        if (data.events && data.events.length > 0) {
            container.innerHTML = data.events.map(event => {
                const date = new Date(event.event_date);
                const day = date.getDate();
                const month = date.toLocaleDateString('ja-JP', { month: 'short' });
                const fullDate = date.toLocaleString('ja-JP', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                return `
                    <div class="admin-event-item">
                        <div class="admin-event-date">
                            <span class="admin-event-day">${day}</span>
                            <span class="admin-event-month">${month}</span>
                        </div>
                        <div class="admin-event-details">
                            <div class="admin-event-title">${escapeHtml(event.title)}</div>
                            <div class="admin-event-description">${escapeHtml(event.description || '')}</div>
                            <div class="admin-event-meta">
                                <span class="admin-event-type">${escapeHtml(event.event_type || 'general')}</span>
                                <span>📅 ${fullDate}</span>
                            </div>
                        </div>
                        <div class="admin-event-actions">
                            <button class="btn-delete" onclick="deleteEvent(${event.id})">🗑️ 削除</button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<div class="loading">イベントがありません</div>';
        }
    } catch (error) {
        console.error('❌ Failed to load admin events:', error);
        const container = document.getElementById('admin-events-list');
        if (container) {
            container.innerHTML = '<div class="loading">イベントの読み込みに失敗しました</div>';
        }
    }
}

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('このイベントを削除してもよろしいですか？')) {
        return;
    }
    
    console.log('🗑️ Deleting event:', eventId);
    
    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        console.log('✅ Delete response:', response.status, data);
        
        if (response.ok) {
            showAdminNotification(
                '✅ 削除成功', 
                'イベントを削除しました', 
                'success'
            );
            
            // Reload events list
            loadAdminEvents();
            
            // Reload events on public page if available
            if (typeof loadEvents === 'function') {
                loadEvents();
            }
        } else {
            showAdminNotification(
                '❌ エラー', 
                'イベントの削除に失敗しました: ' + (data.error || 'Unknown error'), 
                'error'
            );
        }
    } catch (error) {
        console.error('❌ Event deletion error:', error);
        showAdminNotification(
            '❌ エラー', 
            'エラーが発生しました: ' + error.message, 
            'error'
        );
    }
}

// HTML escape utility
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the admin page
    const dashboard = document.getElementById('admin-dashboard');
    if (dashboard && dashboard.style.display !== 'none') {
        loadQuickCommands();
        loadAdminEvents();
    }
    
    // Setup event creation button
    const createEventBtn = document.getElementById('create-event-btn');
    if (createEventBtn) {
        createEventBtn.addEventListener('click', createEvent);
        console.log('✅ Event creation button listener attached');
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

// Expose functions to global scope for onclick handlers
window.createEvent = createEvent;
window.executeQuickCommand = executeQuickCommand;
window.deleteEvent = deleteEvent;
window.loadAdminEvents = loadAdminEvents;

console.log('✅ Enhanced admin features loaded');
