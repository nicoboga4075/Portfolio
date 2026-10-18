// Unit tests of projects/resolve-projects.js: the projects with a page of their own are the cards whose explore is a slug, not an address nor a part of another page.
const resolveProjects = require('../../projects/resolve-projects.js');

test('keeps the slugs, in the order of the cards, and leaves out the addresses, the parts of another page and the cards without explore', () => {
    const cards = [{ explore: 'ebatisoft' }, { explore: 'https://example.com' }, { explore: 'http://example.com' }, { explore: 'blog#mcs' }, {}, { explore: 'crm_elphicom' }];
    expect(resolveProjects(cards)).toEqual(['ebatisoft', 'crm_elphicom']);
});

test('gives a page to every real card that opens a slug, each with its two pages', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const root = path.join(__dirname, '..', '..');
    const { cards } = require('../../_data/projects.json');
    const pages = resolveProjects(cards);
    expect(pages.length).toBeGreaterThan(0);
    for (const slug of pages) {
        for (const lang of Object.keys(require('../../package.json').config.locales)) {
            expect(fs.existsSync(path.join(root, 'projects', `${slug}_${lang}.html`))).toBe(true);
        }
    }
});
