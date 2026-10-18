// Unit tests of resolve-sections.js: the sections are the pages of the root in the default language, the home left out.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const resolveSections = require('../../resolve-sections.js');

test('lists the root pages of the default language but the home, sorted, and nothing else', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resolve-sections-'));
    for (const file of ['index_fr.html', 'terms_fr.html', 'blog_fr.html', 'blog_en.html', '404.html', 'googleabc.html', 'notes_fr.md']) fs.writeFileSync(path.join(dir, file), '');
    try {
        expect(resolveSections(dir, 'fr')).toEqual(['blog', 'terms']);
        expect(resolveSections(dir, 'en')).toEqual(['blog']);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

test('finds the real sections, each in every language', () => {
    const root = path.join(__dirname, '..', '..');
    const { locales, defaultLang } = require('../../package.json').routes;
    const sections = resolveSections(root, defaultLang);
    expect(sections).toEqual(expect.arrayContaining(['blog', 'policy', 'terms']));
    for (const name of sections) {
        for (const lang of Object.keys(locales)) expect(fs.existsSync(path.join(root, `${name}_${lang}.html`))).toBe(true);
    }
});
