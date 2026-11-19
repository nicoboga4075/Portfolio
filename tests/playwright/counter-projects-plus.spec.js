const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { renderCounter } = require('./render');

const root = path.join(__dirname, '..', '..');
const { profile } = require(path.join(root, 'package.json')).config;
const css = fs.readFileSync(path.join(root, 'css', 'app.css'), 'utf8');

const render = renderCounter;

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
