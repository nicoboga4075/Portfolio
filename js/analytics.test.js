// Unit tests of js/analytics.js: it queues gtag like the Google snippet and loads gtag.js only after the page's load event, and does nothing without an id.

// The browser objects the script uses, recorded so each test can read what it did
function fakeBrowser(gaId) {
    const listeners = {};
    const appended = [];
    global.window = {
        addEventListener: (type, listener) => {
            listeners[type] = listener;
        },
    };
    global.document = {
        currentScript: gaId === undefined ? null : { dataset: { gaId } },
        createElement: tag => ({ tagName: tag }),
        head: { appendChild: element => appended.push(element) },
    };
    return { listeners, appended };
}

function runScript() {
    jest.isolateModules(() => {
        require('./analytics.js');
    });
}

afterEach(() => {
    delete global.window;
    delete global.document;
});

describe('analytics.js', () => {
    test('does nothing when the script tag has no data-ga-id', () => {
        const { listeners } = fakeBrowser(undefined);
        runScript();
        expect(window.dataLayer).toBeUndefined();
        expect(window.gtag).toBeUndefined();
        expect(listeners.load).toBeUndefined();
    });

    test('queues the js and config calls as arguments objects, like the Google snippet', () => {
        fakeBrowser('G-TEST123');
        runScript();
        expect(window.dataLayer).toHaveLength(2);
        // gtag.js only reads arguments objects, never arrays
        expect(Object.prototype.toString.call(window.dataLayer[0])).toBe('[object Arguments]');
        const [js, config] = window.dataLayer.map(args => Array.from(args));
        expect(js[0]).toBe('js');
        expect(js[1]).toBeInstanceOf(Date);
        expect(config).toEqual(['config', 'G-TEST123']);
    });

    test('keeps a dataLayer that already exists', () => {
        fakeBrowser('G-TEST123');
        window.dataLayer = ['earlier'];
        runScript();
        expect(window.dataLayer[0]).toBe('earlier');
        expect(window.dataLayer).toHaveLength(3);
    });

    test('loads gtag.js only after the load event, asynchronously and with the id', () => {
        const { listeners, appended } = fakeBrowser('G-TEST123');
        runScript();
        expect(appended).toHaveLength(0);
        listeners.load();
        expect(appended).toHaveLength(1);
        expect(appended[0]).toMatchObject({ tagName: 'script', async: true, src: 'https://www.googletagmanager.com/gtag/js?id=G-TEST123' });
    });

    test('encodes the id in the gtag.js URL', () => {
        const { listeners, appended } = fakeBrowser('G-A&B=C');
        runScript();
        listeners.load();
        expect(appended[0].src).toBe('https://www.googletagmanager.com/gtag/js?id=G-A%26B%3DC');
    });
});
