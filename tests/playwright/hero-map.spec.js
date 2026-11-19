// The dotted world map and heart above the hero name (_includes/hero-map.html), rendered alone and inside the hero.
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { renderInclude } = require('./render');

const root = path.join(__dirname, '..', '..');
const hero = require(path.join(root, '_data', 'hero.json'));
const hireme = require(path.join(root, '_data', 'hireme.json'));

const map = renderInclude('hero-map.html', {});

// Renders the hero include, the way Eleventy gives it its data
function renderHero(fileSlug) {
    return renderInclude('index-home.html', {
        page: { fileSlug },
        siteLanguages: { default: 'en' },
        author: 'Nicolas BOGALHEIRO',
        hero,
        hireme,
        linkedin: { url: 'https://example.com/profile' },
        profile: { openToWork: 0 }
    });
}

test.describe('hero map', () => {
    test('is a decorative svg hidden from screen readers', () => {
        expect(map).toContain('<svg class="hero-map"');
        expect(map).toContain('aria-hidden="true"');
        expect(map).toContain('focusable="false"');
    });

    test('draws the land as dots and the heart as a robot half and a human half', () => {
        expect(map).toContain('class="hero-map-land"');
        expect((map.match(/h0/g) || []).length).toBeGreaterThan(100);
        for (const part of ['hero-map-heart', 'hero-map-robot', 'hero-map-circuit', 'hero-map-human']) {
            expect(map).toContain(`class="${part}"`);
        }
    });

    test('keeps its comments out of the rendered html', () => {
        expect(map).not.toContain('{#');
        expect(map).not.toContain('equirectangular');
    });

    for (const lang of ['en', 'fr']) {
        test(`sits above the subheading of the ${lang} hero`, () => {
            const html = renderHero(`index_${lang}`);
            const at = html.indexOf('class="hero-map"');
            expect(at).toBeGreaterThan(-1);
            expect(at).toBeLessThan(html.indexOf('class="subheading'));
            expect(html.match(/class="hero-map"/g)).toHaveLength(1);
        });
    }
});
