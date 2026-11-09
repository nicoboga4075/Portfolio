const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'index-counter.html'), 'utf8');
const counter = require(path.join(root, '_data', 'counter.json'));
const resume = require(path.join(root, '_data', 'resume.json'));
const { profile } = require(path.join(root, 'package.json')).config;
const css = fs.readFileSync(path.join(root, 'css', 'app.css'), 'utf8');

function render(lang) {
    const env = new nunjucks.Environment(null, { autoescape: true });
    // The filter .eleventy.js gives the counter partial for the years of the work experiences
    env.addFilter('workYears', require('../../work-years'));
    return env.renderString(template, { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, viewport: 'desktop', counter, resume, profile }).replaceAll(/>\s+</g, '><');
}

test.describe('delivered projects counter shown as a floor', () => {
    for (const lang of ['en', 'fr']) {
        test(`keeps the plain number in the animated element on the ${lang} page`, () => {
            expect(render(lang)).toContain(`<strong id="projects-count" class="number" data-number="${profile.projectsCount}">0</strong>`);
        });
    }

    test('puts the plus sign in a pseudo-element, out of the text the count animates', () => {
        const rule = css.match(/#counter-section #projects-count::before\s*\{([^}]*)\}/);
        expect(rule).not.toBeNull();
        expect(rule[1]).toMatch(/content:\s*"\+ ";/);
    });
});
