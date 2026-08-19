/**
 * SAFAR — Progressive Web App Service Worker (v4.0.0)
 * Implements Cache-First strategy for App Shell, Network-First for Data APIs,
 * and direct Network bypass for Sensitive Payments, OTPs, and SSE real-time streams.
 */

const SHELL_CACHE = 'safar-shell-v4';
const DATA_CACHE = 'safar-data-v4';

const APP_SHELL = [
  '/',
  '/index.html',
  '/css/style.css',
  '/manifest.webmanifest',
  '/js/app.js',
  '/js/offline-manager.js',
  '/js/offline-store.js',
  '/js/translations.js',
  '/js/routes.js',
  '/js/fare-rules.js',
  '/js/live-tracker.js',
  '/js/features/map/commuter-map.js',
  '/js/features/fare/fare-ui.js',
  '/js/features/driver/driver-console.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Cache addAll partial warning:', err.message);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== SHELL_CACHE && key !== DATA_CACHE) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. DIRECT NETWORK BYPASS: Sensitive Payment, OTP, Admin, and Metrics endpoints
  if (
    url.pathname.startsWith('/api/v1/trips/') ||
    url.pathname.startsWith('/api/v1/payment') ||
    url.pathname.startsWith('/api/v1/otp') ||
    url.pathname.startsWith('/api/v1/auth') ||
    url.pathname.startsWith('/api/v1/admin') ||
    url.pathname === '/metrics' ||
    url.pathname === '/healthz' ||
    url.pathname === '/readyz'
  ) {
    return; // Pass through to network directly without caching
  }

  // 2. DIRECT NETWORK BYPASS: SSE Real-Time Telemetry Stream
  if (url.pathname === '/api/v1/telemetry/stream') {
    return; // Streaming responses must not be buffered by Service Worker
  }

  // 3. APP SHELL: Cache-First with Background Stale-While-Revalidate Update
  if (event.request.mode === 'navigate' || APP_SHELL.some(asset => url.pathname.endsWith(asset) || url.pathname === asset)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. PUBLIC DATA APIS (Routes, SRO Fares, Active Telemetry): Network-First, Cache Fallback
  if (url.pathname.startsWith('/api/v1/') && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true, error: 'OFFLINE_CACHED_FALLBACK' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
});
