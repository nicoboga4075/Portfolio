// Unit tests of js/botpress.js: the stand-in button loads the pinned inject.js (with its hash) and then the bot script, both addresses read from the botpress meta that base.njk fills from config.botpress of package.json; then the real bubble replaces the stand-in, centered on the navbar and kept there by its observers.

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
function fakePage({ stub: withStub = true, navbarHeight = 100 } = {}) {
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
        documentElement: {},
        querySelector: jest.fn(selector => (selector === 'meta[name="botpress"]' ? { content: JSON.stringify(scripts) } : null)),
        getElementById: jest.fn(id => ({ 'bp-fab-stub': withStub ? stub : null, 'ftco-navbar': navbar, 'fab-root': page.fabRoot })[id] ?? null)
    };
    global.botpress = { on: jest.fn(), open: jest.fn() };
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
    for (const name of ['window', 'document', 'getComputedStyle', 'ResizeObserver', 'MutationObserver', 'botpress']) delete global[name];
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

    test('listens to the click once only', () => {
        const page = fakePage();
        page.stub.addEventListener = jest.fn();
        runScript();
        expect(page.stub.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), { once: true });
    });
});

describe('the real bubble', () => {
    test('is taken over at once when #fab-root is already mounted: the stand-in goes and the override style is appended', () => {
        const page = fakePage({ navbarHeight: 100 });
        const shadowRoot = fakeShadowRoot(50);
        page.fabRoot = { shadowRoot };
        runScript();
        clickAndLoad(page);
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
        const page = fakePage({ navbarHeight: 100 });
        const shadowRoot = fakeShadowRoot(undefined);
        page.fabRoot = { shadowRoot };
        runScript();
        clickAndLoad(page);
        expect(overrideStyle(shadowRoot).textContent).toContain(`top: ${Math.round((100 - 60) / 2)}px !important`);
    });

    test('puts the override back after Botpress rebuilds its shadow root, and follows the navbar height', () => {
        const page = fakePage({ navbarHeight: 100 });
        const shadowRoot = fakeShadowRoot(50);
        page.fabRoot = { shadowRoot };
        runScript();
        clickAndLoad(page);
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
        const page = fakePage({ navbarHeight: 100 });
        const shadowRoot = fakeShadowRoot(50);
        page.fabRoot = { shadowRoot };
        runScript();
        clickAndLoad(page);
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
