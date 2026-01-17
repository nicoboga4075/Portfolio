const VERSION = new URL(self.location).searchParams.get('v') || 'dev';
const CACHE_NAME = `site-cache-${VERSION}`;

const STATIC_ASSETS = [
  '/en',
  '/fr',
  '/css/style.css',
  '/css/default.css',
  '/js/main.js',
  '/js/default.js',
  '/favicon.ico'
];

// INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        STATIC_ASSETS.map(asset =>
          fetch(asset)
            .then(res => {
              if (!res.ok) throw new Error('Bad response');
              return cache.put(asset, res);
            })
            .catch(() => null)
        )
      );
    })
  );
});

// ACTIVATE
self.addEventListener('activate', event => {
  self.clients.claim();

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('site-cache-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

// FETCH
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Ignore Netlify functions & externes
  if (
    url.pathname.startsWith('/.netlify/functions') ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }
  // API → network first, sans fallback offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  // Static → cache first
  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Resource not available', { status: 503 });
  }
}