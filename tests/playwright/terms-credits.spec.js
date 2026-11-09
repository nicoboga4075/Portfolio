// The terms pages credit the TEEXMA logo (Wikimedia Commons, CC BY-SA 4.0) and the Tux logo of Linux (Larry Ewing and The GIMP) of the skills in English and French, with safe external links.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');

test.describe('terms pages credits', () => {
    for (const lang of ['en', 'fr']) {
        test(`credits the TEEXMA logo on the ${lang} terms page`, () => {
            const html = fs.readFileSync(path.join(root, `terms_${lang}.html`), 'utf8');
            expect(html).toContain('TEEXMA');
            expect(html).toContain('Bassetti38');
            expect(html).toContain('https://commons.wikimedia.org/wiki/File:TEEXMA.png');
            expect(html).toContain('https://creativecommons.org/licenses/by-sa/4.0/');
            expect(html).toContain('Larry Ewing');
            expect(html).toContain('https://commons.wikimedia.org/wiki/File:Tux.svg');
            const links = html.match(/<a href="https:\/\/(?:commons\.wikimedia\.org|creativecommons\.org)[^>]*>/g) || [];
            expect(links).toHaveLength(3);
            for (const link of links) {
                expect(link).toContain('target="_blank"');
                expect(link).toContain('rel="noopener"');
            }
        });
    }

    test('ships the TEEXMA and Tux images the credits speak about', () => {
        expect(fs.existsSync(path.join(root, 'images', 'teexma.png'))).toBe(true);
        expect(fs.existsSync(path.join(root, 'images', 'linux.png'))).toBe(true);
    });
});
