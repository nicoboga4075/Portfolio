// The fixture of the Jest tests of js/app.js, the page it runs on in the jsdom environment: the real jQuery with its plugins stubbed, the globals of common.js, standalone.js, i18next, Bootstrap, Chart.js and the Google scripts as fakes, the metas of base.njk, and a loader that runs app.js on the page and returns its top-level declarations.
const path = require('node:path');

const messages = require(path.join(__dirname, '..', '..', '_data', 'messages.json'));
const { appRoutes } = require(path.join(__dirname, '..', '..', 'package.json')).routes;

// The articles of the articles meta, as resolveArticles writes them
const defaultArticles = [
    { slug: 'presentation', title: 'My career', date: '2025-01-02', tags: ['HTML', { WCAG: 'https://www.w3.org/WAI/standards-guidelines/wcag' }] },
    { slug: 'mcs', title: 'What is MCS?', date: '2024-12-23', tags: ['MCS'] }
];

const $ = require(path.join(__dirname, '..', '..', 'js', 'jquery.min.js'));

// Every observer created by app.js, with its callback and the elements it observes
const observers = [];
class FakeIntersectionObserver {
    constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        this.targets = [];
        this.disconnect = jest.fn();
        this.unobserve = jest.fn();
        observers.push(this);
    }

    observe(target) {
        this.targets.push(target);
    }
}

// The observer created for an element
const observerOf = element => observers.find(observer => observer.targets.includes(element));

// A Chart.js stand-in: it keeps its config, and Chart.getChart finds the charts already drawn on a canvas
function installChart({ registered = true } = {}) {
    const charts = new Map();
    function Chart(context, config) {
        this.config = config;
        this.options = config.options;
        this.data = config.data;
        this.ctx = context;
        this.getDatasetMeta = () => ({ controller: { innerRadius: 60 } });
        this.update = jest.fn();
        charts.set(context.canvas, this);
    }
    Chart.getChart = canvas => charts.get(canvas);
    Chart.registry = { plugins: { get: jest.fn(() => registered) } };
    window.Chart = Chart;
    return Chart;
}

// Installs the fakes on window (the global object of jsdom) and the jQuery plugins app.js calls
function installGlobals() {
    window.$ = window.jQuery = $;
    // Animations end at once, so their callbacks and final states can be read right away
    $.fx.off = true;
    $.fn.stellar = jest.fn();
    $.Scrollax = jest.fn();
    $.fn.owlCarousel = jest.fn(function () {
        return this.addClass('owl-loaded');
    });
    window.waypoints = [];
    $.fn.waypoint = jest.fn(function (callback, options) {
        this.each((index, element) => window.waypoints.push({ callback, options, element }));
        return this;
    });
    // jsdom lays nothing out, so :visible is set by the tests through data-visible
    $.expr.pseudos.visible = element => element.dataset.visible === 'true';
    window.IntersectionObserver = FakeIntersectionObserver;
    observers.length = 0;
    window.matchMedia = jest.fn(() => ({ matches: false }));
    window.scrollTo = jest.fn();
    window.open = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.requestAnimationFrame = jest.fn();
    window.bootstrap = { Tooltip: jest.fn() };
    window.i18next = {
        init(options) {
            this.options = options;
        },
        t(key) {
            return this.options.resources[this.options.lng].translation[key];
        }
    };
    // common.js and standalone.js, loaded before app.js on the page
    window.appRoutes = appRoutes;
    window.getCurrentLanguage = () => document.documentElement.lang;
    window.getCurrentRoute = jest.fn(() => 'index');
    window.getHashFromSession = () => sessionStorage.getItem('currentHash');
    window.initTranslator = jest.fn();
    window.loadImages = jest.fn();
    window.convertDate = jest.fn(date => `date ${date}`);
    window.getCurrentFullDate = jest.fn(() => 'now');
    window.initArticle = jest.fn();
    // A request no test answers stays pending, so it neither resolves nor logs
    window.fetch = jest.fn(() => new Promise(() => {}));
    delete window.Chart;
    delete window.Calendly;
    delete window.gapi;
    delete window.google;
    delete window.grecaptcha;
    // A canvas that turns every colour into the bytes of #102030, since jsdom draws nothing
    window.HTMLCanvasElement.prototype.getContext = jest.fn(function () {
        return {
            canvas: this,
            fillRect: jest.fn(),
            getImageData: () => ({ data: [16, 32, 48, 255] }),
            measureText: text => ({ width: text.length * 10 })
        };
    });
}

// The head of base.njk: the articles, the i18n messages, the site name and the e-mail
function writeHead(lang, articles) {
    document.documentElement.lang = lang;
    const attribute = value => JSON.stringify(value).replaceAll('&', '&amp;').replaceAll("'", '&#39;');
    document.head.innerHTML = [
        `<meta name="articles" content='${attribute(articles)}'>`,
        `<meta name="i18n-messages" content='${attribute(messages)}'>`,
        '<meta property="og:site_name" content="Portfolio">',
        '<meta name="email" content="me@example.com">'
    ].join('');
}

// Sets the page (body, URL, language, articles) and runs app.js on it, returning its top-level declarations; before runs once the fakes are installed, to change one
function loadApp({ body = '', url = '/en', lang = 'en', route = 'index', articles = defaultArticles, before } = {}) {
    installGlobals();
    before?.();
    writeHead(lang, articles);
    document.body.innerHTML = body;
    document.body.className = '';
    history.replaceState(null, '', url);
    window.getCurrentRoute.mockReturnValue(route);
    let app;
    jest.isolateModules(() => {
        app = require(path.join(__dirname, '..', '..', 'js', 'app.js'));
    });
    return app;
}

// Drops what a run left on window, document and the storages, so the next one starts clean
function cleanUp() {
    $(window).off();
    $(document).off();
    $('body').off();
    sessionStorage.clear();
    localStorage.clear();
    jest.useRealTimers();
    jest.restoreAllMocks();
}

// Lets the pending promise callbacks run
const flush = async (times = 10) => {
    for (let i = 0; i < times; i++) await Promise.resolve();
};

// The script app.js appended to the head or the body for this address
const scriptFor = src => [...document.querySelectorAll('script')].find(script => script.src.endsWith(src));

// A fetch answering by address: each key of routes is a substring of the URL, its value a body, a Response-like object, or an Error to reject with
function routeFetch(routes) {
    window.fetch = jest.fn(url => {
        const entry = Object.entries(routes).find(([part]) => String(url).includes(part));
        // A request the test does not route stays pending, like the default fetch
        if (!entry) return new Promise(() => {});
        const value = entry[1];
        if (value instanceof Error) return Promise.reject(value);
        if (value && value.ok !== undefined) return Promise.resolve(value);
        return Promise.resolve({ ok: true, json: () => Promise.resolve(value), text: () => Promise.resolve(typeof value === 'string' ? value : JSON.stringify(value)) });
    });
    return window.fetch;
}

module.exports = { $, defaultArticles, messages, observers, observerOf, installChart, loadApp, cleanUp, flush, scriptFor, routeFetch };
