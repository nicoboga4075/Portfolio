// Unit tests of js/common.js, the helpers shared by every page: routes, dates, the language switcher, images, the theme cycle, the redirect links, the service worker, the loader and the copyright year, on a fake page.

// The routes meta base.njk writes from package.json, read by common.js on load
const routesMeta = { content: JSON.stringify(require('../package.json').routes.appRoutes) };

// A storage like localStorage and sessionStorage
function fakeStorage(entries = {}) {
    const map = new Map(Object.entries(entries));
    return {
        getItem: key => (map.has(key) ? map.get(key) : null),
        setItem: (key, value) => map.set(key, String(value)),
        removeItem: key => map.delete(key),
        clear: () => map.clear(),
        get size() {
            return map.size;
        }
    };
}

// An element with the parts of the DOM the helpers use
function fakeElement(props = {}) {
    const attributes = new Map(Object.entries(props.attributes ?? {}));
    const classes = new Set(props.classes ?? []);
    const element = {
        id: props.id ?? '',
        tagName: props.tagName ?? 'DIV',
        style: {},
        dataset: props.dataset ?? {},
        textContent: '',
        listeners: {},
        children: props.children ?? {},
        classList: {
            toggle: (name, force) => (force ? classes.add(name) : classes.delete(name)),
            remove: name => classes.delete(name),
            contains: name => classes.has(name)
        },
        setAttribute: (name, value) => attributes.set(name, String(value)),
        getAttribute: name => (attributes.has(name) ? attributes.get(name) : null),
        removeAttribute: name => attributes.delete(name),
        hasAttribute: name => attributes.has(name),
        addEventListener: (type, listener) => {
            element.listeners[type] = listener;
        },
        querySelector: selector => element.children[selector] ?? null
    };
    return Object.assign(element, props.extra ?? {});
}

// A language switcher link, with the server-rendered href of that language
function switcherLink(lang) {
    return fakeElement({ attributes: {}, extra: { hreflang: lang, href: `/${lang}` } });
}

// The page: its URL, language, switcher links, stored theme, OS setting, elements by id, and what the script does to them
function fakePage({ url = 'https://nicoboga.netlify.app/en', lang = 'en', languages = ['en', 'fr'], theme, prefersDark = false, elements = {}, metas = {}, serviceWorker } = {}) {
    const location = new URL(url);
    const links = languages.map(switcherLink);
    const media = { matches: prefersDark, listeners: {}, addEventListener: (type, listener) => { media.listeners[type] = listener; } };
    const events = [];
    const classes = new Set();
    global.window = {
        location: { pathname: location.pathname, href: location.href, origin: location.origin },
        matchMedia: jest.fn(() => media)
    };
    global.localStorage = fakeStorage(theme ? { theme } : {});
    global.sessionStorage = fakeStorage();
    global.getComputedStyle = () => ({ getPropertyValue: name => (name === '--background-color' ? ' #101010 ' : '') });
    if (serviceWorker === undefined) {
        Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
    } else {
        Object.defineProperty(global, 'navigator', { value: { serviceWorker }, configurable: true });
    }
    global.document = {
        documentElement: { lang, classList: { toggle: (name, force) => (force ? classes.add(name) : classes.delete(name)) } },
        querySelectorAll: jest.fn(selector => (selector === '#language-switcher [hreflang]' ? links : elements[`all:${selector}`] ?? [])),
        querySelector: jest.fn(selector => ({ 'meta[name="routes"]': routesMeta, ...metas })[selector] ?? null),
        getElementById: jest.fn(id => elements[id] ?? null),
        dispatchEvent: event => events.push(event.type)
    };
    return { links, media, events, classes, elements };
}

// Loads common.js on the current fake page, as the deferred script tag does, and returns its helpers
function load() {
    let helpers;
    jest.isolateModules(() => {
        helpers = require('./common.js');
    });
    return helpers;
}

afterEach(() => {
    for (const name of ['window', 'document', 'localStorage', 'sessionStorage', 'getComputedStyle', 'navigator']) delete global[name];
    jest.restoreAllMocks();
});

describe('routes', () => {
    test('give the route of the current path, and error404 for any other path', () => {
        const cases = { '/en': 'index', '/fr/': 'index', '/en/blog': 'blog', '/fr/policy': 'policy', '/en/terms': 'terms', '/404': 'error404', '/en/unknown': 'error404', '/': 'error404' };
        const routes = Object.keys(cases).map(path => {
            fakePage({ url: `https://nicoboga.netlify.app${path}` });
            return [path, load().getCurrentRoute()];
        });
        expect(Object.fromEntries(routes)).toEqual(cases);
    });

    test('read the languages of the switcher, the page language and the remembered hash', () => {
        fakePage({ lang: 'fr', languages: ['en', 'fr', 'es'] });
        const helpers = load();
        expect([...helpers.appLanguages]).toEqual(['en', 'fr', 'es']);
        expect(helpers.getCurrentLanguage()).toBe('fr');
        expect(helpers.getHashFromSession()).toBeNull();
        sessionStorage.setItem('currentHash', 'about-section');
        expect(helpers.getHashFromSession()).toBe('about-section');
    });
});

describe('capitalize', () => {
    test('capitalizes every word and lowers the rest, keeping empty words between double spaces', () => {
        fakePage();
        const { capitalize } = load();
        expect(capitalize('sAMEDI 1 JANVIER', 'fr')).toBe('Samedi 1 Janvier');
        expect(capitalize('a  b', 'en')).toBe('A  B');
    });

    test('only capitalizes the first letter when allWords is false', () => {
        fakePage();
        expect(load().capitalize('hello wORLD', 'en', false)).toBe('Hello wORLD');
    });
});

describe('convertDate and getCurrentFullDate', () => {
    test('write a date in the language, long and capitalized by default', () => {
        fakePage();
        const { convertDate } = load();
        expect(convertDate('2000-01-01T13:05:09', 'fr')).toBe('1 Janvier 2000');
        expect(convertDate('2000-01-01T13:05:09', 'en', { dateStyle: 'long', timeStyle: 'short' })).toBe('January 1, 2000 At 1:05 Pm');
        expect(convertDate('2000-01-01T13:05:09', 'fr', { dateStyle: 'medium' }, false)).toBe('1 janv. 2000');
    });

    test('use now when no date is given', () => {
        fakePage();
        jest.spyOn(Date, 'now').mockReturnValue(new Date('2000-01-01T13:05:09').getTime());
        const { convertDate, getCurrentFullDate } = load();
        expect(convertDate(undefined, 'en')).toBe('January 1, 2000');
        expect(getCurrentFullDate('fr')).toBe('01/01/2000 13:05:09');
        expect(getCurrentFullDate('fr', false)).toBe('01/01/2000');
    });
});

describe('parseDate', () => {
    test('reads a written date back as dd/mm/yyyy, or yyyy-mm-dd with iso', () => {
        fakePage();
        const { parseDate } = load();
        expect(parseDate('January 1, 2000', 'en')).toBe('01/01/2000');
        expect(parseDate('1 JANVIER 2000', 'fr')).toBe('01/01/2000');
        expect(parseDate('1 janvier 2000', 'fr', true)).toBe('2000-01-01');
    });

    test('keeps the time in 24h, with its seconds, and converts am / pm', () => {
        fakePage();
        const { parseDate } = load();
        expect(parseDate('1 janvier 2000 à 13:05', 'fr')).toBe('01/01/2000 13:05');
        expect(parseDate('January 1, 2000 at 1:05:09 PM', 'en')).toBe('01/01/2000 13:05:09');
        expect(parseDate('January 1, 2000 at 12:05 AM', 'en')).toBe('01/01/2000 00:05');
        expect(parseDate('January 1, 2000 at 1:05 PM', 'en', true)).toBe('2000-01-01T13:05');
    });

    test('keeps the 12h time with hour12, but not in iso', () => {
        fakePage();
        const { parseDate } = load();
        expect(parseDate('January 1, 2000 at 1:05 PM', 'en', false, true)).toBe('01/01/2000 1:05 PM');
        expect(parseDate('January 1, 2000 at 1:05 PM', 'en', true, true)).toBe('2000-01-01T13:05');
        expect(parseDate('1 janvier 2000 à 13:05', 'fr', false, true)).toBe('01/01/2000 13:05');
    });
});

describe('switchLanguage', () => {
    test('swaps the language of the path and keeps the hash of the URL', () => {
        fakePage();
        expect(load().switchLanguage('https://nicoboga.netlify.app/en/blog?x=1#mcs', 'fr')).toBe('/fr/blog?x=1#mcs');
    });

    test('takes the remembered hash when the URL has none, and drops a hash that is not a plain id', () => {
        fakePage();
        const { switchLanguage } = load();
        sessionStorage.setItem('currentHash', 'resume-section');
        expect(switchLanguage('/en', 'fr')).toBe('/fr#resume-section');
        sessionStorage.setItem('currentHash', 'x"><script>');
        expect(switchLanguage('/en', 'fr')).toBe('/fr');
        sessionStorage.clear();
        expect(switchLanguage('/en', 'fr')).toBe('/fr');
    });

    test('gives /404 and logs when the path does not start with a language, or the URL is invalid', () => {
        fakePage();
        const { switchLanguage } = load();
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(switchLanguage('/de/blog', 'fr')).toBe('/404');
        expect(switchLanguage('/', 'fr')).toBe('/404');
        expect(switchLanguage('http://[invalid', 'fr')).toBe('/404');
        expect(log).toHaveBeenCalledTimes(3);
    });
});

describe('initTranslator', () => {
    test('marks the current language and refreshes every href with the remembered hash', () => {
        const { links } = fakePage({ url: 'https://nicoboga.netlify.app/fr/blog', lang: 'fr' });
        load();
        sessionStorage.setItem('currentHash', 'mcs');
        links[0].setAttribute('aria-current', 'page');
        load().initTranslator();
        const [en, fr] = links;
        expect(en.classList.contains('on')).toBe(false);
        expect(en.hasAttribute('aria-current')).toBe(false);
        expect(en.href).toBe('/en/blog#mcs');
        expect(fr.classList.contains('on')).toBe(true);
        expect(fr.getAttribute('aria-current')).toBe('page');
        expect(fr.href).toBe('/fr/blog#mcs');
    });

    test('keeps the server-rendered href when the page URL has no language', () => {
        const { links } = fakePage({ url: 'https://nicoboga.netlify.app/404' });
        jest.spyOn(console, 'error').mockImplementation(() => {});
        load().initTranslator();
        expect(links.map(link => link.href)).toEqual(['/en', '/fr']);
    });
});

describe('loadImages', () => {
    test('sets the src of an img and the background of any other element, from images/<id>.<extension>', () => {
        const img = fakeElement({ id: 'photo', tagName: 'IMG' });
        const div = fakeElement({ id: 'logo', tagName: 'DIV' });
        fakePage({ elements: { 'all:.pictures': [img, div] } });
        load().loadImages('.pictures', 'png');
        expect(img.src).toBe('images/photo.png');
        expect(div.style.backgroundImage).toBe('url(images/logo.png)');
    });

    test('stops after the first element with one', () => {
        const first = fakeElement({ id: 'a', tagName: 'IMG' });
        const second = fakeElement({ id: 'b', tagName: 'IMG' });
        fakePage({ elements: { 'all:.pictures': [first, second] } });
        load().loadImages('.pictures', 'svg', true);
        expect(first.src).toBe('images/a.svg');
        expect(second.src).toBeUndefined();
    });
});

describe('theme', () => {
    test('follows the OS setting in auto, and the stored choice otherwise', () => {
        fakePage({ prefersDark: true });
        expect(load().isDarkModePreferred()).toBe(true);
        fakePage({ prefersDark: true, theme: 'light' });
        const helpers = load();
        expect(helpers.getThemeChoice()).toBe('light');
        expect(helpers.isDarkModePreferred()).toBe(false);
        fakePage({ theme: 'dark' });
        expect(load().isDarkModePreferred()).toBe(true);
    });

    test('is applied on load: the dark-mode class, the theme-color meta and the darkmodechange event', () => {
        const themeColor = fakeElement();
        const page = fakePage({ theme: 'dark', metas: { 'meta[name="theme-color"]': themeColor } });
        load();
        expect(page.classes.has('dark-mode')).toBe(true);
        expect(themeColor.content).toBe('#101010');
        expect(page.events).toEqual(['darkmodechange']);
    });

    test('cycles auto, light, dark and back to auto on each click, which forgets the stored choice', () => {
        const page = fakePage();
        const { toggleDarkMode } = load();
        const click = () => ({ preventDefault: jest.fn(), stopPropagation: jest.fn() });
        const event = click();
        toggleDarkMode(event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(localStorage.getItem('theme')).toBe('light');
        toggleDarkMode(click());
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(page.classes.has('dark-mode')).toBe(true);
        toggleDarkMode(click());
        expect(localStorage.getItem('theme')).toBeNull();
        expect(page.classes.has('dark-mode')).toBe(false);
    });

    test('follows a change of the OS setting in auto only', () => {
        const page = fakePage();
        load();
        page.media.matches = true;
        page.media.listeners.change();
        expect(page.classes.has('dark-mode')).toBe(true);
        localStorage.setItem('theme', 'light');
        page.media.listeners.change();
        expect(page.classes.has('dark-mode')).toBe(true);
    });

    test('swaps the icon class and the sr-only label on a page with the icon font, and the title before the tooltip exists', () => {
        const srOnly = fakeElement();
        const icon = fakeElement({ id: 'dark-icon', attributes: { title: 'Auto' }, dataset: { labelAuto: 'Auto', labelLight: 'Light', labelDark: 'Dark' }, children: { '.sr-only': srOnly } });
        fakePage({ theme: 'light', elements: { 'dark-icon': icon } });
        load();
        expect(icon.className).toBe('icon-sun-o');
        expect(srOnly.textContent).toBe('Light');
        expect(icon.title).toBe('Light');
    });

    test('swaps the emoji of the aria-hidden span on a page without the icon font, with no title to update', () => {
        const srOnly = fakeElement();
        const span = fakeElement({ dataset: { emojiAuto: '🌓', emojiLight: '☀️', emojiDark: '🌙' } });
        const icon = fakeElement({ id: 'dark-icon', dataset: { iconMode: 'emoji', labelAuto: 'Auto', labelLight: 'Light', labelDark: 'Dark' }, children: { '.sr-only': srOnly, 'span[aria-hidden]': span } });
        fakePage({ theme: 'dark', elements: { 'dark-icon': icon } });
        load();
        expect(span.textContent).toBe('🌙');
        expect(srOnly.textContent).toBe('Dark');
        expect(icon.title).toBeUndefined();
    });

    test('updates the Bootstrap tooltip text, and an open tooltip in place', () => {
        const srOnly = fakeElement();
        const inner = fakeElement();
        const openTip = fakeElement({ id: 'tooltip1', children: { '.tooltip-inner': inner } });
        const icon = fakeElement({ id: 'dark-icon', attributes: { 'aria-describedby': 'tooltip1' }, dataset: { originalTitle: 'Auto', labelAuto: 'Auto', labelLight: 'Light', labelDark: 'Dark' }, children: { '.sr-only': srOnly }, extra: { tooltip: { update: jest.fn() } } });
        fakePage({ elements: { 'dark-icon': icon, tooltip1: openTip } });
        const { toggleDarkMode } = load();
        toggleDarkMode({ preventDefault() {}, stopPropagation() {} });
        expect(icon.dataset.originalTitle).toBe('Light');
        expect(inner.textContent).toBe('Light');
        expect(icon.tooltip.update).toHaveBeenCalled();
        // Without an open tooltip, nor a tooltip object yet, only data-original-title changes
        delete icon.tooltip;
        icon.removeAttribute('aria-describedby');
        toggleDarkMode({ preventDefault() {}, stopPropagation() {} });
        expect(icon.dataset.originalTitle).toBe('Dark');
        expect(inner.textContent).toBe('Light');
        // An open tooltip without a tooltip object: the text changes, no update to call
        icon.setAttribute('aria-describedby', 'tooltip1');
        toggleDarkMode({ preventDefault() {}, stopPropagation() {} });
        expect(inner.textContent).toBe('Auto');
    });
});

describe('addRedirectById', () => {
    test('gives each route link its path in the page language, and clears the remembered hash on click', () => {
        const blog = fakeElement({ id: 'blog' });
        fakePage({ lang: 'fr', elements: { blog } });
        load();
        expect(blog.getAttribute('href')).toBe('/fr/blog');
        sessionStorage.setItem('currentHash', 'mcs');
        blog.listeners.click();
        expect(sessionStorage.size).toBe(0);
    });

    test('sends an unknown id to the home page of the language, and skips a missing element', () => {
        const other = fakeElement({ id: 'other' });
        fakePage({ elements: { other } });
        const { addRedirectById } = load();
        addRedirectById('other');
        expect(other.getAttribute('href')).toBe('/en');
        expect(() => addRedirectById('missing')).not.toThrow();
    });

    test('marks the policy link of the policy page as current, without the click handler', () => {
        const policy = fakeElement({ id: 'policy' });
        const terms = fakeElement({ id: 'terms' });
        fakePage({ url: 'https://nicoboga.netlify.app/en/policy', elements: { policy, terms } });
        load();
        expect(policy.getAttribute('aria-current')).toBe('page');
        expect(policy.listeners.click).toBeUndefined();
        expect(terms.hasAttribute('aria-current')).toBe(false);
        expect(terms.listeners.click).toBeInstanceOf(Function);
    });

    test('keeps the click handler on the home link of the home page, which restores the remembered hash', () => {
        const index = fakeElement({ id: 'index' });
        fakePage({ url: 'https://nicoboga.netlify.app/en', elements: { index } });
        load();
        expect(index.hasAttribute('aria-current')).toBe(false);
        expect(index.listeners.click).toBeInstanceOf(Function);
    });
});

describe('on load', () => {
    test('registers the service worker for the whole site, and logs a failed registration', async () => {
        const failure = new Error('blocked');
        const register = jest.fn(() => Promise.reject(failure));
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        fakePage({ serviceWorker: { register } });
        load();
        expect(register).toHaveBeenCalledWith('/service-worker.js', { scope: '/' });
        await Promise.resolve();
        await Promise.resolve();
        expect(log).toHaveBeenCalledWith(failure);
    });

    test('skips the service worker where the browser has none', () => {
        fakePage();
        expect(() => load()).not.toThrow();
    });

    test('hides the loader and writes the copyright year, when the page has them', () => {
        const loader = fakeElement({ id: 'ftco-loader', classes: ['show'] });
        const year = fakeElement({ id: 'year' });
        fakePage({ elements: { 'ftco-loader': loader, year } });
        load();
        expect(loader.classList.contains('show')).toBe(false);
        expect(year.textContent).toBe(new Date().getFullYear());
    });
});
