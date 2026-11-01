const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const includes = path.join(root, '_includes');
const nav = require(path.join(root, '_data', 'nav.json'));
const about = require(path.join(root, '_data', 'about.json'));
const languages = require(path.join(root, '_data', 'languages.json'));

// Renders the navbar include alone, its own includes read from _includes, the way Eleventy gives it its data
function render(fileSlug) {
    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(includes), { autoescape: true });
    return env.render('nav.html', { page: { fileSlug, url: '/' }, nav, about, languages, version: '0.0.0', siteLanguages: { default: 'en', list: ['en', 'fr'] }, routes: {} });
}

test.describe('navbar CV button', () => {
    for (const lang of ['en', 'fr']) {
        test(`links the ${lang} CV from the root, so it works from the home and the blog alike`, () => {
            const html = render(`index_${lang}`);
            const label = nav[lang].downloadCv.replaceAll("'", '&#39;');
            expect(html).toContain(`<a id="nav-cv" class="btn btn-primary" href="/${about[lang].cvHref}" target="_blank" rel="noopener" aria-label="${label}"><span class="icon-download" aria-hidden="true"></span>${nav[lang].cv}</a>`);
            expect(fs.existsSync(path.join(root, about[lang].cvHref))).toBe(true);
        });
    }
});
