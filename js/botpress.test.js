// Unit tests of js/botpress.js: the stand-in button, once the third-party services of the consent banner are allowed, loads the pinned inject.js (with its hash) and then the bot script, both addresses read from the botpress meta that base.njk fills from config.botpress of package.json; then the real bubble replaces the stand-in, centered on the navbar and kept there by its observers.

const pkg = require('../package.json');

const scripts = pkg.config.botpress;

// The shadow root of #fab-root: the Botpress bubble (.bpFabWrapper) when a height is given, and the style elements the script appends
function fakeShadowRoot(fabHeight) {
    const children = [];
    return {
        children,
        querySelector: selector => (selector === '.bpFabWrapper' && fabHeight !== undefined ? { getBoundingClientRect: () => ({ height: fabHeight }) } : null),
        getElementById: id => children.find(child => child.id === id) ?? null,
        appendChild: child => children.push(child)
    };
}

// A minimal document: the stand-in button (unless stub is false), the navbar (unless navbarHeight is null), the botpress meta, #fab-root once set, the head where the scripts are appended, and every observer created, with its callback and what it observes
function fakePage({ stub: withStub = true, navbarHeight = 100, meta = { content: JSON.stringify(scripts) } } = {}) {
    const appended = [];
    const observers = [];
    const stub = {
        style: {},
        offsetHeight: 40,
        attrs: {},
        listeners: {},
        addEventListener: (type, listener) => {
            stub.listeners[type] = listener;
        },
        removeEventListener: jest.fn((type, listener) => {
            if (stub.listeners[type] === listener) delete stub.listeners[type];
        }),
        setAttribute: (name, value) => {
            stub.attrs[name] = value;
        },
        remove: jest.fn()
    };
    const navbar = navbarHeight === null ? null : { getBoundingClientRect: () => ({ height: navbarHeight }) };
    const page = { stub, appended, observers, navbar, fabRoot: null };
    const observer = kind => class {
        constructor(callback) {
            this.kind = kind;
            this.callback = callback;
            this.targets = [];
            this.disconnect = jest.fn();
            observers.push(this);
        }

        observe(target, options) {
            this.targets.push({ target, options });
        }
    };
    global.window = global;
    // --fab-size of css/common.css, the size the Botpress bubble gets, set on <html> only: read on any other element, it is missing
    global.getComputedStyle = element => ({ getPropertyValue: name => (name === '--fab-size' && element === global.document.documentElement ? ' 60px' : '') });
    global.ResizeObserver = observer('resize');
    global.MutationObserver = observer('mutation');
    global.document = {
        createElement: jest.fn(tag => ({ tagName: tag })),
        head: { appendChild: jest.fn(script => appended.push(script)) },
        body: { tagName: 'body' },
        documentElement: { lang: 'fr' },
        querySelector: jest.fn(selector => (selector === 'meta[name="botpress"]' ? meta : null)),
        getElementById: jest.fn(id => ({ 'bp-fab-stub': withStub ? stub : null, 'ftco-navbar': navbar, 'fab-root': page.fabRoot })[id] ?? null)
    };
    global.botpress = { on: jest.fn(), open: jest.fn(), updateUser: jest.fn(() => Promise.resolve()) };
    // whenConsented of js/consent.js: the third-party services allowed, unless a test says otherwise
    global.whenConsented = jest.fn((category, callback) => callback());
    return page;
}

function runScript() {
    jest.isolateModules(() => {
        require('./botpress.js');
    });
}

// Clicks the stand-in and runs the onload of inject.js, as the browser would once it has downloaded
function clickAndLoad(page) {
    page.stub.listeners.click();
    page.appended[0].onload();
}

const overrideStyle = shadowRoot => shadowRoot.getElementById('bp-fab-position-override');

afterEach(() => {
    for (const name of ['window', 'document', 'getComputedStyle', 'ResizeObserver', 'MutationObserver', 'botpress', 'whenConsented']) delete global[name];
});

describe('config.botpress of package.json', () => {
    test('holds the pinned inject.js with its integrity hash and the bot script address', () => {
        expect(scripts.inject.src).toMatch(/^https:\/\/cdn\.botpress\.cloud\/webchat\/v[\d.]+\/inject\.js$/);
        expect(scripts.inject.integrity).toMatch(/^sha384-/);
        expect(scripts.bot).toMatch(/^https:\/\/files\.bpcontent\.cloud\/.+\.js$/);
    });
});

describe('the stand-in button', () => {
    test('does nothing on a page without it', () => {
        const page = fakePage({ stub: false });
        runScript();
        expect(page.observers).toHaveLength(0);
        expect(page.appended).toHaveLength(0);
    });

    test('is centered on the navbar, and placed again when the navbar is resized', () => {
        const page = fakePage({ navbarHeight: 100 });
        runScript();
        expect(page.stub.style.top).toBe('30px');
        const resize = page.observers.find(o => o.kind === 'resize');
        expect(resize.targets[0].target).toBe(page.navbar);
        page.navbar.getBoundingClientRect = () => ({ height: 60 });
        resize.callback();
        expect(page.stub.style.top).toBe('10px');
    });

    test('falls back on the 85px navbar height when the page has no navbar, and watches nothing', () => {
        const page = fakePage({ navbarHeight: null });
        runScript();
        expect(page.stub.style.top).toBe(`${Math.round((85 - 40) / 2)}px`);
        expect(page.observers).toHaveLength(0);
    });

    test('loads nothing until it is clicked', () => {
        const page = fakePage();
        runScript();
        expect(page.appended).toHaveLength(0);
        expect(document.querySelector).not.toHaveBeenCalled();
    });

    test('loads the pinned inject.js from the meta on click, with its hash and anonymous CORS', () => {
        const page = fakePage();
        runScript();
        page.stub.listeners.click();
        expect(page.stub.attrs['aria-busy']).toBe('true');
        expect(page.appended).toHaveLength(1);
        expect(page.appended[0].src).toBe(scripts.inject.src);
        expect(page.appended[0].integrity).toBe(scripts.inject.integrity);
        expect(page.appended[0].crossOrigin).toBe('anonymous');
    });

    test.each([
        ['no botpress meta', null, 'Botpress: no botpress meta on the page'],
        ['a meta without content', { content: '' }, 'Botpress: no botpress meta on the page'],
        ['a meta without the inject script', { content: JSON.stringify({ bot: scripts.bot }) }, 'Botpress: the botpress meta lacks the inject or bot script address'],
        ['a meta without the bot script', { content: JSON.stringify({ inject: scripts.inject }) }, 'Botpress: the botpress meta lacks the inject or bot script address'],
        ['a meta that is not JSON', { content: '{oops' }, 'Botpress: the botpress meta lacks the inject or bot script address']
    ])('loads nothing, with a warning and without a busy stand-in, on a page with %s', (_case, meta, message) => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const page = fakePage({ meta });
        runScript();
        page.stub.listeners.click();
        expect(page.appended).toHaveLength(0);
        expect(page.stub.attrs['aria-busy']).toBeUndefined();
        expect(warn).toHaveBeenCalledWith(message);
        warn.mockRestore();
    });

    test('appends the bot script, without a hash, only once inject.js has loaded, and opens the chat when it is initialized', () => {
        const page = fakePage();
        runScript();
        clickAndLoad(page);
        expect(page.appended).toHaveLength(2);
        expect(page.appended[1].src).toBe(scripts.bot);
        expect(page.appended[1].integrity).toBeUndefined();
        const [event, handler] = global.botpress.on.mock.calls[0];
        expect(event).toBe('webchat:initialized');
        handler();
        expect(global.botpress.open).toHaveBeenCalledTimes(1);
    });

    test('sends the language of the page to the bot once it is initialized', () => {
        const page = fakePage();
        runScript();
        clickAndLoad(page);
        global.botpress.on.mock.calls[0][1]();
        expect(global.botpress.updateUser).toHaveBeenCalledWith({ data: { lang: 'fr' } });
    });

    test('still opens the chat, with a warning, when Botpress refuses the language', async () => {
        const page = fakePage();
        const error = new Error('refused');
        global.botpress.updateUser.mockReturnValue(Promise.reject(error));
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        runScript();
        clickAndLoad(page);
        global.botpress.on.mock.calls[0][1]();
        expect(global.botpress.open).toHaveBeenCalledTimes(1);
        await Promise.resolve();
        await Promise.resolve();
        expect(warn).toHaveBeenCalledWith('Botpress: the language of the page was not sent', error);
        warn.mockRestore();
    });

    test('stops listening to the click once the chat loads', () => {
        const page = fakePage();
        runScript();
        const listener = page.stub.listeners.click;
        listener();
        expect(page.stub.removeEventListener).toHaveBeenCalledWith('click', listener);
        expect(page.stub.listeners.click).toBeUndefined();
    });

    test('asks for the third-party services first, and loads nothing until they are allowed, the click still listened to', () => {
        const page = fakePage();
        global.whenConsented.mockImplementation(() => {});
        runScript();
        page.stub.listeners.click();
        expect(global.whenConsented).toHaveBeenCalledWith('services', expect.any(Function));
        expect(page.appended).toHaveLength(0);
        expect(page.stub.attrs['aria-busy']).toBeUndefined();
        expect(page.stub.listeners.click).toBeDefined();
    });
});

describe('the real bubble', () => {
    // The page of a navbar 100px high whose #fab-root is already mounted, its bubble of the given height (undefined while Botpress has not drawn it), the chatbot loaded by a click
    function loadedBubble(bubbleHeight) {
        const page = fakePage({ navbarHeight: 100 });
        const shadowRoot = fakeShadowRoot(bubbleHeight);
        page.fabRoot = { shadowRoot };
        runScript();
        clickAndLoad(page);
        return { page, shadowRoot };
    }

    test('is taken over at once when #fab-root is already mounted: the stand-in goes and the override style is appended', () => {
        const { page, shadowRoot } = loadedBubble(50);
        expect(page.stub.remove).toHaveBeenCalledTimes(1);
        const style = overrideStyle(shadowRoot);
        expect(style.tagName).toBe('style');
        expect(style.textContent).toContain('top: 25px !important');
        expect(style.textContent).toContain('background-color: var(--primary)');
        // No observer of the document body: #fab-root was already there
        expect(page.observers.some(o => o.targets.some(t => t.target === document.body))).toBe(false);
    });

    test('waits for #fab-root to be mounted, then stops watching the document', () => {
        const page = fakePage();
        runScript();
        clickAndLoad(page);
        const bodyObserver = page.observers.find(o => o.targets.some(t => t.target === document.body));
        expect(bodyObserver.targets[0].options).toEqual({ childList: true, subtree: true });
        // A mutation before #fab-root exists changes nothing
        bodyObserver.callback();
        expect(bodyObserver.disconnect).not.toHaveBeenCalled();
        // #fab-root without its shadow root yet changes nothing either
        page.fabRoot = {};
        bodyObserver.callback();
        expect(bodyObserver.disconnect).not.toHaveBeenCalled();
        const shadowRoot = fakeShadowRoot(50);
        page.fabRoot = { shadowRoot };
        bodyObserver.callback();
        expect(bodyObserver.disconnect).toHaveBeenCalledTimes(1);
        expect(overrideStyle(shadowRoot)).not.toBeNull();
    });

    test('falls back on the --fab-size height while Botpress has not drawn its bubble', () => {
        const { shadowRoot } = loadedBubble(undefined);
        expect(overrideStyle(shadowRoot).textContent).toContain(`top: ${Math.round((100 - 60) / 2)}px !important`);
    });

    test('puts the override back after Botpress rebuilds its shadow root, and follows the navbar height', () => {
        const { page, shadowRoot } = loadedBubble(50);
        const shadowObserver = page.observers.find(o => o.targets.some(t => t.target === shadowRoot));
        expect(shadowObserver.targets[0].options).toEqual({ childList: true });
        // Botpress wipes its shadow root: the observer appends the style again
        shadowRoot.children.length = 0;
        shadowObserver.callback();
        expect(shadowRoot.children).toHaveLength(1);
        // The navbar shrinks (.scrolled): the resize observer of the bubble rewrites the same style element
        // The last resize observer is the bubble's, the first one placed the stand-in
        const resize = page.observers.filter(o => o.kind === 'resize').at(-1);
        page.navbar.getBoundingClientRect = () => ({ height: 70 });
        resize.callback();
        expect(shadowRoot.children).toHaveLength(1);
        expect(overrideStyle(shadowRoot).textContent).toContain('top: 10px !important');
    });

    test('leaves the style untouched when nothing moved, so its own write does not trigger the observer again', () => {
        const { page, shadowRoot } = loadedBubble(50);
        const style = overrideStyle(shadowRoot);
        const css = style.textContent;
        let writes = 0;
        Object.defineProperty(style, 'textContent', {
            get: () => css,
            set: () => {
                writes++;
            }
        });
        page.observers.find(o => o.targets.some(t => t.target === shadowRoot)).callback();
        expect(writes).toBe(0);
    });

    test('is not watched for navbar resizes on a page without a navbar', () => {
        const page = fakePage({ navbarHeight: null });
        const shadowRoot = fakeShadowRoot(50);
        page.fabRoot = { shadowRoot };
        runScript();
        clickAndLoad(page);
        expect(page.observers.filter(o => o.kind === 'resize')).toHaveLength(0);
        expect(overrideStyle(shadowRoot).textContent).toContain(`top: ${Math.round((85 - 50) / 2)}px !important`);
    });
});
