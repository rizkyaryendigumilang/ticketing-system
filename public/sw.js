/**
 * Service Worker for Helpdesk VPS CRM PWA.
 * Provides offline caching for the application shell, assets, icons, and web fonts,
 * while passing PocketBase API requests and Realtime SSE directly to network.
 */

const CACHE_NAME = 'helpdesk-pwa-v2';

const STATIC_PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];

// 1. INSTALL
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_PRECACHE))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[PWA SW] Precache failed:', err)),
  );
});

// 2. ACTIVATE (Delete old cache versions to free up storage)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// 3. FETCH STRATEGY
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET requests (e.g. POST / PUT / PATCH)
  if (request.method !== 'GET') {
    return;
  }

  // Bypass PocketBase backend API and Realtime SSE
  if (
    url.pathname.includes('/helpdesk-pb/') ||
    url.pathname.includes('/api/realtime') ||
    url.pathname.includes(':8090') ||
    url.pathname.includes(':8094')
  ) {
    return;
  }

  // Google Fonts & Web Fonts: Cache-First (Hardware & Network friendly)
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // For static fingerprinted assets (/assets/*): Cache-First
  if (url.pathname.includes('/assets/') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.png')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // For navigation requests & app shell: Network-First with Cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match('./index.html');
          return fallback || Response.error();
        }),
    );
    return;
  }

  // Default: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});
