const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'skills-mad.html'), 'utf8');
const skills = require(path.join(root, '_data', 'skills.json'));

// Renders the mad skills include alone, the way Eleventy gives it its data
function render(lang) {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, { page: { fileSlug: `index_${lang}` }, skills });
}

// Reads the image, the alt text and the label of each passion of the carousel
function items(html) {
    return [...html.matchAll(/<img src="images\/([^"]+)\.png"[^>]*alt="([^"]*)"[^>]*><span>([^<]*)<\/span>/g)].map(match => ({ key: match[1], alt: match[2], label: match[3] }));
}

test.describe('mad skills carousel', () => {
    for (const lang of ['en', 'fr']) {
        test(`shows each passion of the data with its image and its name as alt text on the ${lang} page`, () => {
            const shown = items(render(lang));
            expect(shown.map(skill => skill.key)).toEqual(skills.mad.map(skill => skill.key));
            for (const [index, skill] of shown.entries()) {
                expect(skill.label).toBe(skills.mad[index][lang]);
                expect(skill.alt).toBe(skill.label);
                expect(fs.existsSync(path.join(root, 'images', `${skill.key}.png`))).toBe(true);
            }
        });
    }
});
