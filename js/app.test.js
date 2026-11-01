/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://nicoboga.netlify.app"}
 */
// Unit tests of js/app.js, the script of the home and blog pages, on the jsdom page of tests/jest/fixture.cjs (the docblock above, a block by Jest's syntax, picks that environment and the https origin of the live site, each test setting its own path; js/app.http.test.js covers the http one).
const { articlesIn, observers, observerOf, installChart, loadApp, cleanUp, flush, scriptFor, routeFetch } = require('../tests/jest/fixture.cjs');

// The real articles of the English pages, and the one the sidebar offers next to the article of a slug: the first other one
const articles = articlesIn('en');
const recentTo = slug => articles.find(article => article.slug !== slug);

afterEach(cleanUp);

// A click event as a mouse makes it (detail 1) or a keyboard (detail 0)
const clickEvent = detail => new MouseEvent('click', { bubbles: true, detail });

describe('small helpers', () => {
    test('debounce runs the last call only, once the delay has passed', () => {
        jest.useFakeTimers();
        const app = loadApp();
        const spy = jest.fn();
        const debounced = app.debounce(spy, 300);
        debounced(1);
        debounced(2);
        jest.advanceTimersByTime(299);
        expect(spy).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(spy).toHaveBeenCalledWith(2);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    test('removeTrailingEquals drops the base64 padding only', () => {
        const app = loadApp();
        expect(app.removeTrailingEquals('YWI=')).toBe('YWI');
        expect(app.removeTrailingEquals('a==')).toBe('a');
        expect(app.removeTrailingEquals('===')).toBe('');
        expect(app.removeTrailingEquals('a=b')).toBe('a=b');
    });

    test('escapeRegExp escapes every character a RegExp reads', () => {
        const app = loadApp();
        expect(new RegExp(app.escapeRegExp('C++ (.NET)')).test('C++ (.NET)')).toBe(true);
        expect(app.escapeRegExp('a.b*c?')).toBe(String.raw`a\.b\*c\?`);
    });

    test('getMessage reads the i18n messages in the page language', () => {
        expect(loadApp({ lang: 'en' }).getMessage('carousel-prev')).toBe('Previous');
        expect(loadApp({ lang: 'fr' }).getMessage('carousel-prev')).toBe('Précédent');
    });

    test('toggleVisibility shows a hidden or d-none element with its class, and hides a shown one', () => {
        const app = loadApp({ body: '<div id="a" hidden></div><div id="b" class="d-none"></div><div id="c" class="d-flex"></div>' });
        app.toggleVisibility('#a');
        expect($('#a').prop('hidden')).toBe(false);
        expect($('#a').hasClass('d-flex')).toBe(true);
        app.toggleVisibility('#b', 'd-block');
        expect($('#b').hasClass('d-none')).toBe(false);
        expect($('#b').hasClass('d-block')).toBe(true);
        app.toggleVisibility('#c');
        expect($('#c').prop('hidden')).toBe(true);
        expect($('#c').hasClass('d-flex')).toBe(false);
    });

    test('saveHashToSession stores a new hash and refreshes the switcher, and skips the same one', () => {
        const app = loadApp();
        app.saveHashToSession('about-section');
        expect(sessionStorage.getItem('currentHash')).toBe('about-section');
        expect(window.initTranslator).toHaveBeenCalledTimes(1);
        app.saveHashToSession('about-section');
        expect(window.initTranslator).toHaveBeenCalledTimes(1);
    });

    test('clearUrlPath drops the hash and the query, and the slug comes from the hash', () => {
        const app = loadApp({ url: '/en/blog?x=1#mcs' });
        expect(app.getSlugFromUrl()).toBe('mcs');
        app.clearUrlPath();
        expect(window.location.pathname + window.location.search + window.location.hash).toBe('/en/blog');
    });

    test('the current and the recent article come from the hash, or else from the session', () => {
        let app = loadApp({ url: '/en/blog#mcs' });
        expect(app.getCurrentArticle().slug).toBe('mcs');
        expect(app.getRecentArticle().slug).toBe(recentTo('mcs').slug);
        app = loadApp({ url: '/en/blog' });
        sessionStorage.setItem('currentHash', 'presentation');
        expect(app.getCurrentArticle().slug).toBe('presentation');
        expect(app.getRecentArticle().slug).toBe(recentTo('presentation').slug);
    });

    test('cssVarToHex resolves a CSS variable through a canvas pixel', () => {
        const app = loadApp();
        expect(app.cssVarToHex('--primary')).toBe('102030');
        expect(document.querySelectorAll('span')).toHaveLength(0);
    });
});

describe('on load', () => {
    test('starts the parallax and scrollax plugins, and sizes the full-height blocks to the window, on resize too', () => {
        loadApp({ body: '<div class="js-fullheight"></div>' });
        expect($.fn.stellar).toHaveBeenCalledWith(expect.objectContaining({ parallaxBackgrounds: true }));
        expect($.Scrollax).toHaveBeenCalled();
        expect($('.js-fullheight')[0].style.height).toBe(`${$(window).height()}px`);
        $('.js-fullheight')[0].style.height = '';
        $(window).trigger('resize');
        expect($('.js-fullheight')[0].style.height).toBe(`${$(window).height()}px`);
    });

    test('marks the burger button active while the menu is closed, and not once it is open', () => {
        loadApp({ body: '<button class="navbar-toggler"></button><div id="ftco-nav" data-visible="false"></div>' });
        $('.navbar-toggler').trigger('click');
        expect($('.navbar-toggler').hasClass('active')).toBe(true);
        $('#ftco-nav').attr('data-visible', 'true');
        $('.navbar-toggler').trigger('click');
        expect($('.navbar-toggler').hasClass('active')).toBe(false);
    });

    test('scrolls to the section of a menu link, and ignores a link to a section of another page', () => {
        loadApp({ body: '<div id="ftco-nav"><a href="#about-section">About</a><a href="#missing">Missing</a></div><section id="about-section"></section>' });
        const animate = jest.spyOn($.fn, 'animate');
        $('#ftco-nav a').eq(1).trigger('click');
        expect(animate).not.toHaveBeenCalled();
        $('#ftco-nav a').eq(0).trigger('click');
        expect(animate).toHaveBeenCalledWith({ scrollTop: -70 }, 500);
    });

    test('starts the hard skills carousel with labelled controls, and marks its menu active', () => {
        loadApp({ body: '<div id="hard-skills"><div class="owl-prev" role="presentation"></div><div class="owl-next" role="presentation"></div><div class="owl-dot"></div><div class="owl-dot"></div></div><span class="owl-menu" data-target="#hard-skills"></span><span class="owl-menu active" data-target="#soft-skills"></span>' });
        expect($.fn.owlCarousel).toHaveBeenCalledWith(expect.objectContaining({ rewind: true, responsive: expect.objectContaining({ 0: { items: 2 }, 1200: { items: 4 } }) }));
        expect($('.owl-prev').attr('role')).toBeUndefined();
        expect($('.owl-prev').attr('aria-label')).toBe('Previous');
        expect($('.owl-next').attr('aria-label')).toBe('Next');
        expect($('.owl-dot').eq(1).attr('aria-label')).toMatch(/ 2$/);
        expect($('.owl-menu').eq(0).hasClass('active')).toBe(true);
        expect($('.owl-menu').eq(1).hasClass('active')).toBe(false);
        expect($('#hard-skills').hasClass('active')).toBe(true);
    });

    test('makes the navbar opaque past 150px, awake past 350px, and asleep only on the way back up', () => {
        loadApp({ body: '<nav id="ftco-navbar"></nav>' });
        const scrollTo = top => {
            Object.defineProperty(window, 'pageYOffset', { value: top, configurable: true });
            $(window).trigger('scroll');
        };
        const navbar = $('#ftco-navbar');
        scrollTo(200);
        expect(navbar.attr('class')).toBe('scrolled');
        scrollTo(400);
        expect(navbar.hasClass('awake')).toBe(true);
        expect(navbar.hasClass('sleep')).toBe(false);
        scrollTo(200);
        expect(navbar.hasClass('sleep')).toBe(true);
        expect(navbar.hasClass('awake')).toBe(false);
        scrollTo(0);
        expect(navbar.attr('class')).toBe('');
        Object.defineProperty(window, 'pageYOffset', { value: 0, configurable: true });
    });

    test('counts the numbers up when they come into view, and only once', () => {
        jest.spyOn(performance, 'now').mockReturnValue(0);
        loadApp({ body: '<span class="number" data-number="1200"></span><span class="number"></span>' });
        const [first, second] = document.querySelectorAll('.number');
        const observer = observerOf(first);
        expect(observer.options).toEqual({ rootMargin: '0px 0px -5% 0px' });
        observer.callback([{ isIntersecting: false, target: first }]);
        expect(window.requestAnimationFrame).not.toHaveBeenCalled();
        observer.callback([{ isIntersecting: true, target: first }, { isIntersecting: true, target: second }]);
        expect(observer.unobserve).toHaveBeenCalledWith(first);
        const [step] = window.requestAnimationFrame.mock.calls[0];
        step(1000);
        expect(first.textContent).toBe('1,050');
        expect(window.requestAnimationFrame).toHaveBeenCalledTimes(3);
        step(3000);
        expect(first.textContent).toBe('1,200');
        expect(window.requestAnimationFrame).toHaveBeenCalledTimes(3);
        // A number without data-number counts to 0
        window.requestAnimationFrame.mock.calls[1][0](3000);
        expect(second.textContent).toBe('0');
    });

    test('shows the final number at once when the visitor asks for reduced motion, and skips a page without numbers', () => {
        loadApp({ body: '<span class="number" data-number="15"></span>', before: () => { window.matchMedia = jest.fn(() => ({ matches: true })); } });
        expect(observers).toHaveLength(1);
        const element = document.querySelector('.number');
        observers[0].callback([{ isIntersecting: true, target: element }]);
        expect(element.textContent).toBe('15');
        loadApp({ body: '<p></p>' });
        expect(observers).toHaveLength(0);
    });

    test('reveals the animated blocks on the way down, one after the other, with their own effect', () => {
        jest.useFakeTimers();
        loadApp({ body: '<div class="ftco-animate" data-animate-effect="fadeIn"></div><div class="ftco-animate"></div><div class="ftco-animate ftco-animated"></div>' });
        const [first, second, done] = window.waypoints;
        expect(first.options).toEqual({ offset: '95%' });
        first.callback.call({ element: first.element }, 'up');
        expect(first.element.classList.contains('item-animate')).toBe(false);
        done.callback.call({ element: done.element }, 'down');
        expect(done.element.classList.contains('item-animate')).toBe(false);
        first.callback.call({ element: first.element }, 'down');
        second.callback.call({ element: second.element }, 'down');
        jest.advanceTimersByTime(100);
        jest.advanceTimersByTime(50);
        expect(first.element.className).toBe('ftco-animate fadeIn ftco-animated');
        expect(second.element.className).toBe('ftco-animate fadeInUp ftco-animated');
    });

    test('scrolls the arrow of the hero to its target, and does nothing without it', () => {
        loadApp({ body: '<a class="mouse-icon" href="#resume-section">Down</a><section id="resume-section"></section>' });
        const animate = jest.spyOn($.fn, 'animate');
        $('.mouse-icon').trigger('click');
        expect(animate).toHaveBeenCalledWith({ scrollTop: 0 }, 500, 'easeInOutExpo');
        animate.mockClear();
        $('#resume-section').remove();
        $('.mouse-icon').trigger('click');
        expect(animate).not.toHaveBeenCalled();
    });

    test('types the roles one letter at a time, waits, deletes them and goes to the next one', () => {
        jest.useFakeTimers();
        jest.spyOn(Math, 'random').mockReturnValue(0);
        loadApp({ body: `<span class="txt-rotate" data-period="1000" data-rotate='["ab", "c"]'></span><span class="txt-rotate"></span><span class="txt-rotate" data-period="x" data-rotate='["z"]'></span>` });
        const [rotating, empty, fallback] = document.querySelectorAll('.txt-rotate');
        const text = () => rotating.textContent;
        expect(text()).toBe('a');
        expect(empty.textContent).toBe('');
        expect(fallback.txtRotate.period).toBe(2000);
        jest.advanceTimersByTime(300);
        expect(text()).toBe('ab');
        jest.advanceTimersByTime(1000);
        expect(text()).toBe('a');
        jest.advanceTimersByTime(150);
        expect(text()).toBe('');
        jest.advanceTimersByTime(500);
        expect(text()).toBe('c');
    });

    test('creates the Bootstrap tooltips, and closes one on a mouse click but not on a key press', () => {
        loadApp({ body: '<button data-bs-toggle="tooltip" title="Theme"></button>' });
        const button = document.querySelector('button');
        expect(window.bootstrap.Tooltip).toHaveBeenCalledWith(button);
        const blur = jest.spyOn(button, 'blur');
        button.dispatchEvent(clickEvent(0));
        expect(blur).not.toHaveBeenCalled();
        button.dispatchEvent(clickEvent(1));
        expect(blur).toHaveBeenCalledTimes(1);
    });
});

describe('loading scripts', () => {
    test('loadScript resolves on load, and removes the script and rejects on error', async () => {
        const app = loadApp();
        const ok = app.loadScript('js/a.js');
        scriptFor('js/a.js').onload();
        await expect(ok).resolves.toBeUndefined();
        const failed = app.loadScript('js/b.js');
        scriptFor('js/b.js').onerror();
        await expect(failed).rejects.toThrow('Failed to load js/b.js');
        expect(scriptFor('js/b.js')).toBeUndefined();
    });

    test('loadScriptOnce shares one load per address, and forgets a failed one so it can be retried', async () => {
        const app = loadApp();
        const first = app.loadScriptOnce('js/c.js');
        expect(app.loadScriptOnce('js/c.js')).toBe(first);
        scriptFor('js/c.js').onerror();
        await expect(first).rejects.toThrow();
        const retry = app.loadScriptOnce('js/c.js');
        expect(retry).not.toBe(first);
        scriptFor('js/c.js').onload();
        await expect(retry).resolves.toBeUndefined();
    });

    test('loadChartJs fetches Chart.js only when missing, and the doughnut label plugin only for a doughnut or a pie', async () => {
        let app = loadApp();
        const bar = app.loadChartJs('bar');
        expect(scriptFor('js/chart.umd.min.js')).toBeDefined();
        scriptFor('js/chart.umd.min.js').onload();
        await expect(bar).resolves.toBeUndefined();

        app = loadApp();
        installChart({ registered: false });
        const doughnut = app.loadChartJs();
        await flush();
        expect(scriptFor('js/chartjs-plugin-doughnutlabel.min.js')).toBeDefined();
        scriptFor('js/chartjs-plugin-doughnutlabel.min.js').onload();
        await expect(doughnut).resolves.toBeUndefined();

        app = loadApp();
        installChart({ registered: true });
        await expect(app.loadChartJs('pie')).resolves.toBeUndefined();
        expect(document.querySelectorAll('script')).toHaveLength(0);
    });

    test('loadContactScripts appends the Google API, Identity and reCAPTCHA scripts once', () => {
        const app = loadApp({ lang: 'fr' });
        app.loadContactScripts();
        app.loadContactScripts();
        const sources = [...document.body.querySelectorAll('script')].map(script => script.src);
        expect(sources).toEqual(['https://apis.google.com/js/api.js', 'https://accounts.google.com/gsi/client', 'https://www.google.com/recaptcha/api.js?hl=fr&onload=initCaptcha&render=explicit']);
        expect(scriptFor('api.js').onload).toBe(app.gapiLoaded);
        expect(scriptFor('gsi/client').onload).toBe(app.gisLoaded);
    });
});

describe('the skills chart', () => {
    const canvasBody = `<canvas id="skills-chart" data-labels='["Back-end", "Front-end", "Project management", "Support", "CI/CD"]' data-title="Time" data-subtitle="5 years" data-center="AI"></canvas>`;

    test('fitCenterTextToHole shrinks the center text to the hole, down to 8px, and skips a chart without it', () => {
        const app = loadApp();
        const label = { text: 'AI-Augmented', font: { weight: 'bold', family: 'Poppins', size: 16 } };
        const chartWith = innerRadius => ({ options: { plugins: { doughnutLabel: { labels: [label] } } }, getDatasetMeta: () => ({ controller: { innerRadius } }), ctx: { measureText: text => ({ width: text.length * 10 }) } });
        app.fitCenterTextToHole(chartWith(1000));
        expect(label.font.size).toBe(16);
        app.fitCenterTextToHole(chartWith(50));
        expect(label.font.size).toBe(Math.floor(16 * (100 / Math.hypot(120, 19.2))));
        app.fitCenterTextToHole(chartWith(1));
        expect(label.font.size).toBe(8);
        label.font.size = 12;
        app.fitCenterTextToHole({ options: { plugins: {} }, getDatasetMeta: () => ({}) });
        app.fitCenterTextToHole({ ...chartWith(0) });
        app.fitCenterTextToHole({ options: { plugins: { doughnutLabel: { labels: [label] } } }, getDatasetMeta: () => ({}) });
        expect(label.font.size).toBe(12);
    });

    test('createCircularChart draws a doughnut with the center text, its legend in percentages, and reuses a chart already drawn', () => {
        const app = loadApp({ body: canvasBody });
        installChart();
        const options = { canvasId: 'skills-chart', data: [45, 25, 15, 10, 5], backgroundColor: ['#1', '#2', '#3', '#4', '#5'], labels: ['A', 'B', 'C', 'D', 'E'], title: 'Time', subtitle: '5 years', centerText: 'AI' };
        const chart = app.createCircularChart(options);
        expect(chart.config.type).toBe('doughnut');
        expect(chart.options.cutout).toBe('50%');
        expect(chart.options.plugins.doughnutLabel.labels[0].text).toBe('AI');
        expect(chart.options.plugins.subtitle.color).toBe('#102030');
        expect(chart.options.plugins.doughnutLabel.labels[0].font.size).toBe(16);
        chart.config.plugins[0].beforeDraw(chart);
        const legend = chart.options.plugins.legend.labels.generateLabels(chart);
        expect(legend.map(item => item.text)).toEqual(['A (45%)', 'B (25%)', 'C (15%)', 'D (10%)', 'E (5%)']);
        expect(legend[0]).toEqual(expect.objectContaining({ fillStyle: '#1', lineWidth: 0 }));
        expect(app.createCircularChart(options)).toBe(chart);
    });

    test('createCircularChart leaves the center text out of a chart without a hole or without a text', () => {
        let app = loadApp({ body: canvasBody });
        installChart();
        let chart = app.createCircularChart({ canvasId: 'skills-chart', type: 'bar', data: [1], backgroundColor: ['#1'], labels: ['A'], centerText: 'AI' });
        expect(chart.options.plugins.doughnutLabel).toBeUndefined();
        expect(chart.config.plugins).toEqual([]);
        app = loadApp({ body: canvasBody });
        installChart();
        chart = app.createCircularChart({ canvasId: 'skills-chart', type: 'pie', data: [1], backgroundColor: ['#1'], labels: ['A'] });
        expect(chart.options.plugins.doughnutLabel).toBeUndefined();
    });

    test('recolours the chart when the theme changes, center text included when it has one', () => {
        let app = loadApp({ body: canvasBody });
        installChart();
        let chart = app.createCircularChart({ canvasId: 'skills-chart', data: [1], backgroundColor: ['#1'], labels: ['A'], centerText: 'AI' });
        chart.options.plugins.doughnutLabel.labels[0].color = 'old';
        document.dispatchEvent(new CustomEvent('darkmodechange'));
        expect(chart.update).toHaveBeenCalled();
        expect(chart.options.plugins.doughnutLabel.labels[0].color).toBe('');
        app = loadApp({ body: canvasBody });
        installChart();
        chart = app.createCircularChart({ canvasId: 'skills-chart', type: 'bar', data: [1], backgroundColor: ['#1'], labels: ['A'] });
        document.dispatchEvent(new CustomEvent('darkmodechange'));
        expect(chart.update).toHaveBeenCalled();
    });

    test('does nothing on a theme change before any chart is drawn', () => {
        loadApp();
        expect(() => document.dispatchEvent(new CustomEvent('darkmodechange'))).not.toThrow();
    });
});

describe('the experience filters', () => {
    const experiences = `<div id="experiences"><h2 class="heading">Experiences</h2>
        <div class="resume-wrap"><span class="badge">CDI</span><span class="company-type-badge">Startup</span><span class="sector-tag">Health</span></div>
        <div class="resume-wrap ftco-animated"><span class="badge">Internship</span><span class="sector-tag">Health</span></div>
    </div>`;

    test('are skipped on a page without experiences, or with no experience in it', () => {
        let app = loadApp();
        app.initExperienceFilters();
        expect(document.getElementById('experience-filters')).toBeNull();
        app = loadApp({ body: '<div id="experiences"><h2 class="heading"></h2></div>' });
        app.initExperienceFilters();
        expect(document.getElementById('experience-filters')).toBeNull();
    });

    test('build one closed group of chips per filter that has values, under the heading', () => {
        const app = loadApp({ body: experiences });
        app.initExperienceFilters();
        const toggle = document.getElementById('experience-filters-toggle');
        const toolbar = document.getElementById('experience-filters');
        expect(toggle.nextElementSibling).toBe(toolbar);
        expect(document.querySelector('#experiences h2').nextElementSibling).toBe(toggle);
        expect(toolbar.hidden).toBe(true);
        expect([...toolbar.querySelectorAll('.filter-group-label')].map(label => label.textContent)).toEqual(['Contract', 'Company type', 'Sector']);
        expect([...toolbar.querySelectorAll('.filter-chip')].map(chip => chip.textContent)).toEqual(['CDI', 'Internship', 'Startup', 'Health']);
        toggle.click();
        expect(toolbar.hidden).toBe(false);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        toggle.click();
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    test('keep the experiences that carry every active chip, count them on the toggle, and reset', () => {
        const app = loadApp({ body: experiences });
        app.initExperienceFilters();
        const chip = text => [...document.querySelectorAll('.filter-chip')].find(element => element.textContent === text);
        const [first, second] = document.querySelectorAll('.resume-wrap');
        const toggleLabel = document.querySelector('#experience-filters-toggle span');
        chip('CDI').click();
        expect(chip('CDI').getAttribute('aria-pressed')).toBe('true');
        expect(second.classList.contains('filtered-out')).toBe(true);
        expect(first.classList.contains('fadeInUp')).toBe(true);
        expect(toggleLabel.textContent).toMatch(/\(1\)$/);
        expect(document.getElementById('experiences-empty').classList.contains('d-none')).toBe(true);
        chip('Internship').click();
        expect(first.classList.contains('filtered-out')).toBe(true);
        expect(document.getElementById('experiences-empty').classList.contains('d-none')).toBe(false);
        chip('Internship').click();
        expect(chip('Internship').classList.contains('active')).toBe(false);
        expect(first.classList.contains('filtered-out')).toBe(false);
        document.getElementById('experience-filters-reset').click();
        expect(document.querySelectorAll('.filter-chip.active')).toHaveLength(0);
        expect(second.classList.contains('filtered-out')).toBe(false);
        expect(second.classList.contains('fadeInUp')).toBe(false);
        expect(toggleLabel.textContent).not.toMatch(/\(/);
    });
});

describe('the home page', () => {
    // The menu: links 0 to 6 in the navbar, link 7 (education) in the resume submenu, and the scroll-down arrow left out of the sequence
    const navLinks = ['Home', 'About', 'Resume', 'Services', 'Projects', 'Blog', 'Contact'].map(label => `<a class="nav-link">${label}</a>`).join('');
    const homeBody = `<nav id="ftco-navbar">${navLinks}<a class="nav-link mouse-icon" href="#resume-section">Down</a></nav>
        <div id="navi"><a class="nav-link">Education</a></div>
        <section id="home-section"></section><section id="about-section"></section><section id="education"></section>
        <span id="ftco-visitor"></span><span id="last-update-date"></span>`;

    test('counts the visit, sets the menu, keeps the hash of the URL, and dates the CV', async () => {
        const app = loadApp({ body: homeBody, url: '/en#about-section', before: () => routeFetch({ 'functions/visit': { visits: 42 }, 'functions/env?lang=en': { date: '2026-10-01T16:40:00Z' } }) });
        app.initIndexPage('en');
        await flush();
        expect($('#ftco-visitor').text()).toBe('42');
        expect([...document.querySelectorAll('#ftco-navbar .nav-link:not(.mouse-icon)')].map(link => link.getAttribute('href'))).toEqual(['#home-section', '#about-section', '#resume-section', '#services-section', '#projects-section', '#blog-section', '#contact-section']);
        expect($('.mouse-icon').attr('href')).toBe('#resume-section');
        expect(sessionStorage.getItem('currentHash')).toBe('about-section');
        expect(window.location.hash).toBe('');
        expect(window.loadImages.mock.calls.map(call => call[0])).toEqual(['.logo-school', '.blog-img', '.project.img', '.article-image']);
        expect($('#last-update-date').text()).toBe('date 2026-10-01T16:40:00Z');
        expect(window.convertDate).toHaveBeenCalledWith('2026-10-01T16:40:00Z', 'en', { dateStyle: 'short', timeStyle: 'medium' }, false);
    });

    test('shows the error of the visit counter, and today for the CV when GitHub does not answer', async () => {
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        const app = loadApp({ body: homeBody, before: () => routeFetch({ 'functions/visit': new Error('down'), 'functions/env': { ok: false } }) });
        app.initIndexPage('en');
        await flush();
        expect($('#ftco-visitor').text()).toBe('Error: down');
        expect($('#last-update-date').text()).toBe('now');
        expect(log).toHaveBeenCalledWith(new Error('GitHub fetch failed'));
    });

    test('scrolls to the top for the home link and to a resume part for the submenu, remembering the section', () => {
        const app = loadApp({ body: homeBody });
        app.initIndexPage('en');
        const animate = jest.spyOn($.fn, 'animate');
        const links = document.querySelectorAll('.nav-link:not(.mouse-icon)');
        links[0].click();
        expect(animate).toHaveBeenCalledWith({ scrollTop: 0 }, 500);
        expect(sessionStorage.getItem('currentHash')).toBe('home-section');
        animate.mockClear();
        links[1].click();
        expect(animate).not.toHaveBeenCalled();
        expect(sessionStorage.getItem('currentHash')).toBe('about-section');
        links[7].click();
        expect(animate).toHaveBeenCalledWith({ scrollTop: -180 }, 500);
        expect(sessionStorage.getItem('currentHash')).toBe('education');
    });

    test('follows the scroll: the home link near the top, the section in the middle of the window, and the resume part in the submenu', () => {
        const app = loadApp({ body: homeBody });
        app.initIndexPage('en');
        // Every section spans the middle of the window, except about-section, far below
        jest.spyOn($.fn, 'offset').mockImplementation(function () {
            return { top: this.attr('id') === 'about-section' ? 1e9 : 0, left: 0 };
        });
        jest.spyOn($.fn, 'outerHeight').mockReturnValue(100000);
        Object.defineProperty(window, 'pageYOffset', { value: 0, configurable: true });
        $(window).trigger('scroll');
        expect($('.nav-link[href*="home-section"]').hasClass('active')).toBe(true);
        expect(sessionStorage.getItem('currentHash')).toBe('education');
        expect($('#navi a').hasClass('current')).toBe(true);
        // Further down, the same resume part stays current
        Object.defineProperty(window, 'pageYOffset', { value: 500, configurable: true });
        $(window).trigger('scroll');
        expect($('#navi a').hasClass('current')).toBe(true);
        // A section without an id counts as the home section
        app.appScrollSections.push($('<div>'));
        $(window).trigger('scroll');
        expect(sessionStorage.getItem('currentHash')).toBe('home-section');
        Object.defineProperty(window, 'pageYOffset', { value: 0, configurable: true });
    });

    test('opens Calendly in a popup with the site colour, fetching its files on the first click only', async () => {
        const app = loadApp({ body: '<a id="calendly-cta" href="https://calendly.com/me" data-calendly-url="https://calendly.com/me">Book</a>' });
        window.Calendly = { initPopupWidget: jest.fn() };
        app.initIndexPage('en');
        $('#calendly-cta').trigger('click');
        expect(document.querySelectorAll('link[href$="widget.css"]')).toHaveLength(1);
        scriptFor('external/widget.js').onload();
        await flush();
        expect(window.Calendly.initPopupWidget).toHaveBeenCalledWith({ url: 'https://calendly.com/me', color: '102030' });
        $('#calendly-cta').trigger('click');
        await flush();
        expect(document.querySelectorAll('link[href$="widget.css"]')).toHaveLength(1);
        expect(window.Calendly.initPopupWidget).toHaveBeenCalledTimes(2);
    });

    test('opens the Calendly page in a new tab when its widget cannot be fetched', async () => {
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        const app = loadApp({ body: '<a id="calendly-cta" data-calendly-url="https://calendly.com/me">Book</a>' });
        app.initIndexPage('en');
        $('#calendly-cta').trigger('click');
        scriptFor('external/widget.js').onerror();
        await flush();
        expect(log).toHaveBeenCalled();
        expect(window.open).toHaveBeenCalledWith('https://calendly.com/me', '_blank', 'noopener');
    });

    const chartBody = `<canvas id="skills-chart" data-labels='["A", "B", "C", "D", "E"]' data-title="Time" data-subtitle="5 years" data-center="AI"></canvas>`;

    test('draws the skills chart once, when it comes into view', async () => {
        const app = loadApp({ body: chartBody });
        const Chart = installChart();
        app.initIndexPage('en');
        const canvas = document.getElementById('skills-chart');
        const observer = observerOf(canvas);
        observer.callback([{ isIntersecting: false }]);
        await flush();
        expect(Chart.getChart(canvas)).toBeUndefined();
        // Two callbacks before Chart.js is ready: the second one finds the chart already drawn
        observer.callback([{ isIntersecting: true }]);
        observer.callback([{ isIntersecting: true }]);
        await flush();
        const chart = Chart.getChart(canvas);
        expect(chart.data.labels).toEqual(['A', 'B', 'C', 'D', 'E']);
        expect(chart.options.plugins.title.text).toBe('Time');
        expect(chart.options.plugins.subtitle.text).toBe('5 years');
        expect(observer.disconnect).toHaveBeenCalledTimes(1);
        observer.callback([{ isIntersecting: true }]);
        await flush();
        expect(observer.disconnect).toHaveBeenCalledTimes(1);
    });

    test('keeps watching the skills chart when Chart.js cannot be fetched, to retry', async () => {
        const app = loadApp({ body: chartBody });
        app.initIndexPage('en');
        const observer = observerOf(document.getElementById('skills-chart'));
        observer.callback([{ isIntersecting: true }]);
        scriptFor('js/chart.umd.min.js').onerror();
        await flush();
        expect(observer.disconnect).not.toHaveBeenCalled();
    });

    test('loads the Google scripts of the contact form only when it comes into view', () => {
        const app = loadApp({ body: '<form name="contactForm"></form>' });
        app.initIndexPage('en');
        const observer = observerOf(document.querySelector('form'));
        observer.callback([{ isIntersecting: false }]);
        expect(scriptFor('api.js')).toBeUndefined();
        observer.callback([{ isIntersecting: true }]);
        expect(observer.disconnect).toHaveBeenCalled();
        expect(scriptFor('api.js')).toBeDefined();
    });

    const formBody = '<form name="contactForm"><input name="name" value="Nico"><input name="subject" value="Hello"><textarea name="message">Hi</textarea><button type="submit">Send</button></form><p id="callback-form"></p>';

    // The token client of gisLoaded, whose consent the Google API reports at its first check, then one message sent from the contact form
    async function submitContactForm(app) {
        window.google = { accounts: { oauth2: { initTokenClient: jest.fn(() => ({ requestAccessToken: jest.fn() })) } } };
        window.gapi = { client: { getToken: jest.fn(() => ({ token_type: 'Bearer', access_token: 't' })) } };
        app.gisLoaded();
        await flush();
        app.initPage();
        $('form').trigger('submit');
        await jest.advanceTimersByTimeAsync(3000);
        await flush(20);
    }

    test('sends the message of the contact form once consent is given, then posts a copy to Netlify Forms on the home page of the language', async () => {
        jest.useFakeTimers();
        const app = loadApp({ body: formBody, before: () => routeFetch({ 'functions/env': { ENV_CLIENT_ID: 'id' }, 'gmail/v1': { ok: true }, '/en': { ok: true } }) });
        await submitContactForm(app);
        expect($('#callback-form').text()).toBe(app.getMessage('success-generic'));
        const [, options] = window.fetch.mock.calls.find(([url]) => url === '/en');
        expect(options.method).toBe('POST');
        expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
        expect(Object.fromEntries(new URLSearchParams(options.body))).toEqual({ name: 'Nico', subject: 'Hello', message: 'Hi', 'form-name': 'contactForm' });
    });

    test('logs a copy that Netlify Forms refuses, the e-mail being sent', async () => {
        jest.useFakeTimers();
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        const app = loadApp({ body: formBody, before: () => routeFetch({ 'functions/env': { ENV_CLIENT_ID: 'id' }, 'gmail/v1': { ok: true }, '/en': { ok: false, status: 404 } }) });
        await submitContactForm(app);
        expect($('#callback-form').text()).toBe(app.getMessage('success-generic'));
        expect(log).toHaveBeenCalledWith(new Error('Netlify Forms answered 404'));
    });

    test('logs a message that cannot even be built, without submitting', async () => {
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        const app = loadApp({ body: formBody });
        document.querySelector('meta[property="og:site_name"]').remove();
        app.initPage();
        $('form').trigger('submit');
        await flush(20);
        expect(log).toHaveBeenCalledWith(expect.any(TypeError));
        expect(window.fetch).not.toHaveBeenCalledWith('/en', expect.anything());
    });

    test('unlocks a soft skill card only from its padlock to show its experiences, stops the carousel while one is open, and locks it again', () => {
        const card = () => '<div class="soft-card"><button class="soft-card-toggle" aria-expanded="false"><i class="icon-lock"></i></button><div class="soft-card-back" aria-hidden="true"></div></div>';
        const app = loadApp({ body: `<div id="soft-skills">${card()}${card()}</div>` });
        app.initSoftSkillCards();
        const autoplay = [];
        $('#soft-skills').on('stop.owl.autoplay play.owl.autoplay', event => autoplay.push(event.type));
        const [team, empathy] = $('.soft-card').toArray().map(element => $(element));
        const state = skill => [skill.hasClass('is-unlocked'), skill.find('.soft-card-toggle').attr('aria-expanded'), skill.find('i').attr('class'), skill.find('.soft-card-back').attr('aria-hidden')];
        team.trigger('click');
        expect(state(team)).toEqual([false, 'false', 'icon-lock', 'true']);
        team.find('.soft-card-toggle').trigger('click');
        expect(state(team)).toEqual([true, 'true', 'icon-unlock', 'false']);
        expect(state(empathy)).toEqual([false, 'false', 'icon-lock', 'true']);
        empathy.find('.soft-card-toggle').trigger('click');
        team.find('.soft-card-toggle').trigger('click');
        expect(state(team)).toEqual([false, 'false', 'icon-lock', 'true']);
        empathy.find('.soft-card-toggle').trigger('click');
        expect(autoplay).toEqual(['stop', 'stop', 'stop', 'play']);
    });

    test('lights the pipeline steps one after the other while on screen, loops back to the first and pauses off screen', () => {
        jest.useFakeTimers();
        const app = loadApp({ body: '<ol class="pipeline"><li class="pipeline-step"></li><li class="pipeline-step"></li><li class="pipeline-step"></li></ol>' });
        app.initPipelineLoop();
        const pipeline = document.querySelector('.pipeline');
        const observer = observerOf(pipeline);
        const lit = () => [...document.querySelectorAll('.pipeline-step')].map(step => step.classList.contains('is-active'));
        expect(lit()).toEqual([true, false, false]);
        // Not moving until it comes into view
        jest.advanceTimersByTime(2400);
        expect(lit()).toEqual([true, false, false]);
        observer.callback([{ isIntersecting: true, target: pipeline }]);
        jest.advanceTimersByTime(1200);
        expect(lit()).toEqual([false, true, false]);
        // A second report of being on screen doesn't start a second loop
        observer.callback([{ isIntersecting: true, target: pipeline }]);
        jest.advanceTimersByTime(2400);
        expect(lit()).toEqual([true, false, false]);
        observer.callback([{ isIntersecting: false, target: pipeline }]);
        jest.advanceTimersByTime(3600);
        expect(lit()).toEqual([true, false, false]);
        observer.callback([{ isIntersecting: true, target: pipeline }]);
        jest.advanceTimersByTime(1200);
        expect(lit()).toEqual([false, true, false]);
    });

    test('lights the branches out of the deploy together, as one stage', () => {
        jest.useFakeTimers();
        const app = loadApp({ body: '<ol class="pipeline"><li class="pipeline-step"></li><li class="pipeline-outputs"><ol class="pipeline-branches"><li class="pipeline-step"></li><li class="pipeline-step"></li></ol></li></ol>' });
        app.initPipelineLoop();
        const pipeline = document.querySelector('.pipeline');
        observerOf(pipeline).callback([{ isIntersecting: true, target: pipeline }]);
        const lit = () => [...document.querySelectorAll('.pipeline-step')].map(step => step.classList.contains('is-active'));
        expect(lit()).toEqual([true, false, false]);
        jest.advanceTimersByTime(1200);
        expect(lit()).toEqual([false, true, true]);
        jest.advanceTimersByTime(1200);
        expect(lit()).toEqual([true, false, false]);
    });

    test('lights the webhook between the CI and CD boxes as a stage of its own', () => {
        jest.useFakeTimers();
        const app = loadApp({ body: '<ol class="pipeline"><li class="pipeline-step"></li><li class="pipeline-link"></li><li class="pipeline-step"></li></ol>' });
        app.initPipelineLoop();
        const pipeline = document.querySelector('.pipeline');
        observerOf(pipeline).callback([{ isIntersecting: true, target: pipeline }]);
        jest.advanceTimersByTime(1200);
        expect(document.querySelector('.pipeline-link').classList.contains('is-active')).toBe(true);
        expect(document.querySelectorAll('.is-active')).toHaveLength(1);
    });

    test('runs one stretch along the line from each lit stage to the next, up to the fork of the branches, which has its own beat', () => {
        jest.useFakeTimers();
        const animate = jest.fn();
        const app = loadApp({ body: '<div class="pipeline-frame"><ol class="pipeline"><li class="pipeline-step"><span class="pipeline-icon"></span></li><li class="pipeline-link"><svg class="pipeline-ecg"><path class="pipeline-ecg-trace"></path></svg></li><li class="pipeline-outputs"><ol class="pipeline-branches"><li class="pipeline-step"><span class="pipeline-icon"></span></li><li class="pipeline-step"></li></ol></li></ol></div>', before: () => { Element.prototype.animate = animate; } });
        app.initPipelineLoop();
        const runners = document.querySelectorAll('.pipeline-frame > .pipeline-runner');
        expect(runners).toHaveLength(1);
        expect(runners[0].getAttribute('aria-hidden')).toBe('true');
        const pipeline = document.querySelector('.pipeline');
        observerOf(pipeline).callback([{ isIntersecting: true, target: pipeline }]);
        // From the circle of the first step to the trace of the webhook, then from the webhook to the fork, then nothing on the branches
        expect(animate).toHaveBeenCalledTimes(1);
        expect(animate.mock.calls[0][0][0].transform).toBe('translate(0px, 0px)');
        expect(animate.mock.calls[0][1]).toEqual({ duration: 1200, easing: 'linear' });
        jest.advanceTimersByTime(1200);
        expect(animate).toHaveBeenCalledTimes(2);
        // Out of the webhook, hidden for the first half while the beat crosses the trace, then seen
        expect(animate.mock.calls[1][0].map(frame => frame.opacity)).toEqual([0, 0, 1, 1]);
        jest.advanceTimersByTime(1200);
        expect(animate).toHaveBeenCalledTimes(2);
        // Seen again from the first stage once the loop comes back to it
        jest.advanceTimersByTime(1200);
        expect(animate).toHaveBeenCalledTimes(3);
        // Back on screen while already running: no second loop and no second stretch
        observerOf(pipeline).callback([{ isIntersecting: true, target: pipeline }]);
        expect(animate).toHaveBeenCalledTimes(3);
        delete Element.prototype.animate;
    });

    test('leaves the pipeline unlit without steps or under reduced motion', () => {
        let app = loadApp();
        expect(() => app.initPipelineLoop()).not.toThrow();
        app = loadApp({ body: '<ol class="pipeline"><li class="pipeline-step"></li></ol>', before: () => { window.matchMedia = jest.fn(() => ({ matches: true })); } });
        app.initPipelineLoop();
        expect(document.querySelector('.is-active')).toBeNull();
    });

    test('runs the bingo: the counter stops on the second click, a win on 2713 and a loss otherwise', () => {
        jest.useFakeTimers();
        const app = loadApp({ body: '<button id="bingo-btn" data-stop="Stop">Play</button><span id="bingo-timer"></span>' });
        app.loadBingo();
        $('#bingo-btn').trigger('click');
        expect($('#bingo-btn').text()).toBe('Stop');
        jest.advanceTimersByTime(27130);
        expect($('#bingo-timer').text()).toBe('2713');
        $('#bingo-btn').trigger('click');
        expect($('#bingo-timer').hasClass('victory')).toBe(true);
        expect($('#bingo-btn').text()).toBe('Play');
        $('#bingo-btn').trigger('click');
        expect($('#bingo-timer').hasClass('victory')).toBe(false);
        jest.advanceTimersByTime(10);
        $('#bingo-btn').trigger('click');
        expect($('#bingo-timer').hasClass('defeat')).toBe(true);
    });
});

describe('the blog page', () => {
    const navLinks = ['Home', 'About', 'Resume', 'Services', 'Projects', 'Blog'].map(label => `<a class="nav-link">${label}</a>`).join('');
    const blogBody = `<nav id="ftco-navbar">${navLinks}</nav>
        <form class="search-form"><input name="search-input"><span class="icon-search"></span><span class="icon-times"></span></form>
        <ul id="search-suggestions"></ul><p id="search-info"></p>
        <a class="blog-img"></a><h3 id="recent-article-heading"></h3><div class="meta"></div>
        <div class="tagcloud"><a>old</a></div>
        <div class="sidebar" data-diploma-alt="My diploma"></div>
        <div id="article-shape"><div class="kept">kept</div></div>
        <div class="about-author d-none"></div>`;
    // A whole article page, as the article function serves it: its own navbar, loader, counter and footer, and markup the sanitizer must strip
    const articleHtml = `<html><head><meta charset="utf-8"><link rel="stylesheet" href="x.css"><style>p {}</style></head><body>
        <nav id="ftco-navbar"></nav><div id="ftco-loader" class="show"></div><span id="ftco-visitor">9</span>
        <article class="article-container"><!-- a comment the search skips --><p>I write HTML and CSS. html!</p>
            <div class="card"><input type="checkbox"><p>More HTML here</p></div>
            <a href="http://evil.example">bad</a><a href="https://ok.example">ok</a><a article-link="mcs">next</a>
            <img id="bad-img" src="java script:alert(1)" onclick="x()"><img id="good-img" src="images/a.png" srcdoc="x">
            <script>window.injected = true;</script><iframe src="x"></iframe><object></object><embed>
        </article>
        <footer id="ftco-footer"></footer></body></html>`;

    // Opens the blog page on a URL and lets the article load; standalone runs the onload of js/standalone.js, as the browser would
    async function openBlog({ url = '/en/blog', body = blogBody, article = articleHtml, articles: blogArticles, session, before } = {}) {
        if (session) sessionStorage.setItem('currentHash', session);
        const app = loadApp({ body, url, route: 'blog', articles: blogArticles, before: () => {
            routeFetch({ 'functions/article': article });
            before?.();
        } });
        app.initBlogPage('en');
        scriptFor('js/standalone.js')?.onload?.();
        await flush(20);
        return app;
    }

    test('opens the presentation on a bare /blog, injects the sanitized article, and fills the sidebar', async () => {
        await openBlog();
        expect([...document.querySelectorAll('.nav-link')].map(link => link.getAttribute('href'))).toEqual(['/en#home-section', '/en#about-section', '/en#resume-section', '/en#services-section', '/en#projects-section', '/en#blog-section']);
        expect($('.nav-link').eq(5).hasClass('active')).toBe(true);
        expect(window.fetch).toHaveBeenCalledWith('https://nicoboga.netlify.app/.netlify/functions/article?filename=presentation_en.html');
        expect(sessionStorage.getItem('currentHash')).toBe('presentation');
        expect(window.location.hash).toBe('');
        expect(document.querySelectorAll('link[href="css/standalone.css"]')).toHaveLength(1);
        const shape = $('#article-shape');
        for (const selector of ['#ftco-navbar', '#ftco-footer', '#ftco-loader', '#ftco-visitor', 'script', 'iframe', 'object', 'embed', 'style', 'link', 'meta']) {
            expect(shape.find(selector)).toHaveLength(0);
        }
        expect($('#bad-img').attr('src')).toBeUndefined();
        expect($('#bad-img').attr('onclick')).toBeUndefined();
        expect($('#good-img').attr('src')).toBe('images/a.png');
        expect($('#good-img').attr('srcdoc')).toBeUndefined();
        expect(shape.find('a').map((index, link) => link.getAttribute('href')).get()).toEqual(['/404', 'https://ok.example', '/en/blog#mcs']);
        expect(shape.children().last().hasClass('kept')).toBe(true);
        expect(window.injected).toBeUndefined();
        expect(window.initArticle).toHaveBeenCalledWith(false);
        expect($('.about-author').hasClass('d-flex')).toBe(true);
        const recent = recentTo('presentation');
        expect($('.blog-img').attr('href')).toBe(`/en/blog#${recent.slug}`);
        expect(window.loadImages).toHaveBeenCalledWith('.blog-img', 'avif', true);
        expect($('#recent-article-heading').text()).toBe(recent.title);
        expect($('.meta').text()).toBe(` date ${recent.date}`);
        expect($('.meta i').hasClass('icon-calendar')).toBe(true);
        // A plain tag links nowhere, a tag with an address links to it
        const tags = articles.find(article => article.slug === 'presentation').tags.map(tag => (typeof tag === 'string' ? [tag, '#'] : Object.entries(tag)[0]));
        expect($('.tagcloud a').map((index, link) => [[link.textContent, link.getAttribute('href')]]).get()).toEqual(tags);
        const diploma = $('.sidebar img');
        expect(diploma.attr('alt')).toBe('My diploma');
        expect(diploma.attr('width')).toBe('267');
        $('.nav-link').eq(1)[0].click();
        expect(sessionStorage.getItem('currentHash')).toBe('about-section');
    });

    test('opens the article of the remembered slug, keeping the stylesheet and the script already on the page', async () => {
        // A bare article, without the navbar, loader, counter and footer of a whole page
        await openBlog({ session: 'mcs', article: '<article class="article-container"><p>MCS</p></article>', body: `${blogBody}<link rel="stylesheet" href="css/standalone.css"><script src="js/standalone.js"></script>` });
        expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('filename=mcs_en.html'));
        expect(document.querySelectorAll('link[href="css/standalone.css"]')).toHaveLength(1);
        expect(document.querySelectorAll('script[src="js/standalone.js"]')).toHaveLength(1);
        expect($('#article-shape .article-container').text()).toBe('MCS');
        expect($('.sidebar img')).toHaveLength(0);
        expect($('.blog-img').attr('href')).toBe(`/en/blog#${recentTo('mcs').slug}`);
    });

    test('ignores a remembered section that is not an article, and opens the presentation', async () => {
        await openBlog({ session: 'blog-section' });
        expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('filename=presentation_en.html'));
    });

    test('has no recent article to show when the blog holds one article only', async () => {
        await openBlog({ articles: articles.filter(article => article.slug === 'presentation') });
        expect($('#recent-article-heading').text()).toBe('');
        expect($('.blog-img').attr('href')).toBeUndefined();
    });

    test('shows the error, centered, for a broken link, an error answer, a missing script or an unknown slug', async () => {
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        const expectError = () => {
            expect($('#article-shape').hasClass('error-message')).toBe(true);
            expect($('#article-shape').text()).toBe(window.i18next.t('error-generic'));
            expect(document.body.classList.contains('article-error')).toBe(true);
            expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
            expect($('.about-author').hasClass('d-flex')).toBe(true);
        };
        await openBlog({ article: "<p>It seems you've hit a broken link or the page has moved</p>" });
        expectError();
        await openBlog({ article: '{"error":"Internal error"}' });
        expectError();
        const app = loadApp({ body: blogBody, url: '/en/blog#mcs', route: 'blog', before: () => routeFetch({ 'functions/article': articleHtml }) });
        app.initBlogPage('en');
        scriptFor('js/standalone.js').onerror();
        await flush(20);
        expectError();
        await openBlog({ url: '/en/blog#unknown', before: () => routeFetch({ 'functions/article': new Error('404') }) });
        expectError();
        expect($('.sidebar')).toHaveLength(0);
        expect(log).toHaveBeenCalled();
    });

    test('shows the error without a fetch when no slug is left at all', async () => {
        await openBlog({ before: () => jest.spyOn(history, 'replaceState').mockImplementation(() => {}) });
        expect(window.fetch).not.toHaveBeenCalled();
        expect($('#article-shape').hasClass('error-message')).toBe(true);
        expect($('.sidebar')).toHaveLength(0);
    });

    test('suggests keywords while typing, and highlights the one picked', async () => {
        jest.useFakeTimers();
        const app = await openBlog();
        const input = $('input[name="search-input"]');
        const suggestions = $('#search-suggestions');
        expect($('.icon-times').css('display')).toBe('none');
        input.val('htm').trigger('input');
        jest.advanceTimersByTime(300);
        expect(suggestions.find('li').map((index, item) => item.textContent).get()).toEqual(['HTML']);
        expect(suggestions.css('display')).not.toBe('none');
        expect($('.icon-times').css('display')).not.toBe('none');
        suggestions.find('li').trigger('mousedown');
        expect(input.val()).toBe('HTML');
        expect($('.article-container mark.highlight')).toHaveLength(3);
        // The cities of config.authorCities in package.json are keywords too
        const [city] = require('../package.json').config.authorCities;
        input.val(city.toLowerCase()).trigger('input');
        jest.advanceTimersByTime(300);
        expect(suggestions.find('li').map((index, item) => item.textContent).get()).toContain(city);
        input.val('zzzz').trigger('input');
        jest.advanceTimersByTime(300);
        expect(suggestions.css('display')).toBe('none');
        input.val('').trigger('input');
        jest.advanceTimersByTime(300);
        expect(suggestions.css('display')).toBe('none');
        expect($('.icon-times').css('display')).toBe('none');
        input.val('css').trigger('input');
        jest.advanceTimersByTime(300);
        input.trigger('blur');
        expect(suggestions.css('display')).toBe('none');
        expect(app.getMessage('search-no-result')).toBeTruthy();
    });

    test('counts the occurrences on submit, goes from one to the next with the search icon, and resets', async () => {
        jest.useFakeTimers();
        await openBlog();
        const input = $('input[name="search-input"]');
        const info = $('#search-info');
        const marks = () => $('.article-container mark.highlight');
        $('.search-form').trigger('submit');
        expect(info.text()).toBe('');
        input.val('html');
        $('.search-form').trigger('submit');
        expect(info.text()).toBe('3 occurrences');
        expect($('.icon-search').hasClass('search-help')).toBe(true);
        jest.advanceTimersByTime(2500);
        expect($('.icon-search').hasClass('search-help')).toBe(false);
        $('.icon-search').trigger('click');
        expect(marks().eq(0).hasClass('current-match')).toBe(true);
        $('.icon-search').trigger('click');
        $('.icon-search').trigger('click');
        expect(marks().eq(2).hasClass('current-match')).toBe(true);
        expect($('.card input').prop('checked')).toBe(true);
        expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
        // Enter goes on to the next one, back to the first after the last
        input.trigger($.Event('keydown', { key: 'Enter' }));
        expect(marks().eq(0).hasClass('current-match')).toBe(true);
        input.val('css');
        $('.search-form').trigger('submit');
        expect(info.text()).toBe('1 occurrence');
        input.val('nothing');
        $('.search-form').trigger('submit');
        expect(info.text()).toBe(window.i18next.t('search-no-result'));
        expect(info.hasClass('no-result')).toBe(true);
        // Without occurrences, the search icon submits the form again
        input.val('html');
        $('.icon-search').trigger('click');
        expect(info.text()).toBe('3 occurrences');
        // Any other key puts the article back as it was
        input.trigger($.Event('keydown', { key: 'a' }));
        expect(marks()).toHaveLength(0);
        expect(info.css('display')).toBe('none');
        input.val('html');
        $('.search-form').trigger('submit');
        $('.icon-times').trigger('click');
        expect(input.val()).toBe('');
        expect(marks()).toHaveLength(0);
        expect(info.text()).toBe('');
        expect($('.icon-times').css('display')).toBe('none');
    });

    test('leaves the page alone when the search is reset or run before an article is loaded', async () => {
        const app = loadApp({ body: blogBody, url: '/en/blog', route: 'blog' });
        app.initBlogPage('en');
        app.highlightKeywords(['html']);
        app.scrollToNextHighlight();
        $('.icon-times').trigger('click');
        expect($('#article-shape .kept')).toHaveLength(1);
    });

    test('opens the recent article on a plain click, reloading the page for its hash', async () => {
        jest.useFakeTimers();
        await openBlog();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const event = $.Event('click');
        $('.blog-img').trigger(event);
        expect(event.isDefaultPrevented()).toBe(true);
        expect(window.location.hash).toBe(`#${recentTo('presentation').slug}`);
        jest.advanceTimersByTime(150);
    });
});

describe('initPage', () => {
    const pageBody = `<button id="cv-download"></button>
        <span class="open-mfp" data-target="#contact-window" aria-expanded="false"></span>
        <div id="contact-window" class="mfp" hidden><span class="mfp-close"></span></div>
        <span class="other-control" aria-controls="contact-window"></span>
        <span class="owl-menu" data-target="#hard-skills"></span><span class="owl-menu" data-target="#soft-skills"></span>
        <div id="hard-skills" class="owl-carousel"></div><div id="soft-skills" class="owl-carousel d-none"></div><div id="mad-skills" class="owl-carousel"></div>
        <a href="#" id="empty-link">x</a><input name="search-input">`;

    test('runs the home page on the home route, the blog page on the blog route, and neither elsewhere', () => {
        let app = loadApp({ body: '<span id="ftco-visitor"></span>', route: 'index' });
        app.initPage();
        expect(window.fetch).toHaveBeenCalledWith('/.netlify/functions/visit');
        app = loadApp({ body: '<div id="article-shape"></div>', route: 'blog', url: '/en/blog' });
        app.initPage();
        expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('functions/article'));
        app = loadApp({ route: 'policy', url: '/en/policy' });
        app.initPage();
        expect(window.fetch).not.toHaveBeenCalled();
        expect(window.loadImages).toHaveBeenCalledWith('.icon.svg', 'svg');
        expect(window.initTranslator).toHaveBeenCalled();
    });

    test('shows the CV button as loading for two seconds', () => {
        jest.useFakeTimers();
        const app = loadApp({ body: pageBody, route: 'policy' });
        app.initPage();
        $('#cv-download').trigger('click');
        expect($('#cv-download').hasClass('loading')).toBe(true);
        jest.advanceTimersByTime(2000);
        expect($('#cv-download').hasClass('loading')).toBe(false);
    });

    test('opens and closes the contact window with a click, Enter or Space, and its close button', () => {
        const app = loadApp({ body: pageBody, route: 'policy' });
        app.initPage();
        const opener = $('.open-mfp');
        opener.trigger('click');
        expect($('#contact-window').prop('hidden')).toBe(false);
        expect(opener.attr('aria-expanded')).toBe('true');
        opener.trigger($.Event('keydown', { key: 'Enter' }));
        expect($('#contact-window').prop('hidden')).toBe(true);
        expect(opener.attr('aria-expanded')).toBe('false');
        opener.trigger($.Event('keydown', { key: ' ' }));
        expect($('#contact-window').prop('hidden')).toBe(false);
        opener.trigger($.Event('keydown', { key: 'a' }));
        expect($('#contact-window').prop('hidden')).toBe(false);
        $('.mfp-close').trigger('click');
        expect($('#contact-window').prop('hidden')).toBe(true);
        expect($('[aria-controls="contact-window"]').attr('aria-expanded')).toBe('false');
    });

    test('switches the skills carousels, starting one the first time it is shown', () => {
        const app = loadApp({ body: pageBody, route: 'policy' });
        app.initPage();
        $.fn.owlCarousel.mockClear();
        const refresh = jest.fn();
        $('#soft-skills').on('refresh.owl.carousel', refresh);
        $('.owl-menu').eq(1).trigger('click');
        expect($.fn.owlCarousel).toHaveBeenCalledTimes(1);
        expect($('#soft-skills').hasClass('d-none')).toBe(false);
        expect(refresh).toHaveBeenCalled();
        expect($('#hard-skills').hasClass('d-none')).toBe(true);
        expect($('#hard-skills').hasClass('active')).toBe(false);
        expect($('#mad-skills').hasClass('d-none')).toBe(true);
        $('.owl-menu').eq(0).trigger('click');
        expect($.fn.owlCarousel).toHaveBeenCalledTimes(1);
        expect($('.owl-menu').eq(0).hasClass('active')).toBe(true);
        expect($('.owl-menu').eq(1).hasClass('active')).toBe(false);
    });

    test('keeps the empty links in place, and turns Ctrl+F or Cmd+F into the article search', () => {
        jest.useFakeTimers();
        const app = loadApp({ body: pageBody, route: 'policy' });
        app.initPage();
        const click = new MouseEvent('click', { bubbles: true, cancelable: true });
        document.getElementById('empty-link').dispatchEvent(click);
        expect(click.defaultPrevented).toBe(true);
        const search = $('input[name="search-input"]');
        $(document).trigger($.Event('keydown', { key: 'g', ctrlKey: true }));
        expect(search.hasClass('highlight-flash')).toBe(false);
        const find = $.Event('keydown', { key: 'F', ctrlKey: true });
        $(document).trigger(find);
        expect(find.isDefaultPrevented()).toBe(true);
        expect(search.hasClass('highlight-flash')).toBe(true);
        expect(document.activeElement).toBe(search[0]);
        jest.advanceTimersByTime(1000);
        expect(search.hasClass('highlight-flash')).toBe(false);
        $(document).trigger($.Event('keydown', { key: 'f', metaKey: true }));
        expect(search.hasClass('highlight-flash')).toBe(true);
        $(document).trigger($.Event('keydown', { key: 'f' }));
    });
});

describe('the contact form', () => {
    const body = '<form name="contactForm"><button type="submit" disabled>Send</button></form><p id="callback-form"></p>';
    const token = { token_type: 'Bearer', access_token: 't' };
    // The message the Gmail API received, decoded from its URL-safe base64
    const sentMessage = () => {
        const raw = JSON.parse(window.fetch.mock.calls.find(call => String(call[0]).includes('gmail'))[1].body).raw;
        return atob(raw.replaceAll('-', '+').replaceAll('_', '/'));
    };

    test('initializes the Gmail API client once the Google API script has loaded', () => {
        const app = loadApp();
        window.gapi = { load: jest.fn((name, callback) => callback()), client: { init: jest.fn(() => Promise.resolve()) } };
        app.gapiLoaded();
        expect(window.gapi.load).toHaveBeenCalledWith('client', expect.any(Function));
        expect(window.gapi.client.init).toHaveBeenCalledWith({ discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'] });
    });

    test('creates the OAuth token client with the client id of the env function, whose callback throws a refusal', async () => {
        const app = loadApp({ before: () => routeFetch({ 'functions/env': { ENV_CLIENT_ID: 'client-id' } }) });
        window.google = { accounts: { oauth2: { initTokenClient: jest.fn(config => ({ config })) } } };
        app.gisLoaded();
        await flush();
        const [config] = window.google.accounts.oauth2.initTokenClient.mock.calls[0];
        expect(config.client_id).toBe('client-id');
        expect(config.scope).toBe('https://www.googleapis.com/auth/gmail.send');
        expect(() => config.callback({ access_token: 't' })).not.toThrow();
        expect(() => config.callback({ error: 'access_denied' })).toThrow();
    });

    test('logs a token client that could not be created', async () => {
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        const app = loadApp({ before: () => routeFetch({ 'functions/env': new Error('down') }) });
        app.gisLoaded();
        await flush();
        expect(log).toHaveBeenCalledWith(new Error('down'));
    });

    test('sends the message with the token of the consent, without line breaks in the headers, and forgets everything on https', async () => {
        jest.useFakeTimers();
        const app = loadApp({ body, before: () => routeFetch({ 'functions/env': { ENV_CLIENT_ID: 'id' }, 'gmail/v1': { ok: true } }) });
        const client = await withConsent(app, 0);
        sessionStorage.setItem('currentHash', 'contact-section');
        const sending = app.sendEmail('Nico\r\nBcc: x', 'Hello\nthere', 'Hi');
        await jest.advanceTimersByTimeAsync(3000);
        await sending;
        const [url, init] = window.fetch.mock.calls.find(call => String(call[0]).includes('gmail'));
        expect(url).toBe('https://www.googleapis.com/gmail/v1/users/me/messages/send');
        expect(init.headers.Authorization).toBe('Bearer t');
        const message = sentMessage();
        expect(message).toContain('To: me@example.com');
        expect(message).toContain('Subject: Hello there');
        expect(message).toContain('Message sent by Nico Bcc: x (Portfolio)');
        expect(JSON.parse(init.body).raw).not.toMatch(/[=+/]/);
        expect($('#callback-form').text()).toBe(app.getMessage('success-generic'));
        expect(sessionStorage.length).toBe(0);
        // The next message asks for consent again
        const next = app.sendEmail('Nico', 'Hello', 'Hi');
        await jest.advanceTimersByTimeAsync(3000);
        await next;
        expect(client.requestAccessToken).toHaveBeenCalledTimes(2);
    });

    test('shows the error when Gmail refuses the message or cannot be reached', async () => {
        jest.useFakeTimers();
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        let app = loadApp({ body, before: () => routeFetch({ 'functions/env': { ENV_CLIENT_ID: 'id' }, 'gmail/v1': { ok: false } }) });
        await withConsent(app, 0);
        let sending = app.sendEmail('Nico', 'Hello', 'Hi');
        await jest.advanceTimersByTimeAsync(3000);
        await sending;
        expect($('#callback-form').text()).toBe(`${app.getMessage('error-generic')} ${app.getMessage('contact-mailto')}`);
        expect(log).not.toHaveBeenCalled();
        app = loadApp({ body, before: () => routeFetch({ 'functions/env': { ENV_CLIENT_ID: 'id' }, 'gmail/v1': new Error('offline') }) });
        await withConsent(app, 0);
        sending = app.sendEmail('Nico', 'Hello', 'Hi');
        await jest.advanceTimersByTimeAsync(3000);
        await sending;
        expect(log).toHaveBeenCalledWith(new Error('offline'));
        expect($('#callback-form').text()).toBe(`${app.getMessage('error-generic')} ${app.getMessage('contact-mailto')}`);
    });

    test('offers the mail app, with the subject and the message filled in, when the send fails', async () => {
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        const app = loadApp({ body });
        await app.sendEmail('Nico', 'Hello\nthere & you', 'Hi?\nBye');
        expect(log).toHaveBeenCalled();
        const link = $('#callback-form a');
        expect(link.text()).toBe(app.getMessage('contact-mailto'));
        expect(link.attr('href')).toBe('mailto:me@example.com?subject=Hello%20there%20%26%20you&body=Hi%3F%0ABye');
    });

    test('shows the error when there is no token and the token client was never created', async () => {
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        const app = loadApp({ body });
        await app.sendEmail('Nico', 'Hello', 'Hi');
        expect(log).toHaveBeenCalledWith(expect.any(TypeError));
        expect($('#callback-form').text()).toBe(`${app.getMessage('error-generic')} ${app.getMessage('contact-mailto')}`);
    });

    // The token client of gisLoaded, then a consent the Google API reports after the given number of checks, or never
    async function withConsent(app, checksBeforeConsent) {
        window.google = { accounts: { oauth2: { initTokenClient: jest.fn(() => ({ requestAccessToken: jest.fn() })) } } };
        let checks = 0;
        window.gapi = { client: { getToken: jest.fn(() => (++checks > checksBeforeConsent ? token : null)) } };
        app.gisLoaded();
        await flush();
        return window.google.accounts.oauth2.initTokenClient.mock.results[0].value;
    }

    test('asks for consent, checks for the token every 3 seconds, and sends once it is given', async () => {
        jest.useFakeTimers();
        const app = loadApp({ body, before: () => routeFetch({ 'functions/env': { ENV_CLIENT_ID: 'id' }, 'gmail/v1': { ok: true } }) });
        const client = await withConsent(app, 2);
        const sending = app.sendEmail('Nico', 'Hello', 'Hi');
        expect(client.requestAccessToken).toHaveBeenCalledWith({ prompt: 'consent' });
        await jest.advanceTimersByTimeAsync(9000);
        await sending;
        expect(window.gapi.client.getToken).toHaveBeenCalledTimes(3);
        expect($('#callback-form').text()).toBe(app.getMessage('success-generic'));
    });

    test('gives up after 2 minutes without consent', async () => {
        jest.useFakeTimers();
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        const app = loadApp({ body, before: () => routeFetch({ 'functions/env': { ENV_CLIENT_ID: 'id' } }) });
        await withConsent(app, Infinity);
        const sending = app.sendEmail('Nico', 'Hello', 'Hi');
        await jest.advanceTimersByTimeAsync(120000);
        await sending;
        expect(window.gapi.client.getToken).toHaveBeenCalledTimes(40);
        expect(log).toHaveBeenCalledWith(new Error('Consent not given within 120 seconds'));
        expect($('#callback-form').text()).toBe(`${app.getMessage('error-generic')} ${app.getMessage('contact-mailto')}`);
    });

    test('enables the send button once the reCAPTCHA is solved', () => {
        const app = loadApp({ body });
        window.grecaptcha = { getResponse: jest.fn(() => '') };
        app.enableSubmitForm();
        expect($('button').prop('disabled')).toBe(true);
        window.grecaptcha.getResponse.mockReturnValue('solved');
        app.enableSubmitForm();
        expect($('button').prop('disabled')).toBe(false);
    });

    test('renders the reCAPTCHA with the site key of the env function, and logs a failure', async () => {
        let app = loadApp({ body, before: () => routeFetch({ 'functions/env': { SITE_RECAPTCHA_KEY: 'site-key' } }) });
        window.grecaptcha = { render: jest.fn() };
        app.initCaptcha();
        await flush();
        expect(window.grecaptcha.render).toHaveBeenCalledWith('captcha-check', { sitekey: 'site-key', callback: app.enableSubmitForm });
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        app = loadApp({ body, before: () => routeFetch({ 'functions/env': new Error('down') }) });
        app.initCaptcha();
        await flush();
        expect(log).toHaveBeenCalledWith(new Error('down'));
    });
});
