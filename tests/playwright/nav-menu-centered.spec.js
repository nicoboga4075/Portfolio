const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { renderInclude } = require('./render');

const root = path.join(__dirname, '..', '..');
const nav = require(path.join(root, '_data', 'nav.json'));
const about = require(path.join(root, '_data', 'about.json'));
const languages = require(path.join(root, '_data', 'languages.json'));

// Renders the navbar include alone, the way Eleventy gives it its data
function render(fileSlug) {
    return renderInclude('nav.html', { page: { fileSlug, url: '/' }, nav, about, languages, version: '0.0.0', siteLanguages: { default: 'en', list: ['en', 'fr'] }, routes: {} });
}

test.describe('navbar menu position', () => {
    for (const lang of ['en', 'fr']) {
        test(`centers the ${lang} menu between the logo and the CV button with auto margins on both sides`, () => {
            const html = render(`index_${lang}`);
            const list = html.match(/<ul class="([^"]*navbar-nav[^"]*)"/);
            expect(list).not.toBeNull();
            const classes = list[1].split(/\s+/);
            expect(classes).toContain('mx-auto');
            expect(classes).not.toContain('ml-auto');
        });
    }
});
