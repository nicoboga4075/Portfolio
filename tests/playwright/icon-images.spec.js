// The image icons of css/icomoon.css (the Chess.com logo of the socials) are served by the site itself, never hot-linked from a third party that can rate-limit them (svgrepo answered 429), and each file exists.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const css = fs.readFileSync(path.join(root, 'css', 'icomoon.css'), 'utf8');
const images = [...css.matchAll(/background-image:url\('([^']+)'\)/g)].map(m => m[1]);

test.describe('icon images of icomoon.css', () => {
    test('has the Chess.com icons of the socials', () => {
        for (const icon of ['king-outlined', 'chessboard']) expect(css, icon).toContain(`.icon-${icon}{background-image:url('/images/logo-chesscom.png')`);
    });

    test('serves every icon image from the site', () => {
        expect(images.length).toBeGreaterThan(0);
        for (const url of images) {
            expect(url, url).toMatch(/^\/images\//);
            expect(fs.existsSync(path.join(root, url)), url).toBe(true);
        }
    });

    test('no longer allows svgrepo in the CSP', () => {
        expect(fs.readFileSync(path.join(root, '_headers'), 'utf8')).not.toContain('svgrepo');
    });
});
