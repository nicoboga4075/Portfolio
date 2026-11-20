const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { renderInclude } = require('./render');

const root = path.join(__dirname, '..', '..');
const about = require(path.join(root, '_data', 'about.json'));
const book = require(path.join(root, '_data', 'book.json'));
const css = fs.readFileSync(path.join(root, 'css', 'app.css'), 'utf8');

// The body of the first rule of app.css with exactly this selector
const rule = selector => {
    const match = css.match(new RegExp(`^${selector.replaceAll('.', '\\.').replaceAll(':', '\\:').replaceAll('+', '\\+')}\\s*\\{([^}]*)\\}`, 'm'));
    return match ? match[1] : '';
};

test.describe('book open button and upload hint', () => {
    for (const lang of ['en', 'fr']) {
        test(`renders the open button of the book as a filled button, not a Bootstrap outline one, on the ${lang} page`, () => {
            const html = renderInclude('index-about.html', { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, about, book, author: 'Author', profile: { age: 28, xp: 5 } });
            expect(html).toMatch(/<button type="button" class="book-open btn">/);
            expect(html).not.toMatch(/class="book-open[^"]*btn-outline-primary/);
        });
    }

    test('fills the open button in the dark blue with white text, also on hover and focus', () => {
        const base = rule('.book-open');
        expect(base).toContain('background-color: var(--primary-dark)');
        expect(base).toContain('color: var(--white)');
        const hover = rule('.book-open:hover,\n.book-open:focus-visible');
        expect(hover).toContain('color: var(--white)');
        expect(hover).toContain('background-color: oklch(from var(--primary-dark)');
    });

    test('draws the upload hint and the focus ring of the upload zone in dark shades', () => {
        expect(rule('.tennis-upload-hint')).toContain('color: var(--secondary-dark)');
        expect(rule('.tennis-upload-input:focus-visible + .tennis-upload-zone')).toContain('outline: 3px solid var(--primary-dark)');
    });

    test('shows a disabled book control outlined in grey instead of faded', () => {
        const disabled = rule('.book-controls button:disabled');
        expect(disabled).toContain('color: var(--secondary-dark)');
        expect(disabled).toContain('background-color: transparent');
        expect(disabled).not.toContain('opacity');
    });
});
