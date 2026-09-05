/**
 * SAFAR PRO — Offline Service Worker
 * Version: safar-driver-v1.0.0
 * Architecture: Cache-first for core assets, stale-while-revalidate for navigation
 */

const CACHE_VERSION = 'v1.0.8';
const CACHE_NAME = `safar-app-core-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './css/style.css?v=1.0.8',
  './js/dispute-engine.js',
  './js/crowd-radar.js',
  './js/evidence-locker.js',
  './js/help-assistant.js?v=1.0.8',
  './js/main.js?v=1.0.8',
  './js/driver-mode.js?v=1.0.8',
  './js/qrcode.js',
  './js/vehicle-illustrations.js?v=1.0.8',
  './manifest.webmanifest',
  './transit-defense.html',
  './css/defense.css',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  './images/vehicles/mini-bus.svg',
  './images/vehicles/shared-cab.svg',
  './images/vehicles/tata-magic.svg',
  './images/vehicles/vikram-tempo.svg',
  './images/vehicles/e-rickshaw.svg',
  './images/vehicles/e-auto.svg',
  './images/vehicles/auto.svg',
  './images/vehicles/private-bus.svg',
  './images/vehicles/force-traveler.svg',
  './images/vehicles/taxi.svg',
  './images/vehicles/suv-taxi.svg'
];

// Install: Cache critical assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .catch((err) => {
        console.warn('[SW] Pre-cache note:', err);
      })
  );
});

// Activate: Clean up older cache versions immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for application scripts/styles to avoid stale cache, cache fallback for offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
        });
      })
  );
});

