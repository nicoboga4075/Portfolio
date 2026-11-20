/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://nicoboga.netlify.app/en"}
 */
// Unit tests of js/analytics.js: nothing goes to Google before the visitor allows audience measurement in the consent banner of js/consent.js, a later refusal switches gtag.js off and deletes the _ga cookies, and an earlier Accept loads it after the load event.

// Runs the script as the build includes it, with its data-ga-id (none when null), the stored choice of audience measurement read by hasConsent of js/consent.js; returns the load listeners it registered
function runScript(gaId = 'G-TEST123', allowed = false) {
    window.hasConsent = jest.fn(category => category === 'analytics' && allowed);
    const script = document.createElement('script');
    if (gaId !== null) {
        script.dataset.gaId = gaId;
    }
    Object.defineProperty(document, 'currentScript', { configurable: true, get: () => script });
    const addListener = jest.spyOn(window, 'addEventListener');
    jest.isolateModules(() => {
        require('./analytics.js');
    });
    return addListener.mock.calls.filter(([type]) => type === 'load').map(([, listener]) => listener);
}

const gtagScripts = () => document.head.querySelectorAll('script[src^="https://www.googletagmanager.com"]');
// A choice of the banner, as js/consent.js tells the page
const choose = analytics => document.dispatchEvent(new CustomEvent('consentchange', { detail: { analytics, services: false } }));

// Each runScript adds a consentchange listener to the document, which outlives the test: the listeners are tracked to be removed after it
let documentListeners = [];
beforeEach(() => {
    const original = document.addEventListener.bind(document);
    jest.spyOn(document, 'addEventListener').mockImplementation((type, listener, options) => {
        documentListeners.push([type, listener]);
        original(type, listener, options);
    });
});

afterEach(() => {
    documentListeners.forEach(([type, listener]) => document.removeEventListener(type, listener));
    documentListeners = [];
    jest.restoreAllMocks();
    document.head.innerHTML = '';
    document.cookie.split(';').forEach(cookie => {
        document.cookie = `${cookie.split('=')[0].trim()}=; max-age=0; path=/; secure`;
    });
    delete window.gtag;
    delete window.dataLayer;
    delete window.hasConsent;
    delete window['ga-disable-G-TEST123'];
});

describe('analytics.js', () => {
    test('does nothing when the script tag has no data-ga-id', () => {
        runScript(null, true);
        choose(true);
        expect(window.gtag).toBeUndefined();
        expect(gtagScripts()).toHaveLength(0);
    });

    test('sends nothing to Google without a choice', () => {
        const loadListeners = runScript();
        expect(loadListeners).toHaveLength(0);
        expect(window.gtag).toBeUndefined();
        expect(window.dataLayer).toBeUndefined();
        expect(gtagScripts()).toHaveLength(0);
    });

    test('loads gtag.js once audience measurement is allowed, with the id encoded and the _ga cookies limited to 13 months', () => {
        runScript('G-A&B=C');
        choose(true);
        // gtag.js only reads arguments objects, never arrays
        expect(Object.prototype.toString.call(window.dataLayer[0])).toBe('[object Arguments]');
        const [js, config] = window.dataLayer.map(args => Array.from(args));
        expect(js[0]).toBe('js');
        expect(js[1]).toBeInstanceOf(Date);
        expect(config).toEqual(['config', 'G-A&B=C', { cookie_expires: 395 * 24 * 60 * 60 }]);
        expect(gtagScripts()).toHaveLength(1);
        expect(gtagScripts()[0].async).toBe(true);
        expect(gtagScripts()[0].src).toBe('https://www.googletagmanager.com/gtag/js?id=G-A%26B%3DC');
    });

    test('keeps a dataLayer that already exists', () => {
        window.dataLayer = ['earlier'];
        runScript();
        choose(true);
        expect(window.dataLayer[0]).toBe('earlier');
        expect(window.dataLayer).toHaveLength(3);
    });

    test('loads nothing on a refusal and deletes the _ga cookies only', () => {
        document.cookie = '_ga=GA1.1.1; path=/; secure';
        document.cookie = '_ga_TEST123=GS1.1.1; path=/; secure';
        document.cookie = 'theme=dark; path=/; secure';
        runScript();
        choose(false);
        expect(window['ga-disable-G-TEST123']).toBe(true);
        expect(document.cookie).toBe('theme=dark');
        expect(gtagScripts()).toHaveLength(0);
    });

    test('switches gtag.js off on a refusal after an Accept, and back on without loading it twice', () => {
        runScript();
        choose(true);
        choose(false);
        expect(window['ga-disable-G-TEST123']).toBe(true);
        choose(true);
        expect(window['ga-disable-G-TEST123']).toBe(false);
        expect(gtagScripts()).toHaveLength(1);
    });

    test('loads gtag.js after the load event when audience measurement was allowed earlier', () => {
        const loadListeners = runScript('G-TEST123', true);
        expect(window.hasConsent).toHaveBeenCalledWith('analytics');
        expect(gtagScripts()).toHaveLength(0);
        loadListeners.forEach(listener => listener());
        expect(gtagScripts()).toHaveLength(1);
    });
});
