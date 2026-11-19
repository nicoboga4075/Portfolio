const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { renderInclude } = require('./render');

const root = path.join(__dirname, '..', '..');
const about = require(path.join(root, '_data', 'about.json'));

// Renders the about include alone, the way Eleventy gives it its data
function render(lang) {
    return renderInclude('index-about.html', { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, about, author: 'Author', profile: { age: 28, xp: 5 } });
}

const escapeHtml = text => text.replaceAll("'", '&#39;');

test.describe('about interests', () => {
    for (const lang of ['en', 'fr']) {
        test(`shows each interest as its emoji alone, its word hidden for screen readers and shown on hover, on the ${lang} page`, () => {
            const html = render(lang);
            const interests = about[lang].interestList;
            expect(interests.length).toBeGreaterThan(1);
            expect(html).toContain(`<span>${escapeHtml(about[lang].interests)}</span> <span class="about-interests">`);
            const emojis = [...html.matchAll(/<span class="about-interest" data-bs-toggle="tooltip" data-container="body" title="([^"]*)"><span aria-hidden="true">([^<]*)<\/span><span class="sr-only">([^<]*)<\/span><\/span>/g)].map(match => [match[1], match[3], match[2]]);
            expect(emojis).toEqual(interests.map(interest => [escapeHtml(interest.label), escapeHtml(interest.label), interest.emoji]));
        });
    }
});
