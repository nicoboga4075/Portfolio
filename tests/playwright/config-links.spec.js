// The links the build reads from config of package.json (calendly, socials, analyticsId), checked in the preview build of every language.
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const out = path.join(root, '.eleventy');
const { locales, calendly, socials } = require(path.join(root, 'package.json')).config;

const read = file => fs.readFileSync(path.join(out, file), 'utf8');
const linkedin = socials.find(s => s.icon === 'linkedin').href;

// No browser here: run in one project only, so the three projects do not build into .eleventy/ at the same time
test.skip(({ browserName }) => browserName !== 'chromium', 'no browser needed');

test.beforeAll(() => {
    // The preview build writes to .eleventy/ and leaves the page sources alone
    execFileSync(process.execPath, [path.join(root, 'node_modules', '@11ty', 'eleventy', 'cmd.cjs')], { cwd: root, env: { ...process.env, ELEVENTY_PREVIEW: '1' }, stdio: 'pipe' });
});

test.describe('links read from config of package.json', () => {
    for (const lang of Object.keys(locales)) {
        test(`${lang}: the Calendly button opens the one address of config.calendly`, () => {
            expect(read(`index_${lang}.html`)).toContain(`data-calendly-url="${calendly}"`);
        });

        test(`${lang}: the Hire me button opens the message page of the LinkedIn profile`, () => {
            const messaging = new URL('/messaging/thread/new', linkedin).href;
            expect(read(`index_${lang}.html`)).toContain(`href="${messaging}"`);
        });

        test(`${lang}: every social link of config.socials is on the page`, () => {
            const html = read(`index_${lang}.html`);
            for (const s of socials) expect(html).toContain(`href="${s.href}"`);
        });
    }

    test('the preview build does not load Google Analytics', () => {
        expect(read('index_en.html')).not.toContain('js/analytics.js');
    });
});
