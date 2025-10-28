// Service Worker for Push Notifications
const CACHE_NAME = 'bedrock-server-v3.1.0';
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

// Push event (for notifications)
self.addEventListener('push', event => {
    console.log('Service Worker: Push received');
    
    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'bedrock-notification',
        requireInteraction: false
    };
    
    event.waitUntil(
        self.registration.showNotification('Bedrock Server', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/admin')
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
