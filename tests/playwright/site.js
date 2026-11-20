// The test of the *.browser.spec.js specs: the preview build served on a free port by serve-build.mjs, once per worker, as the baseURL of page.goto, with the site data the specs check the pages against.
const base = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { startServeBuild } = require('../serve-build-start.cjs');

const root = path.join(__dirname, '..', '..');
const data = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

exports.test = base.test.extend({
    // Playwright reads the fixtures a fixture needs from its first parameter, which must be a destructuring pattern even when it needs none
    // eslint-disable-next-line no-empty-pattern
    siteUrl: [async ({}, use) => {
        const { url, child } = await startServeBuild();
        await use(url);
        child.removeAllListeners('exit');
        child.kill();
    }, { scope: 'worker' }],
    baseURL: async ({ siteUrl }, use) => {
        await use(siteUrl);
    },
    // The choices of the consent banner (js/consent.js) stored before every page loads, so the banner stays out of the way and the third-party services load as they would for a visitor who allowed them; null for a first visit, the banner shown (test.use({ storedConsent: null }))
    storedConsent: [{ services: true }, { option: true }],
    // The blog page loads its article from the article function, which serve-build.mjs doesn't serve: answer it with the built article, as the function does
    page: async ({ page, storedConsent }, use) => {
        if (storedConsent) {
            await page.addInitScript(choices => localStorage.setItem('consent', JSON.stringify({ ...choices, date: Date.now() })), storedConsent);
        }
        await page.route('**/.netlify/functions/article?*', route => {
            // Only a file of the built articles, never a path out of that folder
            const articles = path.join(root, '.eleventy', 'articles');
            const file = path.resolve(articles, new URL(route.request().url()).searchParams.get('filename') ?? '');
            if (!file.startsWith(articles + path.sep)) {
                return route.fulfill({ status: 404 });
            }
            return route.fulfill({ contentType: 'text/html', body: fs.readFileSync(file, 'utf8') });
        });
        await use(page);
    }
});
exports.expect = base.expect;
exports.data = data;
exports.langs = Object.keys(data('package.json').config.locales);
