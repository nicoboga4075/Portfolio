const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { renderInclude } = require('./render');

const root = path.join(__dirname, '..', '..');
const hireme = require(path.join(root, '_data', 'hireme.json'));

// A text as Nunjucks writes it with its autoescape: the apostrophe of "driver's" becomes &#39;
const escaped = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

// Renders the hire me include alone, the way Eleventy gives it its data
function render(lang) {
    return renderInclude('index-hireme.html', { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, hireme, profile: { openToWork: 2 } });
}

test.describe('hire me facts', () => {
    for (const lang of ['en', 'fr']) {
        test(`shows the area, the availability and the driving licence, each behind its icon, on the ${lang} page`, () => {
            const facts = hireme[lang].facts.map(fact => `<span class="${fact.icon}" aria-hidden="true"></span> ${escaped(fact.text)}`).join(' · ');
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
