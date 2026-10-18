// Unit tests of articles/resolve-articles.js, the resolveArticles filter of .eleventy.js
const resolveArticles = require('../../articles/resolve-articles.js');

const locales = { en: {}, fr: {} };

const article = (overrides = {}) => ({ slug: 'a', title: { en: 'Title', fr: 'Titre' }, date: '2025-01-02', tags: [], ...overrides });

describe('resolveArticles', () => {
    test('keeps the slug and the date, and picks the title of the language', () => {
        expect(resolveArticles([article()], 'fr', 'en', locales)).toEqual([{ slug: 'a', title: 'Titre', date: '2025-01-02', tags: [] }]);
    });

    test('falls back to the default language when the title lacks the language', () => {
        const [resolved] = resolveArticles([article({ title: { en: 'Only English' } })], 'fr', 'en', locales);
        expect(resolved.title).toBe('Only English');
    });

    test('leaves a plain tag as it is', () => {
        const [resolved] = resolveArticles([article({ tags: ['HTML'] })], 'en', 'en', locales);
        expect(resolved.tags).toEqual(['HTML']);
    });

    test('resolves a bilingual tag to the language', () => {
        const tags = [{ en: 'Accessibility', fr: 'Accessibilité' }];
        expect(resolveArticles([article({ tags })], 'fr', 'en', locales)[0].tags).toEqual(['Accessibilité']);
    });

    test('turns a tag with a name and an url into a one-entry object', () => {
        const tags = [{ name: 'WCAG', url: 'https://www.w3.org/WAI' }, { name: { en: 'Guidelines', fr: 'Directives' }, url: 'https://example.com' }];
        expect(resolveArticles([article({ tags })], 'fr', 'en', locales)[0].tags).toEqual([{ WCAG: 'https://www.w3.org/WAI' }, { Directives: 'https://example.com' }]);
    });

    test('leaves an object that is not bilingual as it is, a name without an url included', () => {
        const half = { en: 'Half' };
        const nameOnly = { name: 'No link' };
        expect(resolveArticles([article({ tags: [half, nameOnly] })], 'en', 'en', locales)[0].tags).toEqual([half, nameOnly]);
    });

    test('falls back to the default language for a tag or a tag name whose language is left empty', () => {
        const tags = [{ en: 'Accessibility', fr: undefined }, { name: { en: 'Guidelines', fr: null }, url: 'https://example.com' }];
        expect(resolveArticles([article({ tags })], 'fr', 'en', locales)[0].tags).toEqual(['Accessibility', { Guidelines: 'https://example.com' }]);
    });

    test('resolves the real articles in every language', () => {
        const articles = require('../../_data/articles.json');
        for (const lang of Object.keys(locales)) {
            const resolved = resolveArticles(articles, lang, 'en', locales);
            expect(resolved.map(item => item.slug)).toEqual(articles.map(item => item.slug));
            resolved.forEach(item => expect(typeof item.title).toBe('string'));
        }
    });
});
