// The scroll-down arrow of the hero (_includes/index-home.html), rendered alone: its target and its label in each language.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'index-home.html'), 'utf8');
const hero = require(path.join(root, '_data', 'hero.json'));
const hireme = require(path.join(root, '_data', 'hireme.json'));

// Renders the hero include alone, the way Eleventy gives it its data
function render(fileSlug) {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, {
        page: { fileSlug },
        siteLanguages: { default: 'en' },
        author: 'Nicolas BOGALHEIRO',
        hero,
        hireme,
        linkedin: { url: 'https://example.com/profile' },
        profile: { openToWork: 0 }
    });
}

test.describe('hero scroll-down arrow', () => {
    test('points at the projects section with its English label', () => {
        const html = render('index_en');
        expect(html).toContain(`href="#projects-section" aria-label="${hero.en.projectsAria}"`);
        expect(html).not.toContain('#resume-section');
    });

    test('points at the projects section with its French label', () => {
        const html = render('index_fr');
        expect(html).toContain('href="#projects-section"');
        expect(html).toContain(`aria-label="${hero.fr.projectsAria}"`);
    });
});
