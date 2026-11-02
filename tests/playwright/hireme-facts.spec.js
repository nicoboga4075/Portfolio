const { test, expect } = require('@playwright/test');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const hireme = require(path.join(root, '_data', 'hireme.json'));

// Renders the hire me include alone, the way Eleventy gives it its data
function render(lang) {
    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(root, '_includes')), { autoescape: true });
    return env.render('index-hireme.html', { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, hireme, profile: { openToWork: 2 }, linkedin: { messaging: 'https://www.linkedin.com/messaging' } });
}

test.describe('hire me facts', () => {
    for (const lang of ['en', 'fr']) {
        test(`shows the area, the availability and the driving licence, each behind its icon, on the ${lang} page`, () => {
            const facts = hireme[lang].facts.map(fact => `<span class="${fact.icon}" aria-hidden="true"></span> ${fact.text}`).join(' · ');
            expect(render(lang)).toContain(`<p>${facts}</p>`);
            expect(hireme[lang].facts.map(fact => fact.icon)).toEqual(['icon-map-marker', 'icon-clock-o', 'icon-car']);
        });

        test(`shows the roles sought behind a search icon, above the contact button, on the ${lang} page`, () => {
            const html = render(lang);
            const roles = `<p><span class="icon-search" aria-hidden="true"></span> ${hireme[lang].roles}</p>`;
            expect(html).toContain(roles);
            expect(html.indexOf(roles)).toBeLessThan(html.indexOf(hireme[lang].contactCta));
        });
    }
});
