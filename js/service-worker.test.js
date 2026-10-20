// Unit tests of service-worker.js (at the root for its / scope, tested from js/ where Jest looks): install and activate take control at once and drop the old caches, fetch skips what it must not touch, pages, scripts and styles go network first, the other assets stale-while-revalidate.

const ORIGIN = 'https://nicoboga.netlify.app';
const CACHE_NAME = 'site-runtime-cache';

// The worker globals the script uses, recorded so each test can read what it did; cached maps a URL to the Response already in the cache
function fakeWorker({ cacheNames = [], cached = {}, putFails = false } = {}) {
    const listeners = {};
    const store = new Map(Object.entries(cached));
    const cache = {
        put: jest.fn((request, response) => {
            if (putFails) {
                return Promise.reject(new DOMException('Quota exceeded', 'QuotaExceededError'));
            }
            store.set(request.url, response);
            return Promise.resolve();
        }),
    };
    global.self = {
        location: { origin: ORIGIN },
        addEventListener: (type, listener) => {
            listeners[type] = listener;
        },
        skipWaiting: jest.fn(),
        clients: { claim: jest.fn(() => Promise.resolve()) },
    };
    global.caches = {
        keys: jest.fn(() => Promise.resolve(cacheNames)),
        delete: jest.fn(() => Promise.resolve(true)),
        open: jest.fn(() => Promise.resolve(cache)),
        match: jest.fn(request => Promise.resolve(store.get(request.url))),
    };
    global.fetch = jest.fn();
    jest.isolateModules(() => {
        require('../service-worker.js');
    });
    return { listeners, cache, store };
}

// A fetch event for a request of the site, with the promises given to respondWith and waitUntil kept for the test
function fetchEvent(path, { method = 'GET', mode = 'no-cors', origin = ORIGIN } = {}) {
    const event = {
        request: { method, mode, url: origin + path },
        responded: undefined,
        waited: [],
        respondWith: jest.fn(promise => {
            event.responded = promise;
        }),
        waitUntil: jest.fn(promise => {
            event.waited.push(promise);
        }),
    };
    return event;
}

// Runs a fetch event and returns the response given to the page, once the background work is done too
async function dispatchFetch(listeners, event) {
    listeners.fetch(event);
    const response = await event.responded;
    await Promise.all(event.waited);
    return response;
}

afterEach(() => {
    delete global.self;
    delete global.caches;
    delete global.fetch;
});

describe('service-worker.js', () => {
    describe('install', () => {
        test('skips waiting so the new worker activates at once', () => {
            const { listeners } = fakeWorker();
            listeners.install({});
            expect(self.skipWaiting).toHaveBeenCalledTimes(1);
        });
    });

    describe('activate', () => {
        test('claims the open pages and deletes every cache but the current one', async () => {
            const { listeners } = fakeWorker({ cacheNames: ['old-cache', CACHE_NAME, 'other-cache'] });
            const event = { waitUntil: jest.fn() };
            listeners.activate(event);
            await event.waitUntil.mock.calls[0][0];
            expect(self.clients.claim).toHaveBeenCalledTimes(1);
            expect(caches.delete).toHaveBeenCalledTimes(2);
            expect(caches.delete).toHaveBeenCalledWith('old-cache');
            expect(caches.delete).toHaveBeenCalledWith('other-cache');
            expect(caches.delete).not.toHaveBeenCalledWith(CACHE_NAME);
        });
    });

    describe('fetch, requests left to the browser', () => {
        test('does not answer a request other than GET', () => {
            const { listeners } = fakeWorker();
            const event = fetchEvent('/api/contact', { method: 'POST' });
            listeners.fetch(event);
            expect(event.respondWith).not.toHaveBeenCalled();
        });

        test('does not answer a cross-origin request, so the CSP keeps its own directive', () => {
            const { listeners } = fakeWorker();
            const event = fetchEvent('/css2?family=Poppins', { origin: 'https://fonts.googleapis.com' });
            listeners.fetch(event);
            expect(event.respondWith).not.toHaveBeenCalled();
        });

        test('does not answer a Netlify function, whose data must never come from the cache', () => {
            const { listeners } = fakeWorker();
            const event = fetchEvent('/.netlify/functions/visits');
            listeners.fetch(event);
            expect(event.respondWith).not.toHaveBeenCalled();
        });
    });

    describe('fetch, network first (pages, scripts and styles)', () => {
        test.each([
            ['a page', '/index_en.html', 'navigate'],
            ['a script', '/js/app.js', 'no-cors'],
            ['a style sheet', '/css/common.css', 'no-cors'],
        ])('answers %s from the network past the HTTP cache and caches it', async (_, path, mode) => {
            const { listeners, cache, store } = fakeWorker({ cached: { [ORIGIN + path]: new Response('old') } });
            fetch.mockResolvedValue(new Response('new'));
            const event = fetchEvent(path, { mode });
            const response = await dispatchFetch(listeners, event);
            expect(fetch).toHaveBeenCalledWith(event.request, { cache: 'reload' });
            expect(await response.text()).toBe('new');
            expect(caches.open).toHaveBeenCalledWith(CACHE_NAME);
            expect(cache.put).toHaveBeenCalledTimes(1);
            expect(await store.get(ORIGIN + path).text()).toBe('new');
        });

        test('answers the cached copy when the server fails with a 5xx', async () => {
            const { listeners, cache } = fakeWorker({ cached: { [`${ORIGIN}/index_en.html`]: new Response('cached') } });
            fetch.mockResolvedValue(new Response('down', { status: 503 }));
            const response = await dispatchFetch(listeners, fetchEvent('/index_en.html', { mode: 'navigate' }));
            expect(await response.text()).toBe('cached');
            expect(cache.put).not.toHaveBeenCalled();
        });

        test('answers the 5xx itself when nothing is cached', async () => {
            const { listeners } = fakeWorker();
            fetch.mockResolvedValue(new Response('down', { status: 503 }));
            const response = await dispatchFetch(listeners, fetchEvent('/index_en.html', { mode: 'navigate' }));
            expect(response.status).toBe(503);
        });

        test('answers a 4xx as it is, without caching it or reading the cache', async () => {
            const { listeners, cache } = fakeWorker({ cached: { [`${ORIGIN}/gone.html`]: new Response('cached') } });
            fetch.mockResolvedValue(new Response('not found', { status: 404 }));
            const response = await dispatchFetch(listeners, fetchEvent('/gone.html', { mode: 'navigate' }));
            expect(response.status).toBe(404);
            expect(caches.match).not.toHaveBeenCalled();
            expect(cache.put).not.toHaveBeenCalled();
        });

        test('answers the cached copy when offline', async () => {
            const { listeners } = fakeWorker({ cached: { [`${ORIGIN}/js/app.js`]: new Response('cached') } });
            fetch.mockRejectedValue(new TypeError('Failed to fetch'));
            const response = await dispatchFetch(listeners, fetchEvent('/js/app.js'));
            expect(await response.text()).toBe('cached');
        });

        test('answers a network error when offline and nothing is cached', async () => {
            const { listeners } = fakeWorker();
            fetch.mockRejectedValue(new TypeError('Failed to fetch'));
            const response = await dispatchFetch(listeners, fetchEvent('/index_en.html', { mode: 'navigate' }));
            expect(response.type).toBe('error');
        });

        test('treats a script with a query string as a script, not as an other asset', async () => {
            const { listeners } = fakeWorker({ cached: { [`${ORIGIN}/js/app.js?v=2`]: new Response('old') } });
            fetch.mockResolvedValue(new Response('new'));
            const response = await dispatchFetch(listeners, fetchEvent('/js/app.js?v=2'));
            expect(await response.text()).toBe('new');
        });

        test('still answers the page when the cache refuses the write', async () => {
            const { listeners, cache } = fakeWorker({ putFails: true });
            fetch.mockResolvedValue(new Response('new'));
            const event = fetchEvent('/index_en.html', { mode: 'navigate' });
            const response = await dispatchFetch(listeners, event);
            expect(await response.text()).toBe('new');
            expect(cache.put).toHaveBeenCalledTimes(1);
            // the write is kept alive by waitUntil and its rejection is swallowed
            expect(event.waitUntil).toHaveBeenCalledTimes(1);
            await expect(event.waited[0]).resolves.toBeUndefined();
        });
    });

    describe('fetch, stale-while-revalidate (images, fonts and other assets)', () => {
        test('answers the cached copy at once and refreshes it in the background', async () => {
            const { listeners, store } = fakeWorker({ cached: { [`${ORIGIN}/images/me.webp`]: new Response('old') } });
            fetch.mockResolvedValue(new Response('new'));
            const event = fetchEvent('/images/me.webp');
            const response = await dispatchFetch(listeners, event);
            expect(await response.text()).toBe('old');
            expect(fetch).toHaveBeenCalledWith(event.request, { cache: 'reload' });
            // one waitUntil keeps the worker alive for the refresh, one for the cache write
            expect(event.waitUntil).toHaveBeenCalledTimes(2);
            expect(await store.get(`${ORIGIN}/images/me.webp`).text()).toBe('new');
        });

        test('keeps the cached copy when the background refresh fails', async () => {
            const { listeners, cache } = fakeWorker({ cached: { [`${ORIGIN}/fonts/poppins.woff2`]: new Response('cached') } });
            fetch.mockRejectedValue(new TypeError('Failed to fetch'));
            const event = fetchEvent('/fonts/poppins.woff2');
            const response = await dispatchFetch(listeners, event);
            expect(await response.text()).toBe('cached');
            expect(cache.put).not.toHaveBeenCalled();
            await expect(event.waited[0]).resolves.toBe(response);
        });

        test('answers from the network and caches it when nothing is cached', async () => {
            const { listeners, cache, store } = fakeWorker();
            fetch.mockResolvedValue(new Response('fresh'));
            const response = await dispatchFetch(listeners, fetchEvent('/images/me.webp'));
            expect(await response.text()).toBe('fresh');
            expect(cache.put).toHaveBeenCalledTimes(1);
            expect(await store.get(`${ORIGIN}/images/me.webp`).text()).toBe('fresh');
        });

        test('answers a failed response without caching it', async () => {
            const { listeners, cache } = fakeWorker();
            fetch.mockResolvedValue(new Response('not found', { status: 404 }));
            const response = await dispatchFetch(listeners, fetchEvent('/images/missing.webp'));
            expect(response.status).toBe(404);
            expect(cache.put).not.toHaveBeenCalled();
        });

        test('does not overwrite the cached copy with a failed background refresh', async () => {
            const { listeners, cache } = fakeWorker({ cached: { [`${ORIGIN}/images/me.webp`]: new Response('old') } });
            fetch.mockResolvedValue(new Response('down', { status: 503 }));
            const response = await dispatchFetch(listeners, fetchEvent('/images/me.webp'));
            expect(await response.text()).toBe('old');
            expect(cache.put).not.toHaveBeenCalled();
        });

        test('answers a network error when offline and nothing is cached', async () => {
            const { listeners } = fakeWorker();
            fetch.mockRejectedValue(new TypeError('Failed to fetch'));
            const response = await dispatchFetch(listeners, fetchEvent('/images/me.webp'));
            expect(response.type).toBe('error');
        });
    });
});
