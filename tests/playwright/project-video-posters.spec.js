// The video of each project page and of the Bien / Pas Bien article: shown first as its poster, a light image of its first frame, and loaded only when played, so the page no longer fetches the MP4 for its first frame (its LCP).
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const pages = fs.readdirSync(path.join(root, 'projects')).filter(file => /_[a-z]{2}\.html$/.test(file));

test.describe('project video posters', () => {
    test('the Bien / Pas Bien article shows its poster too, and loads its video only on play', () => {
        const tag = fs.readFileSync(path.join(root, 'articles', 'bien-pasbien_fr.html'), 'utf8').match(/<video[^>]*>/)[0];
        expect(tag).toBe('<video controls preload="none" poster="images/posters/bien-pasbien.webp">');
        const bytes = fs.readFileSync(path.join(root, 'images', 'posters', 'bien-pasbien.webp'));
        expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
        expect(bytes.length).toBeLessThan(150 * 1024);
    });

    test('every video of a project page has its poster, the image of its page, and loads nothing before play', () => {
        const videos = pages.flatMap(file => [...fs.readFileSync(path.join(root, 'projects', file), 'utf8').matchAll(/<video\b[^>]*>/g)].map(match => ({ file, tag: match[0] })));
        expect(videos.length).toBeGreaterThan(0);
        for (const { file, tag } of videos) {
            const page = file.replace(/_[a-z]{2}\.html$/, '');
            expect(tag, file).toBe(`<video controls preload="none" poster="images/posters/${page}.webp">`);
        }
    });

    test('every poster exists, is a WebP and stays light', () => {
        const posters = new Set(pages.map(file => file.replace(/_[a-z]{2}\.html$/, '')).filter(page => fs.readFileSync(path.join(root, 'projects', `${page}_en.html`), 'utf8').includes('<video')));
        for (const page of posters) {
            const file = path.join(root, 'images', 'posters', `${page}.webp`);
            expect(fs.existsSync(file), file).toBe(true);
            const bytes = fs.readFileSync(file);
            // RIFF....WEBP
            expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
            expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
            expect(bytes.length).toBeLessThan(150 * 1024);
        }
    });
});
