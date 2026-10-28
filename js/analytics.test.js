/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://nicoboga.netlify.app/en"}
 */
// Unit tests of js/analytics.js: nothing goes to Google before the visitor accepts in the consent banner, the choice is kept 6 months, a refusal deletes the _ga cookies, and the footer button asks again.

const banner = '<footer><button type="button" id="consent-manage">Manage cookies</button><section id="consent-banner" hidden><button type="button" data-consent="denied">Refuse</button><button type="button" data-consent="granted">Accept</button></section></footer>';
const sixMonths = 182 * 24 * 60 * 60 * 1000;

// Runs the script as the build includes it, with its data-ga-id (none when null), after the given body; returns the load listeners it registered
function runScript(gaId = 'G-TEST123', body = banner) {
    document.body.innerHTML = body;
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

const consentBanner = () => document.getElementById('consent-banner');
const gtagScripts = () => document.head.querySelectorAll('script[src^="https://www.googletagmanager.com"]');
const storedConsent = () => JSON.parse(localStorage.getItem('analytics-consent'));
const click = selector => document.querySelector(selector).click();

function storeConsent(value, age = 0) {
    localStorage.setItem('analytics-consent', JSON.stringify({ value, date: Date.now() - age }));
}

afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    document.head.innerHTML = '';
    document.cookie.split(';').forEach(cookie => {
        document.cookie = `${cookie.split('=')[0].trim()}=; max-age=0; path=/`;
    });
    delete window.gtag;
    delete window.dataLayer;
    delete window['ga-disable-G-TEST123'];
});

describe('analytics.js', () => {
    test('does nothing when the script tag has no data-ga-id, or the page has no banner', () => {
        runScript(null);
        expect(consentBanner().hidden).toBe(true);
        runScript('G-TEST123', '<footer></footer>');
        expect(window.gtag).toBeUndefined();
        expect(gtagScripts()).toHaveLength(0);
    });

    test('shows the banner without a stored choice, and sends nothing to Google', () => {
        const loadListeners = runScript();
        expect(consentBanner().hidden).toBe(false);
        expect(loadListeners).toHaveLength(0);
        expect(window.gtag).toBeUndefined();
        expect(window.dataLayer).toBeUndefined();
        expect(gtagScripts()).toHaveLength(0);
    });

    test('loads gtag.js on Accept, with the id encoded and the _ga cookies limited to 13 months, and stores the choice', () => {
        runScript('G-A&B=C');
        click('[data-consent="granted"]');
        expect(consentBanner().hidden).toBe(true);
        expect(storedConsent()).toEqual({ value: 'granted', date: expect.any(Number) });
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
        click('[data-consent="granted"]');
        expect(window.dataLayer[0]).toBe('earlier');
        expect(window.dataLayer).toHaveLength(3);
    });

    test('loads nothing on Refuse, stores the choice and deletes the _ga cookies only', () => {
        document.cookie = '_ga=GA1.1.1; path=/';
        document.cookie = '_ga_TEST123=GS1.1.1; path=/';
        document.cookie = 'theme=dark; path=/';
        runScript();
        click('[data-consent="denied"]');
        expect(consentBanner().hidden).toBe(true);
        expect(storedConsent()).toEqual({ value: 'denied', date: expect.any(Number) });
        expect(window['ga-disable-G-TEST123']).toBe(true);
        expect(document.cookie).toBe('theme=dark');
        expect(gtagScripts()).toHaveLength(0);
    });

    test('switches gtag.js off on a refusal after an Accept, and back on without loading it twice', () => {
        runScript();
        click('[data-consent="granted"]');
        click('#consent-manage');
        click('[data-consent="denied"]');
        expect(window['ga-disable-G-TEST123']).toBe(true);
        click('#consent-manage');
        click('[data-consent="granted"]');
        expect(window['ga-disable-G-TEST123']).toBe(false);
        expect(gtagScripts()).toHaveLength(1);
    });

    test('loads gtag.js after the load event when Accept was chosen less than 6 months ago, without the banner', () => {
        storeConsent('granted', sixMonths - 60000);
        const loadListeners = runScript();
        expect(consentBanner().hidden).toBe(true);
        expect(gtagScripts()).toHaveLength(0);
        loadListeners.forEach(listener => listener());
        expect(gtagScripts()).toHaveLength(1);
    });

    test('keeps the banner hidden and loads nothing when Refuse was chosen less than 6 months ago', () => {
        storeConsent('denied', sixMonths - 60000);
        const loadListeners = runScript();
        expect(consentBanner().hidden).toBe(true);
        expect(loadListeners).toHaveLength(0);
        expect(gtagScripts()).toHaveLength(0);
    });

    test('asks again once a choice is 6 months old, or when the stored value is not JSON', () => {
        storeConsent('granted', sixMonths);
        expect(runScript()).toHaveLength(0);
        expect(consentBanner().hidden).toBe(false);
        localStorage.setItem('analytics-consent', '{');
        runScript();
        expect(consentBanner().hidden).toBe(false);
    });

    test('asks on every page when the storage is blocked, the choice still applying to the page', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        runScript();
        expect(consentBanner().hidden).toBe(false);
        click('[data-consent="granted"]');
        expect(consentBanner().hidden).toBe(true);
        expect(gtagScripts()).toHaveLength(1);
    });

    test('shows the banner again from the footer button, its first button focused', () => {
        storeConsent('denied');
        runScript();
        click('#consent-manage');
        expect(consentBanner().hidden).toBe(false);
        expect(document.activeElement).toBe(document.querySelector('[data-consent="denied"]'));
    });

    test('works without the footer button', () => {
        runScript('G-TEST123', banner.replace(/<button type="button" id="consent-manage">.*?<\/button>/, ''));
        click('[data-consent="granted"]');
        expect(gtagScripts()).toHaveLength(1);
    });
});
