const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');
const { italicNames } = require('../../.eleventy');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'skills-mad.html'), 'utf8');
const skills = require(path.join(root, '_data', 'skills.json'));

// Renders the mad skills include alone, the way Eleventy gives it its data
function render(lang, data = skills) {
    const env = new nunjucks.Environment(null, { autoescape: true });
    // The filter of .eleventy.js that puts the companies and schools in italics
    env.addFilter('italicNames', text => italicNames(text));
    return env.renderString(template, { page: { fileSlug: `index_${lang}` }, skills: data });
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
                // Escaped, no longer rendered as HTML (IT & Applied Sciences)
                expect(skill.label).toBe(skills.mad[index][lang].replaceAll('&', '&amp;'));
                expect(skill.alt).toBe(skill.label);
                expect(fs.existsSync(path.join(root, 'images', `${skill.key}.png`))).toBe(true);
            }
        });

        test(`shows the question mark of a passion with a tip, its tooltip, and none for the others, on the ${lang} page`, () => {
            // No passion of the site has a tip today: one given to the first passion, the others without
            const data = { ...skills, mad: skills.mad.map((skill, index) => (index ? skill : { ...skill, tip: { en: 'A tip & more', fr: 'Une astuce & plus' } })) };
            const html = render(lang, data).replaceAll(/>\s+</g, '><');
            const colon = lang === 'fr' ? ' :' : ':';
            const withTip = data.mad.filter(skill => skill.tip);
            for (const skill of withTip) {
                const name = skill[lang].replaceAll('&', '&amp;');
                const tip = skill.tip[lang].replaceAll('&', '&amp;');
                // The tooltip renders its HTML (escaped twice in the title), the name read by screen readers stays plain text
                const title = italicNames(skill.tip[lang]).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
                expect(html).toContain(`<span>${name}</span><button type="button" class="hard-skill-tip" data-bs-toggle="tooltip" data-container="body" data-html="true" title="${title}" aria-label="${name}${colon} ${tip}"><i class="icon-question-circle" aria-hidden="true"></i></button>`);
            }
            expect(html.match(/class="hard-skill-tip"/g)).toHaveLength(withTip.length);
        });
    }
});
