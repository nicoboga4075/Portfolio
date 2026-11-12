// The links the build reads from config of package.json (calendly, socials and the LinkedIn pages derived from them, analyticsId), checked in the preview build of every language.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const out = path.join(root, '.eleventy');
const { locales, calendly, socials } = require(path.join(root, 'package.json')).config;
const projects = require(path.join(root, '_data', 'projects.json'));

const read = file => fs.readFileSync(path.join(out, file), 'utf8');
const linkedin = socials.find(s => s.icon === 'linkedin').href;

test.describe('links read from config of package.json', () => {
    for (const lang of Object.keys(locales)) {
        test(`${lang}: the Calendly button opens the one address of config.calendly`, () => {
            expect(read(`index_${lang}.html`)).toContain(`data-calendly-url="${calendly}"`);
        });

        test(`${lang}: the Hire me button opens the message page of the LinkedIn profile`, () => {
            const messaging = new URL('/messaging/thread/new', linkedin).href;
            expect(read(`index_${lang}.html`)).toContain(`href="${messaging}"`);
        });

        test(`${lang}: the See more projects button opens the projects page of the LinkedIn profile`, () => {
            const html = read(`index_${lang}.html`);
            const button = html.match(/<a id="more-projects"[^>]*>.*?<\/a>/);
            expect(button).not.toBeNull();
            expect(button[0]).toContain(`href="${linkedin}/details/projects"`);
            expect(button[0]).toContain('target="_blank" rel="noopener"');
            expect(button[0]).toContain(projects[lang].moreProjects);
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
