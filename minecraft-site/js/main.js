// Main JavaScript for Minecraft Server Website

// WebSocket connection for real-time updates
let ws = null;

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('WebSocket connected - Real-time monitoring active');
        // Request initial status
        ws.send(JSON.stringify({ type: 'request_status' }));
    };
    
    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'status_update') {
                updateStatusDisplay(message.data);
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected - Attempting reconnect...');
        setTimeout(connectWebSocket, 3000);
    };
}

function updateStatusDisplay(data) {
    // Update online players
    if (document.getElementById('online-players')) {
        document.getElementById('online-players').textContent = data.players.online;
    }
    
    // Update server status
    const statusElement = document.getElementById('server-status');
    if (statusElement) {
        if (data.online) {
            statusElement.textContent = 'オンライン';
            statusElement.style.color = '#4CAF50';
            // Add pulsing effect
            statusElement.classList.add('status-online');
            statusElement.classList.remove('status-offline');
        } else {
            statusElement.textContent = 'オフライン';
            statusElement.style.color = '#F44336';
            statusElement.classList.add('status-offline');
            statusElement.classList.remove('status-online');
        }
    }
    
    // Update uptime
    if (data.uptime && document.getElementById('uptime')) {
        const hours = Math.floor(data.uptime / 3600);
        const minutes = Math.floor((data.uptime % 3600) / 60);
        document.getElementById('uptime').textContent = `${hours}h ${minutes}m`;
    }
    
    console.log('Status updated:', data.online ? 'ONLINE' : 'OFFLINE', `(Process: ${data.processRunning}, Port: ${data.portOpen})`);
}

// Server Status Check
async function checkServerStatus() {
    try {
        const response = await fetch('/api/status.json');
        const data = await response.json();
        
        // Update online players
        if (document.getElementById('online-players')) {
            document.getElementById('online-players').textContent = data.players.online;
        }
        
        // Update server status
        const statusElement = document.getElementById('server-status');
        if (statusElement) {
            if (data.online) {
                statusElement.textContent = 'オンライン';
                statusElement.style.color = '#4CAF50';
            } else {
                statusElement.textContent = 'オフライン';
                statusElement.style.color = '#F44336';
            }
        }
        
        // Update uptime
        if (data.uptime && document.getElementById('uptime')) {
            const hours = Math.floor(data.uptime / 3600);
            const minutes = Math.floor((data.uptime % 3600) / 60);
            document.getElementById('uptime').textContent = `${hours}h ${minutes}m`;
        }
        
    } catch (error) {
        console.error('Failed to fetch server status:', error);
        const statusElement = document.getElementById('server-status');
        if (statusElement) {
            statusElement.textContent = '確認できません';
            statusElement.style.color = '#FFC107';
        }
    }
}

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// Removed intersection observer for performance

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check server status on load
    checkServerStatus();
    
    // Connect WebSocket for real-time updates
    connectWebSocket();
    
    // Fallback: Update server status every 30 seconds via HTTP
    setInterval(checkServerStatus, 30000);
    
    // Removed parallax effect for performance
});

// Update current year in footer
const currentYear = new Date().getFullYear();
document.querySelectorAll('.footer-bottom p').forEach(el => {
    el.textContent = el.textContent.replace('2025', currentYear);
});

// Removed loading animation

// Console Easter Egg
console.log('%c⛏️ Bedrock Server', 'color: #4CAF50; font-size: 24px; font-weight: bold;');
console.log('%cサーバーに参加して冒険を始めよう！', 'color: #2196F3; font-size: 14px;');
console.log('%cschale41.jp:4096', 'color: #FFC107; font-size: 16px; font-family: monospace;');
