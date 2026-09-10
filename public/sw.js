// Balaji Building Material Supplier - Hand-written PWA Service Worker
const CACHE_VERSION = 'bbms-v1.2.0';
const CACHE_NAME = `bbms-cache-${CACHE_VERSION}`;

// Core static assets to precache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon-32.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/images/sand.webp',
  '/images/sand.jpg',
  '/images/khadi.webp',
  '/images/khadi.jpg',
  '/images/crush-sand.webp',
  '/images/crush-sand.jpg',
  '/images/wash-valu.webp',
  '/images/wash-valu.jpg',
  '/images/hero-truck.webp',
  '/images/hero-truck.jpg'
];

// Install event: Precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).then(() => {
        return self.skipWaiting();
      });
    })
  );
});

// Activate event: Clean up old cache versions & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('bbms-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event: Cache-first for assets, Network-first with Cache fallback for navigations
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests or browser extension/external tracking schemes
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // For HTML navigation requests: Try Network first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const indexFallback = await caches.match('/index.html');
          if (indexFallback) return indexFallback;
          return new Response(
            '<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8"><title>Offline - Balaji BM</title></head><body style="font-family:sans-serif;text-align:center;padding:40px;"><h2>तुम्ही ऑफलाइन आहात / You are offline</h2><p>कृपया इंटरनेट तपासा किंवा सेव्ह केलेले बिल पहा.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Cache-first strategy for static assets (JS, CSS, images, fonts, manifest)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache for next time (stale-while-revalidate for local assets)
        if (url.origin === self.location.origin) {
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {
            // Ignore background fetch error
          });
        }
        return cachedResponse;
      }

      // Not in cache: fetch from network and store if valid
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Cache local origin requests and Google Fonts
          if (
            url.origin === self.location.origin ||
            url.origin.includes('fonts.googleapis.com') ||
            url.origin.includes('fonts.gstatic.com')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          // If image fails offline, fallback if possible
          if (request.destination === 'image') {
            return caches.match('/favicon.svg');
          }
          return new Response('Network error occurred', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
    })
  );
});

// Immediate skipWaiting trigger from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
