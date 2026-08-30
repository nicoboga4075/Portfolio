const CACHE_NAME = 'site-runtime-cache';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    // clients.claim() runs alongside the cache purge, not after it,
    // so taking control of pages isn't delayed by cleanup work.
    event.waitUntil(Promise.all([
        self.clients.claim(),
        caches.keys().then(keys =>
            Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
        )
    ]));
});

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    // Only intercept same-origin requests: proxying cross-origin ones
    // (Google Fonts, reCAPTCHA, etc.) through fetch() here reclassifies
    // them under the CSP connect-src directive instead of their real
    // one (style-src/script-src/img-src), blocking otherwise allowed assets.
    if (url.origin !== self.location.origin) {
        return;
    }

    // Netlify functions serve dynamic data (visit counter, env secrets,
    // article content) that must never be served stale from cache.
    if (url.pathname.startsWith('/.netlify/functions/')) {
        return;
    }

    // JS/CSS can carry security patches (vendored library updates), so a
    // stale cached copy shouldn't linger past one deploy the way it can
    // with stale-while-revalidate - treat them like pages instead.
    const isScriptOrStyle = /\.(js|css)$/.test(url.pathname);

    event.respondWith(
        request.mode === 'navigate' || isScriptOrStyle ? networkFirst(request) : staleWhileRevalidate(request)
    );
});

// _headers sends Cache-Control: immutable on everything, so a plain
// fetch() here would be satisfied straight from the browser's HTTP
// cache and never actually reach the network — defeating both
// strategies below. 'reload' forces each one past that layer.
function fetchFresh(request) {
    return fetch(request, { cache: 'reload' });
}

// Pages: try the network first so visitors online always get the latest
// content; fall back to a previously cached copy only when offline.
async function networkFirst(request) {
    try {
        const response = await fetchFresh(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return (await caches.match(request)) ?? Response.error();
    }
}

// Images, fonts, etc.: serve the cached copy instantly for speed, then
// refresh it in the background so the next visit picks up any change.
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const update = fetchFresh(request)
        .then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached ?? Response.error());
    return cached ?? update;
}
