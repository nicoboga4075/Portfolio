// Unit tests of js/standalone.js: initArticle loads the images and, on a page of its own, the translator; initPage is defined only when app.js has not defined its own, and keeps the empty links from jumping to the top.

// The helpers of js/common.js the script calls, and the links of the page, recorded so each test can read what it did
function fakePage(links = []) {
    global.window = global;
    global.loadImages = jest.fn();
    global.initTranslator = jest.fn();
    global.document = { querySelectorAll: jest.fn(() => links) };
}

// Loads standalone.js on the fake page and returns its top-level functions, exported by tests/jest/browser-globals-transform.cjs
function runScript() {
    let script;
    jest.isolateModules(() => {
        script = require('./standalone.js');
    });
    return script;
}

// A link with href="#", keeping the click listener the script adds
function fakeLink() {
    const link = { listeners: {} };
    link.addEventListener = (type, listener) => {
        link.listeners[type] = listener;
    };
    return link;
}

afterEach(() => {
    for (const name of ['window', 'document', 'loadImages', 'initTranslator', 'initPage']) delete global[name];
});

describe('initArticle', () => {
    test('loads the article images and the svg icons, then the translator on a page of its own', () => {
        fakePage();
        runScript().initArticle();
        expect(global.loadImages.mock.calls).toEqual([['.article-image', 'png'], ['.icon.svg', 'svg']]);
        expect(global.initTranslator).toHaveBeenCalledTimes(1);
    });

    test('leaves the translator to the blog page when the article is injected into it', () => {
        fakePage();
        runScript().initArticle(false);
        expect(global.loadImages).toHaveBeenCalledTimes(2);
        expect(global.initTranslator).not.toHaveBeenCalled();
    });
});

describe('initPage', () => {
    test('is defined when app.js has not defined one: svg icons, translator, and empty links that do not jump', () => {
        const links = [fakeLink(), fakeLink()];
        fakePage(links);
        runScript();
        window.initPage();
        expect(global.loadImages.mock.calls).toEqual([['.icon.svg', 'svg']]);
        expect(global.initTranslator).toHaveBeenCalledTimes(1);
        expect(document.querySelectorAll).toHaveBeenCalledWith('a[href="#"]');
        for (const link of links) {
            const event = { preventDefault: jest.fn() };
            link.listeners.click(event);
            expect(event.preventDefault).toHaveBeenCalledTimes(1);
        }
    });

    test('keeps the initPage of app.js when the blog page already has it', () => {
        fakePage();
        const appInitPage = jest.fn();
        global.initPage = appInitPage;
        runScript();
        expect(window.initPage).toBe(appInitPage);
    });
});
