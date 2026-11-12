// The privacy policy and the terms pages, in English and French: the policy names the third-party services, the transfers, the retention and the GDPR rights with the CNIL, the terms carry the legal notice and point to the policy, and the footer links the legal notice and shows the policy of the consent banner as a link of its own.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

const headings = {
    en: ['Who is responsible for your data?', 'Third-party services', 'Cookies and audience measurement', 'Transfers outside the European Union', 'Data retention and deletion', 'Your rights'],
    fr: ['Qui est responsable de vos données ?', 'Services tiers', 'Cookies et mesure d\'audience', 'Transferts hors de l\'Union européenne', 'Conservation et suppression des données', 'Vos droits']
};

test.describe('privacy policy pages', () => {
    for (const lang of ['en', 'fr']) {
        test(`the ${lang} policy lists the third-party services and the legal sections`, () => {
            const html = read(`policy_${lang}.html`);
            for (const heading of headings[lang]) expect(html).toContain(`<h2>${heading}</h2>`);
            for (const service of ['Netlify', 'Akismet', 'Gmail', 'reCAPTCHA', 'Google Fonts', 'Google Analytics', 'Calendly', 'Botpress', 'Supabase']) expect(html, service).toContain(service);
            expect(html).toContain(lang === 'en' ? 'GDPR' : 'RGPD');
            expect(html).toContain(lang === 'en' ? 'at the latest 3 years' : 'au plus tard 3 ans');
            expect(html).toContain('CNIL');
        });

        test(`the ${lang} policy links the CNIL safely and gives the contact email`, () => {
            const html = read(`policy_${lang}.html`);
            const cnil = html.match(/<a href="https:\/\/www\.cnil\.fr[^>]*>/);
            expect(cnil).not.toBeNull();
            expect(cnil[0]).toContain('target="_blank"');
            expect(cnil[0]).toContain('rel="noopener"');
            expect(html).toContain('{{ profile.email }}');
        });
    }
});

test.describe('terms pages legal notice', () => {
    for (const lang of ['en', 'fr']) {
        test(`the ${lang} terms carry the legal notice and point to the policy`, () => {
            const html = read(`terms_${lang}.html`);
            // Its anchor, the target of the Legal notice link of the footer
            expect(html).toContain(`<h2 id="legal-notice">${lang === 'en' ? 'Legal notice' : 'Mentions légales'}</h2>`);
            expect(html).toContain('Nicolas BOGALHEIRO');
            expect(html).toContain('{{ profile.email }}');
            expect(html).toContain('Netlify, Inc., 101 2nd Street, Suite 575, San Francisco, CA 94105');
            expect(html).toContain(`<a href="https://www.netlify.com" target="_blank" rel="noopener">netlify.com</a>`);
            expect(html).toContain(`href="/${lang}/policy"`);
        });
    }
});

test.describe('footer legal links', () => {
    const footerHtml = read('_includes/footer.html');
    const footer = JSON.parse(read('_data/footer.json'));
    const consent = JSON.parse(read('_data/consent.json'));

    test('links the legal notice of the terms page, in the language of the page, before the policy and the terms', () => {
        const legal = footerHtml.match(/<p class="legal">(.*)<\/p>/g)[1];
        expect(legal).toMatch(/^<p class="legal"><a id="legal-notice-link" href="\/\{\{ lang \}\}\/terms#legal-notice"><i>\{\{ copyrightLang\.legal \}\}<\/i><\/a> \| <a id="policy"/);
        expect(footer.copyright.en.legal).toBe('Legal notice');
        expect(footer.copyright.fr.legal).toBe('Mentions légales');
    });

    test('shows the privacy policy of the consent banner as a link of its own under its text', () => {
        expect(footerHtml).toMatch(/<div class="consent-text">\s*<p>\{\{ consent\[lang\]\.text \}\}<\/p>\s*<a class="consent-policy" href="\/\{\{ lang \}\}\/policy">\{\{ consent\[lang\]\.policy \}\}<\/a>\s*<\/div>/);
        for (const lang of ['en', 'fr']) expect(consent[lang].policy).toBeTruthy();
        const css = read('css/common.css');
        expect(css).toMatch(/#ftco-footer \.consent-policy \{[^}]*color: var\(--primary-light\);/);
        // The arrow after it is decoration, hidden from screen readers by its empty alternative text
        expect(css).toContain(String.raw`content: "\2192" / "";`);
    });
});

