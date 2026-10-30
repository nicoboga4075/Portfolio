const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'index-contact.html'), 'utf8');
const contact = require(path.join(root, '_data', 'contact.json'));

// Renders the contact include alone, the way Eleventy gives it its data
function render(lang, pageText = contact.pageText) {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, viewport: 'desktop', contact: { ...contact, pageText }, calendly: 'https://calendly.com/example' });
}

// The texts of the paragraphs under the heading, before the booking button
const paragraphs = html => [...html.split('calendly-cta')[0].matchAll(/<p>([^<]*)<\/p>/g)].map(match => match[1]);
const escapeQuotes = text => text.replaceAll("'", '&#39;');

test.describe('contact paragraphs', () => {
    for (const lang of ['en', 'fr']) {
        test(`shows every p1, p2... of the ${lang} texts in order`, () => {
            const texts = Object.entries(contact.pageText[lang]).filter(([key]) => /^p\d+$/.test(key)).map(([, text]) => escapeQuotes(text));
            expect(texts.length).toBeGreaterThan(1);
            expect(paragraphs(render(lang))).toEqual(texts);
        });
    }

    test('takes a paragraph added up to p10 without a change of the template', () => {
        const pageText = { ...contact.pageText, en: { heading: 'Contact', p1: 'One', p2: 'Two', p10: 'Ten', bookingCta: 'Book' } };
        expect(paragraphs(render('en', pageText))).toEqual(['One', 'Two', 'Ten']);
    });

    test('shows the booking button with its text, none when the text is missing or empty', () => {
        expect(render('en')).toContain(`${contact.pageText.en.bookingCta}</a>`);
        for (const bookingCta of [undefined, '']) {
            const pageText = { ...contact.pageText, en: { ...contact.pageText.en, bookingCta } };
            expect(render('en', pageText)).not.toContain('calendly-cta');
        }
    });
});
