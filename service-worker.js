self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
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
