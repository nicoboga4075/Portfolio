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
        request.mode === 'navigate' || isScriptOrStyle ? networkFirst(event) : staleWhileRevalidate(event)
    );
});

// _headers sends Cache-Control: immutable on everything, so a plain
// fetch() here would be satisfied straight from the browser's HTTP
// cache and never actually reach the network — defeating both
// strategies below. 'reload' forces each one past that layer.
function fetchFresh(request) {
    return fetch(request, { cache: 'reload' });
}

// Write to the cache under the event's extended lifetime so the SW isn't
// killed mid-write, and swallow put() rejections (206 Partial Content from
// <video> Range requests, QuotaExceededError) so they can't surface as
// unhandled rejections.
function cachePut(event, request, response) {
    const done = caches.open(CACHE_NAME)
        .then(cache => cache.put(request, response))
        .catch(() => {});
    event.waitUntil(done);
}

// Pages: try the network first so visitors online always get the latest
// content; fall back to a previously cached copy when offline or when the
// origin is reachable but failing (5xx / 503 during a deploy).
async function networkFirst(event) {
    const { request } = event;
    try {
        const response = await fetchFresh(request);
        if (response.ok) {
            cachePut(event, request, response.clone());
            return response;
        }
        if (response.status >= 500) {
            return (await caches.match(request)) ?? response;
        }
        return response;
    } catch {
        return (await caches.match(request)) ?? Response.error();
    }
}

// Images, fonts, etc.: serve the cached copy instantly for speed, then
// refresh it in the background so the next visit picks up any change.
async function staleWhileRevalidate(event) {
    const { request } = event;
    const cached = await caches.match(request);
    const update = fetchFresh(request)
        .then(response => {
            if (response.ok) {
                cachePut(event, request, response.clone());
            }
            return response;
        })
        .catch(() => cached ?? Response.error());
    if (cached) {
        // Keep the SW alive until the background refresh finishes.
        event.waitUntil(update.catch(() => {}));
        return cached;
    }
    return update;
}
