const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { renderInclude } = require('./render');
const { italicNames } = require('../../.eleventy');

const root = path.join(__dirname, '..', '..');
const skills = require(path.join(root, '_data', 'skills.json'));

// Renders the soft skills include alone, the way Eleventy gives it its data
function render(lang) {
    return renderInclude('skills-soft.html', { page: { fileSlug: `index_${lang}` }, skills }).replaceAll(/>\s+</g, '><');
}

const escapeHtml = text => text.replaceAll('&', '&amp;').replaceAll("'", '&#39;').replaceAll('"', '&quot;');

test.describe('soft skills cards', () => {
    for (const lang of ['en', 'fr']) {
        test(`shows each skill on its front, its experiences one per line on its back, and a padlock that unlocks it on the ${lang} page`, () => {
            const html = render(lang);
            expect(html.match(/<div class="soft-card" data-filter="[^"]+">/g)).toHaveLength(skills.soft.length);
            for (const skill of skills.soft) {
                expect(skill.proof[lang].length).toBeGreaterThan(1);
                expect(html).toContain(`<button type="button" class="soft-card-toggle" aria-expanded="false" aria-label="${escapeHtml(`${skills.carousel[lang].softUnlock} ${skill[lang]}`)}"><i class="icon-lock" aria-hidden="true"></i></button>`);
                expect(html).toContain(`<div class="soft-card-face soft-card-front"><img src="images/${skill.key}.png" class="img-fluid" alt="" loading="lazy" height="75" width="75"><span class="soft-card-label">${skill[lang]}</span></div>`);
                expect(html).toContain(`<div class="soft-card-face soft-card-back" aria-hidden="true" inert><ul class="soft-card-proofs">${skill.proof[lang].map(proof => `<li class="soft-card-proof">${italicNames(proof)}</li>`).join('')}</ul></div>`);
            }
        });

        test(`filters the cards by family above the carousel, each button with its number of cards, on the ${lang} page`, () => {
            const html = render(lang);
            const carousel = skills.carousel[lang];
            const icon = key => `<i class="${skills.softFilterIcons[key]}" aria-hidden="true"></i>`;
            // From the most cards to the fewest, a tie in the order of softCategories (a stable sort)
            const buttons = Object.entries(carousel.softCategories).map(([key, name]) => [key, name, skills.soft.filter(skill => skill.categories.includes(key)).length]).toSorted((a, b) => b[2] - a[2]).map(([key, name, number]) => `<button type="button" data-filter="${key}" aria-pressed="false">${icon(key)}${escapeHtml(name)} (${number})</button>`).join('');
            expect(html).toContain(`<fieldset class="skill-filter d-none" data-target="#soft-skills"><legend class="sr-only">${carousel.softFilterLabel}</legend><button type="button" data-filter="" aria-pressed="true">${icon('all')}${carousel.hardFilterAll} (${skills.soft.length})</button>${buttons}</fieldset><div id="soft-skills"`);
            for (const skill of skills.soft) {
                expect(skill.categories.length).toBeGreaterThan(0);
                for (const key of skill.categories) expect(carousel.softCategories[key]).toBeTruthy();
                expect(html).toContain(`<div class="soft-card" data-filter="${skill.categories.join(' ')}">`);
            }
        });
    }
});
