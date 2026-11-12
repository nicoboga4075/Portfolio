// The Chess.com pawn of config.socials is drawn by .icon-chess of css/app.css from images/logo-chesscom.png (Logo.dev) served by the site, as a mask painted in the text colour (white in the footer, dark in the contact window), never hot-linked from a third party that can rate-limit it (svgrepo answered 429); the vendored icomoon.css keeps no image icon.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test.describe('Chess.com icon of the socials', () => {
    test('is a mask of the local Logo.dev pawn painted in the text colour', () => {
        const rule = read('css/app.css').match(/\.icon-chess\s*\{([^}]*)\}/);
        expect(rule).not.toBeNull();
        expect(rule[1]).toContain('background-color: currentcolor;');
        expect(rule[1]).toContain('mask-image: url("/images/logo-chesscom.png");');
        expect(fs.existsSync(path.join(root, 'images', 'logo-chesscom.png'))).toBe(true);
    });

    test('is the footer and contact window icon of the Chess.com link', () => {
        const { socials } = JSON.parse(read('package.json')).config;
        const chess = socials.find(s => new URL(s.href).hostname === 'www.chess.com');
        expect(chess.icon).toBe('chess');
        expect(chess.modalIcon).toBeUndefined();
    });

    test('leaves the vendored icomoon.css without image icons', () => {
        expect(read('css/icomoon.css')).not.toMatch(/background-image|chess/);
    });

    test('no longer allows svgrepo in the CSP', () => {
        expect(read('_headers')).not.toContain('svgrepo');
    });
});
