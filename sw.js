/**
 * HoliBooks Service Worker
 * Provides offline support and caching for the PWA
 *
 * @version 2.0.2
 */

const STATIC_CACHE = 'holibooks-static-v2.0.2';
const DYNAMIC_CACHE = 'holibooks-dynamic-v2.0.2';
const OFFLINE_URL = '/offline.html';

// Everything a page needs to render, listed under the exact URL the pages
// request (including the ?v= cache-buster): a cache lookup does not ignore
// the query string, so a bare path here would never be found.
// tests/sw.test.mjs fails if a page asks for an asset that is missing here.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/global.css?v=2.0.2',
  '/css/animations.css?v=2.0.2',
  '/js/utils.js?v=2.0.2',
  '/js/api-monitor.js?v=2.0.2',
  '/js/search.js?v=2.0.2',
  '/js/bookmarks.js?v=2.0.2',
  '/js/audio-player.js?v=2.0.2',
  '/js/language-selector.js?v=2.0.2',
  '/religions/islam/quran.html',
  '/religions/islam/quran.css?v=2.0.2',
  '/religions/islam/quran.js?v=2.0.2',
  '/religions/christianity/bible.html',
  '/religions/christianity/bible.css?v=2.0.2',
  '/religions/christianity/bible.js?v=2.0.2',
  '/religions/hinduism/gita.html',
  '/religions/hinduism/gita.css?v=2.0.2',
  '/religions/hinduism/gita.js?v=2.0.2',
  '/religions/judaism/torah.html',
  '/religions/judaism/torah.css?v=2.0.2',
  '/religions/judaism/torah.js?v=2.0.2',
  '/religions/sikhism/gurbani.html',
  '/religions/sikhism/gurbani.css?v=2.0.2',
  '/religions/sikhism/gurbani.js?v=2.0.2',
  '/religions/buddhism/tripitaka.html',
  '/religions/buddhism/tripitaka.css?v=2.0.2',
  '/religions/buddhism/dhammapada-data.js?v=2.0.2',
  '/religions/buddhism/tripitaka.js?v=2.0.2'
];

// Scripture APIs whose responses are kept for offline re-reading.
// vedicscriptures.github.io is left out on purpose: its responses are 16-100 KB
// per verse and the Gita reader keeps its own compact per-chapter cache.
const API_HOSTS = [
  'api.alquran.cloud',
  'cdn.jsdelivr.net',
  'api.gurbaninow.com'
];

// Install event - cache the app shell
self.addEventListener('install', (event) => {
  // No catch here: if any file cannot be cached the install fails and the
  // browser retries later, instead of activating a half-cached worker.
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
          .map((cacheName) => caches.delete(cacheName))
      ))
      // Open tabs are taken over but not reloaded: pages are fetched
      // network-first, so the next navigation picks up a new deployment
      // without discarding the reader's place or stopping audio.
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
  } else if (API_HOSTS.includes(url.hostname)) {
    event.respondWith(networkFirst(request));
  } else if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
  }
  // Anything else (fonts, audio, the Gita API) goes straight to the network.
});

/**
 * Pages: network first, so a new deployment is seen as soon as the device is
 * online. Offline, fall back to the cached page - ignoring the query string,
 * because readers are opened as quran.html?surah=2 but cached as quran.html -
 * and finally to the offline page.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleNavigation(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return (await caches.match(request))
      || (await caches.match(request, { ignoreSearch: true }))
      || (await caches.match(OFFLINE_URL))
      || Response.error();
  }
}

/**
 * Same-origin assets: serve the cached copy and refresh it in the background;
 * fetch and cache on a miss.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) {
    fetch(request)
      .then((response) => {
        if (response.ok) {
          return caches.open(STATIC_CACHE).then((cache) => cache.put(request, response));
        }
      })
      .catch(() => {});

    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return Response.error();
  }
}

/**
 * API calls: network first, fall back to the last cached answer.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return (await cache.match(request)) || Response.error();
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookmarks') {
    event.waitUntil(syncBookmarks());
  }
});

async function syncBookmarks() {
  // Future: Sync bookmarks when back online
  console.log('[SW] Syncing bookmarks...');
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/icon-192.png',
        data: data.data
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
