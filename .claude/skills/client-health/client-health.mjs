#!/usr/bin/env node
// Opens every page of the live site in headless Chromium, as a visitor's browser gets it (the real headers of Netlify, its Content-Security-Policy included), and reports per page: the status, the CSP violations, the console errors, the uncaught exceptions, the failed or 4xx / 5xx requests (the site's own apart from the third-party hosts), the time to first byte, the LCP and the CLS; then, on the home page, whether the third-party pieces a visitor opens still load (the contact form scripts and the captcha, the booking popup, the chatbot), the service worker, the Poppins font, and that nothing of Google Analytics loads before consent.
// Read-only: the visit function is answered here, never called (each call adds a visit to the counter), the consent banner is never accepted, no form is sent, no message is written to the chatbot and nothing is booked.
// Usage: node .claude/skills/client-health/client-health.mjs [--base <url>] [--only <text>] [--mobile] [--no-widgets] [--json <file>] (base: homepage of package.json; --only keeps the pages whose path holds the text, written without a leading slash under Git Bash; --mobile opens them at 390 x 844 instead of 1440 x 900); exit code 1 when a page or a widget fails.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const pkg = read('package.json');
const args = process.argv.slice(2);
const flag = name => args.includes(name);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);

const BASE = option('--base', pkg.homepage).replace(/\/$/, '');
const ONLY = option('--only', '');
const MOBILE = flag('--mobile');
const JSON_OUT = option('--json', '');
const viewport = MOBILE ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const origin = new URL(BASE).origin;

// Every page a visitor can open, in every language: the routes of config.appRoutes, the blog with each article, each project page, and a missing page for the 404
const langs = Object.keys(pkg.config.locales);
const articles = read('_data/articles.json').map(article => article.slug);
const projects = fs.readdirSync(path.join(ROOT, 'projects')).filter(file => file.endsWith('_en.html')).map(file => file.replace('_en.html', ''));
const pages = [];
for (const lang of langs) {
    for (const [name, route] of Object.entries(pkg.config.appRoutes)) {
        if (name !== 'error404') pages.push(route.replace('{lng}', lang));
    }
    for (const slug of articles) pages.push(`/${lang}/blog#${slug}`);
    for (const id of projects) pages.push(`/${lang}/${id}`);
}
pages.push('/client-health-missing-page');
const selected = pages.filter(page => page.includes(ONLY.replace(/^\/+/, '')));

const isOwn = url => url.startsWith(origin);
// A video the browser stops itself once it has its first frame, or a request cut short by the next page, is not a fault
const isDropped = request => /ERR_ABORTED|cancelled/i.test(request.failure()?.errorText ?? '');

// The LCP and the CLS of the page, gathered from its first paint
function watchVitals() {
    window.clientHealth = { lcp: 0, cls: 0, csp: [] };
    new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.clientHealth.lcp = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.clientHealth.cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
    document.addEventListener('securitypolicyviolation', event => window.clientHealth.csp.push(`${event.effectiveDirective} blocked ${event.blockedURI || 'inline'}`));
}

async function newPage(context) {
    const page = await context.newPage();
    await page.addInitScript(watchVitals);
    // The visit function, answered with no visit added
    await page.route('**/.netlify/functions/visit', route => route.fulfill({ json: { visits: 0 } }));
    return page;
}

async function checkPage(context, pagePath) {
    const page = await newPage(context);
    const result = { page: pagePath, status: null, csp: [], console: [], exceptions: [], own: [], thirdParty: [], analyticsBeforeConsent: [] };
    const missing = pagePath.startsWith('/client-health-missing');
    page.on('console', message => {
        // The 404 page logs its own 404 status, which is what it is for
        const ownStatus = missing && message.location().url === BASE + pagePath;
        if (message.type() === 'error' && !ownStatus && !/Content[- ]Security[- ]Policy/i.test(message.text())) result.console.push(message.text());
    });
    page.on('pageerror', error => result.exceptions.push(error.message));
    page.on('requestfailed', request => {
        if (!isDropped(request)) (isOwn(request.url()) ? result.own : result.thirdParty).push(`${request.failure()?.errorText} ${request.url()}`);
    });
    page.on('response', response => {
        const url = response.url();
        if (response.status() >= 400 && url !== `${BASE}${pagePath}`) (isOwn(url) ? result.own : result.thirdParty).push(`${response.status()} ${url}`);
    });
    page.on('request', request => {
        if (/googletagmanager\.com|google-analytics\.com/.test(request.url())) result.analyticsBeforeConsent.push(request.url());
    });
    try {
        const response = await page.goto(BASE + pagePath, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        result.status = response?.status() ?? null;
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
        const health = await page.evaluate(() => ({ ...window.clientHealth, ttfb: performance.getEntriesByType('navigation')[0]?.responseStart ?? 0 }));
        result.csp = health.csp;
        result.ttfb = Math.round(health.ttfb);
        result.lcp = Math.round(health.lcp);
        result.cls = Number(health.cls.toFixed(3));
    } catch (error) {
        result.exceptions.push(`navigation: ${error.message}`);
    }
    await page.close();
    const expected = missing ? 404 : 200;
    result.ok = result.status === expected && !result.csp.length && !result.console.length && !result.exceptions.length && !result.own.length && !result.analyticsBeforeConsent.length;
    return result;
}

// One check of a widget: its name, whether it loaded, and what was seen
async function widget(name, run) {
    try {
        return { name, ok: true, detail: await run() };
    } catch (error) {
        return { name, ok: false, detail: error.message.split('\n')[0] };
    }
}

async function checkWidgets(context) {
    const page = await newPage(context);
    await page.goto(`${BASE}/${langs[0]}`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    const checks = [];
    checks.push(await widget('Service worker', async () => {
        const scope = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope);
        if (!scope) throw new Error('not registered');
        return `registered, scope ${scope}`;
    }));
    checks.push(await widget('Poppins font', async () => {
        const loaded = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px Poppins'); });
        if (!loaded) throw new Error('not loaded, the fallback font shows');
        return 'loaded';
    }));
    checks.push(await widget('CV date (env?lang)', async () => {
        const answer = await page.evaluate(async lang => (await fetch(`/.netlify/functions/env?lang=${lang}`)).json(), langs[0]);
        if (!answer.date) throw new Error(`no date in the answer: ${JSON.stringify(answer).slice(0, 120)}`);
        return answer.date;
    }));
    // Scrolled into view, the contact form loads the Google API, Google Identity Services and reCAPTCHA, which draws its checkbox
    await page.locator('form[name="contactForm"]').scrollIntoViewIfNeeded();
    checks.push(await widget('Contact form (Google API, Identity Services, reCAPTCHA)', async () => {
        await page.waitForFunction(() => window.gapi && window.google?.accounts && window.grecaptcha, null, { timeout: 20_000 });
        await page.locator('#captcha-check iframe').first().waitFor({ timeout: 20_000 });
        return 'scripts loaded, captcha drawn';
    }));
    checks.push(await widget('Booking popup (Calendly)', async () => {
        await page.locator('#calendly-cta').click();
        await page.locator('iframe[src*="calendly.com"]').first().waitFor({ timeout: 20_000 });
        return 'popup opened, nothing booked';
    }));
    await page.keyboard.press('Escape');
    if (!MOBILE) {
        checks.push(await widget('Chatbot (Botpress)', async () => {
            const stub = page.locator('#bp-fab-stub');
            if (!(await stub.isVisible())) throw new Error('no visible chat bubble (#bp-fab-stub) on the page');
            // Clicked in the page: the booking popup just opened, or the consent banner left unanswered, can still cover the bubble
            await stub.evaluate(button => button.click());
            await page.waitForFunction(() => document.getElementById('fab-root')?.shadowRoot, null, { timeout: 30_000 });
            return 'loaded and opened, no message sent';
        }));
    }
    await page.close();
    return checks;
}

const browser = await chromium.launch();
// Each page opens as a first visit: no cache, no service worker from a previous page, no stored consent
const context = await browser.newContext({ viewport, serviceWorkers: 'allow', locale: 'en-US' });
const results = [];
const queue = [...selected];
await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) {
        const pagePath = queue.shift();
        const pageContext = await browser.newContext({ viewport, locale: 'en-US' });
        results.push(await checkPage(pageContext, pagePath));
        await pageContext.close();
    }
}));
results.sort((a, b) => selected.indexOf(a.page) - selected.indexOf(b.page));
const widgets = flag('--no-widgets') ? [] : await checkWidgets(context);
await browser.close();

const failed = results.filter(result => !result.ok);
console.log(`Client health of ${BASE} (${MOBILE ? 'phone 390px' : 'desktop 1440px'}), ${results.length} pages: ${results.length - failed.length} OK, ${failed.length} failing`);
for (const result of results) {
    console.log(`${result.ok ? 'OK  ' : 'FAIL'} ${result.status ?? '---'} ${result.page}  TTFB ${result.ttfb ?? '-'} ms · LCP ${result.lcp ?? '-'} ms · CLS ${result.cls ?? '-'}`);
    const lines = [...result.csp.map(line => `CSP: ${line}`), ...result.console.map(line => `console: ${line}`), ...result.exceptions.map(line => `exception: ${line}`), ...result.own.map(line => `site request: ${line}`), ...result.analyticsBeforeConsent.map(line => `analytics before consent: ${line}`), ...result.thirdParty.map(line => `third party (not counted): ${line}`)];
    for (const line of lines) console.log(`       ${line.slice(0, 220)}`);
}
for (const check of widgets) console.log(`${check.ok ? 'OK  ' : 'FAIL'} widget ${check.name}: ${check.detail}`);
if (JSON_OUT) fs.writeFileSync(path.resolve(ROOT, JSON_OUT), JSON.stringify({ base: BASE, mobile: MOBILE, results, widgets }, null, 2));
process.exit(failed.length || widgets.some(check => !check.ok) ? 1 : 0);
