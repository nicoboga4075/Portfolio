self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    // clients.claim() runs alongside the cache purge, not after it,
    // so taking control of pages isn't delayed by cleanup work.
    event.waitUntil(Promise.all([
        self.clients.claim(),
        caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
    ]));
});

self.addEventListener('fetch', event => {
    // Only intercept same-origin requests: proxying cross-origin ones
    // (Google Fonts, reCAPTCHA, etc.) through fetch() here reclassifies
    // them under the CSP connect-src directive instead of their real
    // one (style-src/script-src/img-src), blocking otherwise allowed assets.
    if (new URL(event.request.url).origin !== self.location.origin) {
        return;
    }
    event.respondWith(fetch(event.request));
});
