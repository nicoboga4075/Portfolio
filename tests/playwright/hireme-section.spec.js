const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'index-hireme.html'), 'utf8');
const hireme = require(path.join(root, '_data', 'hireme.json'));
const pkg = require(path.join(root, 'package.json'));

// Renders the include alone, the way Eleventy gives it its data
function render(openToWork, fileSlug = 'index') {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, {
        page: { fileSlug },
        siteLanguages: { default: 'en' },
        hireme,
        linkedin: { messaging: 'https://example.com/messaging' },
        profile: { openToWork }
    });
}

test.describe('hire me section', () => {
    test('package.json sets openToWork to a supported value', () => {
        expect([true, false, 'listening']).toContain(pkg.config.profile.openToWork);
    });

    test('listening shows the opportunities heading', () => {
        const html = render('listening');
        expect(html).toContain('id="hireme-section"');
        expect(html).toContain(hireme.en.heading.listening);
        expect(html).not.toContain(hireme.en.heading.active);
    });

    test('true shows the active search heading', () => {
        const html = render(true);
        expect(html).toContain('id="hireme-section"');
        expect(html).toContain(hireme.en.heading.active);
        expect(html).not.toContain(hireme.en.heading.listening);
    });

    test('false hides the whole section', () => {
        const html = render(false);
        expect(html).not.toContain('hireme-section');
        expect(html.trim()).toBe('');
    });

    test('the French page uses the French headings', () => {
        expect(render('listening', 'index_fr')).toContain(hireme.fr.heading.listening.replaceAll("'", '&#39;'));
        expect(render(true, 'index_fr')).toContain(hireme.fr.heading.active.replaceAll("'", '&#39;'));
    });
});
