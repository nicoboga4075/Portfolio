// The Content-Security-Policy of _headers: every page, article and project page in every language, opened with the policy Netlify sends, loads without a securitypolicyviolation.
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

for (const url of pages) {
    test(`${url} loads without a Content-Security-Policy violation`, async ({ page }) => {
        const pathname = url.split('#')[0];
        const policy = headersFor(pathname)['content-security-policy'];
        expect(policy, 'the /* rule of _headers sets a policy').toBeTruthy();
        const violations = [];
        page.on('console', message => {
            if (/Content[- ]Security[- ]Policy/i.test(message.text())) violations.push(message.text());
        });
        await page.addInitScript(() => {
            window.cspViolations = [];
            document.addEventListener('securitypolicyviolation', event => window.cspViolations.push(`${event.effectiveDirective} blocked ${event.blockedURI}`));
        });
        // Only the page itself gets the policy: its sub-requests are the ones the policy judges
        await page.route(request => new URL(request).pathname === pathname, async route => {
            if (route.request().resourceType() !== 'document') return route.fallback();
            const response = await route.fetch();
            await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': policy } });
        });
        await page.goto(url, { waitUntil: 'load' });
        // Third-party hosts may be unreachable offline: a bounded wait, whose timeout is fine
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        const inPage = await page.evaluate(() => window.cspViolations);
        expect([...inPage, ...violations]).toEqual([]);
    });
}
