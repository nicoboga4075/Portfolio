// The three tabs of the skills carousel: each after its icon (tabIcons of skills.json), decorative and in the colour of its text, before its name and its question mark.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');
const { italicNames } = require('../../.eleventy');

const root = path.join(__dirname, '..', '..');
const skills = require(path.join(root, '_data', 'skills.json'));
const css = fs.readFileSync(path.join(root, 'css', 'app.css'), 'utf8');

// Renders the carousel partial with its includes, the way Eleventy gives it its data on the desktop build
function render(lang) {
    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(root, '_includes')), { autoescape: true });
    // The filter of .eleventy.js that puts the companies and schools in italics
    env.addFilter('italicNames', text => italicNames(text));
    return env.render('index-carousel.html', { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, viewport: 'desktop', skills }).replaceAll(/>\s+</g, '><');
}

test.describe('skills carousel tabs', () => {
    for (const lang of ['en', 'fr']) {
        test(`shows each tab after its icon on the ${lang} page`, () => {
            const html = render(lang);
            for (const [kind, name] of [['hard', 'Hard skills'], ['soft', 'Soft skills'], ['mad', 'Mad skills']]) {
                expect(html).toContain(`<span class="owl-menu" data-target="#${kind}-skills"><i class="${skills.tabIcons[kind]}" aria-hidden="true"></i>${name} &nbsp; <i class="icon-question-circle"`);
            }
        });
    }

    test('gives the icons of the tabs and of the filters the colour of their text', () => {
        const rule = css.match(/\.owl-menu > i:first-child,\s*#counter-section \.counter-filter i,\s*\.skill-filter i\s*\{([^}]*)\}/);
        expect(rule).not.toBeNull();
        expect(rule[1]).toMatch(/color:\s*inherit;/);
    });
});
