// Enhanced Features JavaScript

// Global variables
let playersChart = null;
let performanceChart = null;
let currentRankingType = 'total_playtime';

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    loadOnlinePlayers();
    loadStatistics();
    loadChatHistory();
    loadGallery();
    loadEvents();
    loadRankings();
    
    // Setup event listeners
    setupNotificationButton();
    setupScreenshotUpload();
    setupRankingTabs();
    
    // Refresh data periodically
    setInterval(loadOnlinePlayers, 10000);
    setInterval(loadStatistics, 30000);
    setInterval(loadChatHistory, 15000);
});

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

function setupNotificationButton() {
    const btn = document.getElementById('notificationBtn');
    if (!btn) return;
    
    // Check if notifications are already enabled
    if (Notification.permission === 'granted') {
        btn.textContent = '🔔 通知有効';
        btn.disabled = true;
    }
    
    btn.addEventListener('click', async () => {
        if (!('Notification' in window)) {
            alert('このブラウザは通知をサポートしていません');
            return;
        }
        
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            btn.textContent = '🔔 通知有効';
            btn.disabled = true;
            showNotification('通知が有効になりました', 'サーバーの状態変更を通知します');
        }
    });
}

function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/favicon.ico',
            badge: '/favicon.ico'
        });
    }
}

// Listen for server status changes
let lastServerStatus = null;
function checkServerStatusChange(newStatus) {
    if (lastServerStatus === null) {
        lastServerStatus = newStatus;
        return;
    }
    
    if (lastServerStatus !== newStatus) {
        if (newStatus) {
            showNotification('サーバーがオンラインになりました', '今すぐ参加できます！');
        } else {
            showNotification('サーバーがオフラインになりました', 'メンテナンス中の可能性があります');
        }
        lastServerStatus = newStatus;
    }
}

// ============================================================================
// ONLINE PLAYERS
// ============================================================================

async function loadOnlinePlayers() {
    try {
        const response = await fetch('/api/players/online');
        const data = await response.json();
        
        const container = document.getElementById('players-container');
        if (!container) return;
        
        if (data.players && data.players.length > 0) {
            container.innerHTML = data.players.map(player => `
                <div class="player-card">
                    <div class="player-avatar">👤</div>
                    <div class="player-name">${escapeHtml(player)}</div>
                    <div class="player-status">オンライン</div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="no-players">現在オンラインのプレイヤーはいません</div>';
        }
    } catch (error) {
        console.error('Failed to load online players:', error);
    }
}

// ============================================================================
// STATISTICS AND CHARTS
// ============================================================================

function initializeCharts() {
    const playersCtx = document.getElementById('playersChart');
    const performanceCtx = document.getElementById('performanceChart');
    
    if (playersCtx) {
        playersChart = new Chart(playersCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'プレイヤー数',
                    data: [],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#fff' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#aaa' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: '#aaa', stepSize: 1 },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    if (performanceCtx) {
        performanceChart = new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'CPU (%)',
                        data: [],
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'メモリ (%)',
                        data: [],
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#fff' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#aaa' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        ticks: { color: '#aaa' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}

async function loadStatistics() {
    try {
        const response = await fetch('/api/stats/server?hours=24');
        const data = await response.json();
        
        if (data.stats && data.stats.length > 0) {
            updateCharts(data.stats);
            updatePerformanceMetrics(data.stats[0]);
        }
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

function updateCharts(stats) {
    // Reverse to show oldest to newest
    const reversedStats = [...stats].reverse();
    
    // Update players chart
    if (playersChart) {
        playersChart.data.labels = reversedStats.map(stat => {
            const date = new Date(stat.timestamp);
            return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        });
        playersChart.data.datasets[0].data = reversedStats.map(stat => stat.player_count);
        playersChart.update('none');
    }
    
    // Update performance chart
    if (performanceChart) {
        performanceChart.data.labels = reversedStats.map(stat => {
            const date = new Date(stat.timestamp);
            return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        });
        performanceChart.data.datasets[0].data = reversedStats.map(stat => stat.cpu_usage || 0);
        performanceChart.data.datasets[1].data = reversedStats.map(stat => stat.memory_usage || 0);
        performanceChart.update('none');
    }
}

function updatePerformanceMetrics(latestStat) {
    const cpuEl = document.getElementById('cpu-usage');
    const memoryEl = document.getElementById('memory-usage');
    const tpsEl = document.getElementById('tps-value');
    
    if (cpuEl) cpuEl.textContent = (latestStat.cpu_usage || 0).toFixed(1) + '%';
    if (memoryEl) memoryEl.textContent = (latestStat.memory_usage || 0).toFixed(1) + '%';
    if (tpsEl) tpsEl.textContent = (latestStat.tps || 20.0).toFixed(1);
}

// ============================================================================
// CHAT/LOGS
// ============================================================================

async function loadChatHistory() {
    try {
        const response = await fetch('/api/chat/history?limit=50');
        const data = await response.json();
        
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        if (data.chats && data.chats.length > 0) {
            container.innerHTML = data.chats.reverse().map(chat => {
                const date = new Date(chat.timestamp);
                const timeStr = date.toLocaleTimeString('ja-JP');
                const isSystem = chat.message_type !== 'chat';
                
                return `
                    <div class="chat-message ${isSystem ? 'chat-system' : ''}">
                        <span class="chat-timestamp">${timeStr}</span>
                        <span class="chat-player">${escapeHtml(chat.player_name || 'System')}</span>
                        <span class="chat-text">${escapeHtml(chat.message)}</span>
                    </div>
                `;
            }).join('');
            
            // Auto scroll to bottom
            container.scrollTop = container.scrollHeight;
        } else {
            container.innerHTML = '<div class="chat-loading">チャットログがありません</div>';
        }
    } catch (error) {
        console.error('Failed to load chat history:', error);
    }
}

// ============================================================================
// GALLERY
// ============================================================================

function setupScreenshotUpload() {
    const input = document.getElementById('screenshot-upload');
    if (!input) return;
    
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('screenshot', file);
        formData.append('title', 'New Screenshot');
        formData.append('uploader', 'Player');
        
        try {
            const response = await fetch('/api/screenshots/upload', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                alert('スクリーンショットをアップロードしました！');
                loadGallery();
            } else {
                alert('アップロードに失敗しました');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('アップロードエラー');
        }
        
        input.value = '';
    });
}

async function loadGallery() {
    try {
        const response = await fetch('/api/screenshots?limit=20');
        const data = await response.json();
        
        const container = document.getElementById('gallery-grid');
        if (!container) return;
        
        if (data.screenshots && data.screenshots.length > 0) {
            container.innerHTML = data.screenshots.map(screenshot => `
                <div class="gallery-item">
                    <img src="/uploads/screenshots/${screenshot.filename}" 
                         alt="${escapeHtml(screenshot.title)}" 
                         class="gallery-image"
                         loading="lazy">
                    <div class="gallery-info">
                        <div class="gallery-title">${escapeHtml(screenshot.title)}</div>
                        <div class="gallery-meta">
                            <span>${escapeHtml(screenshot.uploader)}</span>
                            <span class="gallery-likes" onclick="likeScreenshot(${screenshot.id})">
                                ❤️ ${screenshot.likes}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="gallery-loading">スクリーンショットがありません</div>';
        }
    } catch (error) {
        console.error('Failed to load gallery:', error);
    }
}

async function likeScreenshot(id) {
    try {
        await fetch(`/api/screenshots/${id}/like`, { method: 'POST' });
        loadGallery();
    } catch (error) {
        console.error('Failed to like screenshot:', error);
    }
}

// ============================================================================
// EVENTS
// ============================================================================

async function loadEvents() {
    try {
        const response = await fetch('/api/events?limit=10');
        const data = await response.json();
        
        console.log('📅 Events loaded:', data);
        
        const container = document.getElementById('events-container');
        if (!container) {
            console.warn('⚠️ Events container not found');
            return;
        }
        
        if (data.events && data.events.length > 0) {
            container.innerHTML = data.events.map(event => {
                const date = new Date(event.event_date);
                const day = date.getDate();
                const month = date.toLocaleDateString('ja-JP', { month: 'short' });
                
                return `
                    <div class="event-card">
                        <div class="event-date">
                            <span class="event-day">${day}</span>
                            <span class="event-month">${month}</span>
                        </div>
                        <div class="event-details">
                            <div class="event-title">${escapeHtml(event.title)}</div>
                            <div class="event-description">${escapeHtml(event.description || '')}</div>
                            <span class="event-type">${escapeHtml(event.event_type || 'general')}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<div class="events-loading">予定されているイベントはありません</div>';
        }
    } catch (error) {
        console.error('❌ Failed to load events:', error);
        const container = document.getElementById('events-container');
        if (container) {
            container.innerHTML = '<div class="events-loading">イベントの読み込みに失敗しました</div>';
        }
    }
}

// ============================================================================
// RANKINGS
// ============================================================================

function setupRankingTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentRankingType = tab.dataset.type;
            loadRankings();
        });
    });
}

async function loadRankings() {
    try {
        const response = await fetch(`/api/stats/players?type=${currentRankingType}&limit=10`);
        const data = await response.json();
        
        console.log('🏆 Rankings loaded:', { type: currentRankingType, data });
        
        const container = document.getElementById('rankings-container');
        if (!container) {
            console.warn('⚠️ Rankings container not found');
            return;
        }
        
        if (data.rankings && data.rankings.length > 0) {
            container.innerHTML = data.rankings.map((player, index) => {
                const position = index + 1;
                const positionClass = position <= 3 ? `top-${position}` : '';
                const value = formatRankingValue(currentRankingType, player[currentRankingType] || 0);
                
                return `
                    <div class="ranking-item">
                        <div class="ranking-position ${positionClass}">${position}</div>
                        <div class="ranking-player">${escapeHtml(player.player_name || 'Unknown')}</div>
                        <div class="ranking-value">${value}</div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<div class="rankings-loading">ランキングデータがありません</div>';
        }
    } catch (error) {
        console.error('❌ Failed to load rankings:', error);
        const container = document.getElementById('rankings-container');
        if (container) {
            container.innerHTML = '<div class="rankings-loading">ランキングの読み込みに失敗しました</div>';
        }
    }
}

function formatRankingValue(type, value) {
    switch (type) {
        case 'total_playtime':
            const hours = Math.floor(value / 3600);
            const minutes = Math.floor((value % 3600) / 60);
            return `${hours}h ${minutes}m`;
        case 'distance_traveled':
            return `${(value / 1000).toFixed(1)} km`;
        case 'blocks_placed':
        case 'blocks_broken':
            return value.toLocaleString();
        default:
            return value;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Expose functions to global scope for onclick handlers
window.likeScreenshot = likeScreenshot;

console.log('✅ Enhanced features loaded');
