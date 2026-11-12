// The terms pages credit the TEEXMA logo (Wikimedia Commons, CC BY-SA 4.0) and the Tux logo of Linux (Larry Ewing and The GIMP) of the skills, the PostgreSQL, Elasticsearch, PowerPoint, Excel and Word logos of the project cards, and the Chess.com logo of the socials from Logo.dev, in English and French, with safe external links.
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
            // The logos of the stack of the project cards, with their licence and their trademark owners
            expect(html).toContain('https://commons.wikimedia.org/wiki/File:Postgresql_elephant.svg');
            expect(html).toContain('https://commons.wikimedia.org/wiki/File:Elasticsearch_logo.svg');
            expect(html).toContain('Apache 2.0');
            expect(html).toContain('Microsoft');
            // The logos fetched from Logo.dev, credited with a safe link to it
            expect(html).toContain(`<a href="https://logo.dev" target="_blank" rel="noopener">Logo.dev</a>`);
            expect(html).toContain('Chess.com');
            const links = html.match(/<a href="https:\/\/(?:commons\.wikimedia\.org|creativecommons\.org)[^>]*>/g) || [];
            expect(links).toHaveLength(5);
            for (const link of links) {
                expect(link).toContain('target="_blank"');
                expect(link).toContain('rel="noopener"');
            }
        });
    }

    test('ships the TEEXMA and Tux images the credits speak about', () => {
        expect(fs.existsSync(path.join(root, 'images', 'teexma.png'))).toBe(true);
        expect(fs.existsSync(path.join(root, 'images', 'linux.png'))).toBe(true);
        for (const logo of ['postgresql', 'elasticsearch', 'powerpoint', 'excel', 'word']) expect(fs.existsSync(path.join(root, 'images', `${logo}.png`)), logo).toBe(true);
    });
});
