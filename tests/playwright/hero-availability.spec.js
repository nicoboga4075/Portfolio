const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'index-home.html'), 'utf8');
const hero = require(path.join(root, '_data', 'hero.json'));
const hireme = require(path.join(root, '_data', 'hireme.json'));

// Renders the hero include alone, the way Eleventy gives it its data
function render(openToWork, fileSlug = 'index_en') {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, {
        page: { fileSlug },
        siteLanguages: { default: 'en' },
        author: 'Nicolas BOGALHEIRO',
        hero,
        hireme,
        linkedin: { url: 'https://example.com/profile' },
        profile: { openToWork }
    });
}

test.describe('hero availability badge', () => {
    test('1 (listening) shows the opportunities status with a slow dot', () => {
        const html = render(1);
        expect(html).toContain('class="hero-availability" href="https://example.com/profile" target="_blank" rel="noopener"');
        expect(html).toContain(hireme.en.heading.listening);
        expect(html).not.toContain('is-active');
    });

    test('2 (active) shows the active search status with a fast dot', () => {
        const html = render(2);
        expect(html).toContain('class="hero-availability is-active"');
        expect(html).toContain(hireme.en.heading.active);
    });

    test('0 shows no badge', () => {
        expect(render(0)).not.toContain('availability-dot');
    });

    test('lists the trainings in progress in a badge, the name a link only when the course has a certificate, the icon outside it', () => {
        const html = render(2);
        expect(html).toContain('<p class="hero-availability hero-training">');
        expect(html).toContain(hero.en.trainingLabel);
        for (const training of hero.training) {
            const name = training.href ? `<a href="${training.href}" target="_blank" rel="noopener">${training.label}</a>` : training.label;
            expect(html).toContain(`<span class="training-item">${name} <i class="${training.icon}" aria-hidden="true"></i></span>`);
        }
    });

    test('the French page uses the French status', () => {
        expect(render(1, 'index_fr')).toContain(hireme.fr.heading.listening.replaceAll("'", '&#39;'));
    });
});
