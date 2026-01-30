/**
 * HoliBooks Service Worker
 * Provides offline support and caching for the PWA
 * 
 * @version 1.0.0
 */

const CACHE_NAME = 'holibooks-v1';
const STATIC_CACHE = 'holibooks-static-v1';
const DYNAMIC_CACHE = 'holibooks-dynamic-v1';

// Core static assets to cache on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/global.css',
  '/css/animations.css',
  '/style.css',
  '/app.js',
  '/js/utils.js',
  '/js/search.js',
  '/js/bookmarks.js',
  '/js/audio-player.js',
  '/js/language-selector.js'
];

// Religion-specific pages and assets
const RELIGION_ASSETS = [
  '/religions/islam/quran.html',
  '/religions/islam/quran.css',
  '/religions/islam/quran.js',
  '/religions/christianity/bible.html',
  '/religions/christianity/bible.css',
  '/religions/christianity/bible.js',
  '/religions/hinduism/gita.html',
  '/religions/hinduism/gita.css',
  '/religions/hinduism/gita.js',
  '/religions/judaism/torah.html',
  '/religions/judaism/torah.css',
  '/religions/judaism/torah.js',
  '/religions/sikhism/gurbani.html',
  '/religions/sikhism/gurbani.css',
  '/religions/sikhism/gurbani.js',
  '/religions/buddhism/tripitaka.html',
  '/religions/buddhism/tripitaka.css',
  '/religions/buddhism/tripitaka.js'
];

// External resources to cache
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Frank+Ruhl+Libre:wght@400;700&family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Sans+Gurmukhi:wght@400;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Devanagari:wght@400;600&display=swap'
];

// Combine all static assets
const STATIC_ASSETS = [...CORE_ASSETS, ...RELIGION_ASSETS];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing HoliBooks Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating HoliBooks Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old versioned caches
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isAPIRequest(url)) {
    // Network-first strategy for API calls
    event.respondWith(networkFirstStrategy(request));
  } else if (isStaticAsset(url)) {
    // Cache-first strategy for static assets
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Stale-while-revalidate for everything else
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

/**
 * Check if request is for an API endpoint
 * @param {URL} url
 * @returns {boolean}
 */
function isAPIRequest(url) {
  const apiHosts = [
    'api.alquran.cloud',
    'cdn.jsdelivr.net',
    'vedicscriptures.github.io',
    'gurbaninow.com',
    'api.bible'
  ];
  
  return apiHosts.some(host => url.hostname.includes(host));
}

/**
 * Check if request is for a static asset
 * @param {URL} url
 * @returns {boolean}
 */
function isStaticAsset(url) {
  const staticExtensions = [
    '.css',
    '.js',
    '.html',
    '.json',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot'
  ];
  
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

/**
 * Cache-first strategy: Try cache first, fall back to network
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Return cached version and update in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {});
    
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return cache.match('/offline.html');
    }
    throw error;
  }
}

/**
 * Network-first strategy: Try network first, fall back to cache
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

/**
 * Stale-while-revalidate strategy: Return cached version immediately, update in background
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  
  return cached || fetchPromise;
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
        icon: '/screenshots/home.png',
        badge: '/screenshots/home.png',
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
