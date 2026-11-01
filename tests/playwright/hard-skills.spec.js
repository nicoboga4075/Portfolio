const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'skills-hard.html'), 'utf8');

// Renders the hard skills include alone, the way Eleventy gives it its page
function render(lang) {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, { page: { fileSlug: `index_${lang}` } });
}

// Reads the image and the label of each skill of the carousel
function items(html) {
    return [...html.matchAll(/<img src="images\/([^"]+)\.png"[^>]*alt="([^"]*)"[^>]*><span>([^<]*)<\/span>/g)].map(match => ({ key: match[1], alt: match[2], label: match[3] }));
}

test.describe('hard skills carousel', () => {
    for (const lang of ['en', 'fr']) {
        test(`shows each tool with its image and the same label as alt text on the ${lang} page`, () => {
            const skills = items(render(lang));
            expect(skills.length).toBeGreaterThan(0);
            for (const skill of skills) {
                expect(skill.label).toBe(skill.alt);
                expect(fs.existsSync(path.join(root, 'images', `${skill.key}.png`))).toBe(true);
            }
        });
    }

    test('lists the added tools with their plain names in both languages', () => {
        for (const lang of ['en', 'fr']) {
            const labels = items(render(lang)).map(skill => skill.label);
            for (const name of ['.NET', 'TypeScript', 'Playwright', 'xUnit', 'Snyk', 'Agile', 'Netlify', 'JavaScript']) {
                expect(labels).toContain(name);
            }
            expect(labels).not.toContain('JS');
        }
    });

    test('spells the V model in the language of the page', () => {
        const label = lang => items(render(lang)).find(skill => skill.key === 'v-model').label;
        expect(label('en')).toBe('V model');
        expect(label('fr')).toBe('Cycle en V');
    });
});
