const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'index-about.html'), 'utf8');
const about = require(path.join(root, '_data', 'about.json'));

// Renders the about include alone, the way Eleventy gives it its data
function render(lang) {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, about, author: 'Author', profile: { age: 28, xp: 5 } });
}

const escapeHtml = text => text.replaceAll("'", '&#39;');

test.describe('about interests', () => {
    for (const lang of ['en', 'fr']) {
        test(`shows each interest as its emoji alone, its word read by screen readers and shown on hover, on the ${lang} page`, () => {
            const html = render(lang);
            const interests = about[lang].interestList;
            expect(interests.length).toBeGreaterThan(1);
            expect(html).toContain(`<span>${escapeHtml(about[lang].interests)}</span> <span class="about-interests">`);
            const emojis = [...html.matchAll(/<span class="about-interest" role="img" aria-label="([^"]*)" title="([^"]*)">([^<]*)<\/span>/g)].map(match => [match[1], match[2], match[3]]);
            expect(emojis).toEqual(interests.map(interest => [escapeHtml(interest.label), escapeHtml(interest.label), interest.emoji]));
        });
    }
});
