/**
 * CyberShield X — Self-Purging Service Worker
 * Ensures all legacy caches (including stale index.html) are deleted immediately
 * and all client requests are routed directly to the network.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Purging legacy cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Pass all requests directly to network to avoid stale SPA chunks
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
