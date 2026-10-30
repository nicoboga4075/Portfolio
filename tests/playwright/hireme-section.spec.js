const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'index-hireme.html'), 'utf8');
const hireme = require(path.join(root, '_data', 'hireme.json'));
const pkg = require(path.join(root, 'package.json'));

// Renders the include alone, the way Eleventy gives it its data
function render(openToWork, fileSlug = 'index', texts = hireme) {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, {
        page: { fileSlug },
        siteLanguages: { default: 'en' },
        hireme: texts,
        linkedin: { messaging: 'https://example.com/messaging' },
        profile: { openToWork }
    });
}

test.describe('hire me section', () => {
    test('package.json sets openToWork to a supported value', () => {
        expect([0, 1, 2]).toContain(pkg.config.profile.openToWork);
    });

    test('1 (listening) shows the opportunities heading', () => {
        const html = render(1);
        expect(html).toContain('id="hireme-section"');
        expect(html).toContain(hireme.en.heading.listening);
        expect(html).not.toContain(hireme.en.heading.active);
    });

    test('2 (active) shows the active search heading', () => {
        const html = render(2);
        expect(html).toContain('id="hireme-section"');
        expect(html).toContain(hireme.en.heading.active);
        expect(html).not.toContain(hireme.en.heading.listening);
    });

    test('0 hides the whole section', () => {
        const html = render(0);
        expect(html).not.toContain('hireme-section');
        expect(html.trim()).toBe('');
    });

    test('the French page uses the French headings', () => {
        expect(render(1, 'index_fr')).toContain(hireme.fr.heading.listening.replaceAll("'", '&#39;'));
        expect(render(2, 'index_fr')).toContain(hireme.fr.heading.active.replaceAll("'", '&#39;'));
    });

    test('shows the contact button with its text, none when the text is missing or empty', () => {
        expect(render(2)).toContain(`class="btn btn-primary py-3 px-5">${hireme.en.contactCta}</a>`);
        for (const contactCta of [undefined, '']) {
            const html = render(2, 'index', { ...hireme, en: { ...hireme.en, contactCta } });
            expect(html).toContain('id="hireme-section"');
            expect(html).not.toContain('https://example.com/messaging');
        }
    });
});
