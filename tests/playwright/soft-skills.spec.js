const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'skills-soft.html'), 'utf8');
const skills = require(path.join(root, '_data', 'skills.json'));

// Renders the soft skills include alone, the way Eleventy gives it its data
function render(lang) {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, { page: { fileSlug: `index_${lang}` }, skills }).replaceAll(/>\s+</g, '><');
}

const escapeHtml = text => text.replaceAll('&', '&amp;').replaceAll("'", '&#39;').replaceAll('"', '&quot;');

test.describe('soft skills cards', () => {
    for (const lang of ['en', 'fr']) {
        test(`shows each skill on its front, its experiences one per line on its back, and a padlock that unlocks it on the ${lang} page`, () => {
            const html = render(lang);
            expect(html.match(/<div class="soft-card">/g)).toHaveLength(skills.soft.length);
            for (const skill of skills.soft) {
                expect(skill.proof[lang].length).toBeGreaterThan(1);
                expect(html).toContain(`<button type="button" class="soft-card-toggle" aria-expanded="false" aria-label="${escapeHtml(`${skills.carousel[lang].softUnlock} ${skill[lang]}`)}"><i class="icon-lock" aria-hidden="true"></i></button>`);
                expect(html).toContain(`<div class="soft-card-face soft-card-front"><img src="images/${skill.key}.png" class="img-fluid" alt="" loading="lazy" height="75" width="75"><span class="soft-card-label">${skill[lang]}</span></div>`);
                expect(html).toContain(`<div class="soft-card-face soft-card-back" aria-hidden="true"><ul class="soft-card-proofs">${skill.proof[lang].map(proof => `<li class="soft-card-proof">${escapeHtml(proof)}</li>`).join('')}</ul></div>`);
            }
        });
    }
});
