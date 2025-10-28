// Service Worker for Push Notifications with Web Push API
const CACHE_NAME = 'bedrock-server-v3.3.1';
const urlsToCache = [
    '/',
    '/admin',
    '/css/style.css',
    '/css/enhanced.css',
    '/css/admin.css',
    '/css/admin-enhanced.css',
    '/js/main.js',
    '/js/enhanced.js',
    '/js/admin.js',
    '/js/admin-enhanced.js',
    '/manifest.json'
];

// 最後にチェックしたイベントIDを保存
let lastCheckedEventId = 0;

// バックグラウンドで定期的にイベントをチェック
async function checkForNewEvents() {
    try {
        const response = await fetch('/api/events?limit=1');
        if (!response.ok) return;
        
        const events = await response.json();
        if (!events || events.length === 0) return;
        
        const latestEvent = events[0];
        
        // 新しいイベントがあれば通知を表示
        if (latestEvent.id > lastCheckedEventId && lastCheckedEventId !== 0) {
            console.log('🔔 New event detected:', latestEvent.title);
            
            // 日本時間でフォーマット
            const eventDate = new Date(latestEvent.event_date);
            const jstDate = new Date(eventDate.getTime() + (9 * 60 * 60 * 1000));
            const dateStr = jstDate.toLocaleString('ja-JP', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Tokyo'
            });
            
            await self.registration.showNotification('🎉 新しいイベント', {
                body: `「${latestEvent.title}」が追加されました！\n📅 ${dateStr}`,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [200, 100, 200],
                tag: 'event-notification',
                requireInteraction: false,
                data: {
                    eventId: latestEvent.id,
                    url: '/'
                }
            });
        }
        
        lastCheckedEventId = latestEvent.id;
    } catch (error) {
        console.log('Error checking events:', error);
    }
}

// 定期的にイベントをチェック（5分ごと）
setInterval(checkForNewEvents, 5 * 60 * 1000);

// Install event
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch new
                return response || fetch(event.request);
            })
    );
});

// Push event (for Web Push API notifications)
self.addEventListener('push', event => {
    console.log('🔔 Service Worker: Push notification received');
    
    let notificationData = {
        title: 'Bedrock Server',
        body: 'New notification',
        icon: '/icon-192.png'
    };
    
    // Parse notification data
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                title: data.title || notificationData.title,
                body: data.body || data.message || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: '/icon-192.png',
                vibrate: [200, 100, 200],
                tag: 'event-notification',
                requireInteraction: false,
                data: {
                    url: data.url || '/',
                    eventId: data.eventId
                }
            };
        } catch (error) {
            console.log('Error parsing push data:', error);
            notificationData.body = event.data.text();
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    // イベント通知の場合はホームページを開く
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // 既に開いているウィンドウがあればフォーカス
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // なければ新しいウィンドウを開く
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Message event (for showing notifications from main app)
self.addEventListener('message', event => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon } = event.data;
        
        self.registration.showNotification(title || 'Bedrock Server', {
            body: body || '',
            icon: icon || '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            tag: 'bedrock-notification',
            requireInteraction: false
        });
    }
});

console.log('Service Worker: Loaded');
