// The health of every page, article and project page in every language: opened with the Content-Security-Policy of _headers that Netlify sends, it loads without a securitypolicyviolation, a console error or an uncaught exception.
const fs = require('node:fs');
const path = require('node:path');
const { test, expect, data, langs } = require('./site');
const { headersFor } = require('../../dev-watch');

const root = path.join(__dirname, '..', '..');
const routes = data('package.json').config.appRoutes;
const articles = data('_data/articles.json');
const projects = fs.readdirSync(path.join(root, 'projects')).filter(file => file.endsWith('_en.html')).map(file => file.replace('_en.html', ''));

// The built file of the 404 page, since the preview server has no Netlify 404 handling
const pages = [`${routes.error404}.html`];
for (const lang of langs) {
    for (const [name, route] of Object.entries(routes)) {
        if (name !== 'error404') pages.push(route.replace('{lng}', lang));
    }
    for (const { slug } of articles) pages.push(`/articles/${slug}_${lang}.html`, `/${lang}/blog#${slug}`);
    for (const id of projects) pages.push(`/${lang}/${id}`);
}

// A third-party host unreachable offline is not a fault of the site: its failed request, and the console line the browser writes for it, are left out
const isThirdParty = url => !url.startsWith('http://localhost');
// A video request the browser drops itself (Chromium net::ERR_ABORTED, WebKit "Load request cancelled") once it has the metadata or when the page goes away is not a fault of the site either
const isDroppedMedia = request => request.resourceType() === 'media' && /ERR_ABORTED|cancelled/i.test(request.failure()?.errorText ?? '');

for (const url of pages) {
    test(`${url} loads without a CSP violation, a console error or an exception`, async ({ page }) => {
        const pathname = url.split('#')[0];
        const policy = headersFor(pathname)['content-security-policy'];
        expect(policy, 'the /* rule of _headers sets a policy').toBeTruthy();
        const violations = [];
        const errors = [];
        page.on('console', message => {
            if (/Content[- ]Security[- ]Policy/i.test(message.text())) violations.push(message.text());
            else if (message.type() === 'error' && !isThirdParty(message.location().url || 'http://localhost')) errors.push(`console: ${message.text()}`);
        });
        page.on('pageerror', error => errors.push(`exception: ${error.message}`));
        page.on('requestfailed', request => {
            if (!isThirdParty(request.url()) && !isDroppedMedia(request)) errors.push(`request: ${request.url()} ${request.failure()?.errorText}`);
        });
        await page.addInitScript(() => {
            window.cspViolations = [];
            document.addEventListener('securitypolicyviolation', event => window.cspViolations.push(`${event.effectiveDirective} blocked ${event.blockedURI}`));
        });
        // The date of the last CV commit, which the env function reads from the GitHub API and serve-build.mjs doesn't serve: answered as the function does
        await page.route('**/.netlify/functions/env?lang=*', route => route.fulfill({ json: { date: '2026-01-01T00:00:00Z' } }));
        // Only the page itself gets the policy: its sub-requests are the ones the policy judges
        await page.route(request => new URL(request).pathname === pathname, async route => {
            if (route.request().resourceType() !== 'document') return route.fallback();
            const response = await route.fetch();
            await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': policy } });
        });
        // Not "load": an autoplay video (the presentation article) delays it until its first frame, which serve-build.mjs, without range requests, can keep WebKit waiting for
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        // The sub-requests the policy judges, then third-party hosts that may be unreachable offline: a bounded wait, whose timeout is fine
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        const inPage = await page.evaluate(() => window.cspViolations);
        expect([...inPage, ...violations], 'Content-Security-Policy violations').toEqual([]);
        expect(errors, 'console errors, exceptions and failed requests of the site').toEqual([]);
    });
}
