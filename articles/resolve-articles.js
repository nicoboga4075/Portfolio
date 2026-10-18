// Each article of _data/articles.json in one language (falling back to the default one), as the articles meta of the home and blog pages gives it to js/app.js: its bilingual title and tags resolved, the tags that are already single-language left as they are; the resolveArticles filter of .eleventy.js, and the articles of the Jest tests of js/app.js (tests/jest/fixture.cjs).
module.exports = function resolveArticles(articles, lang, defaultLang, locales) {
    const langCodes = Object.keys(locales);
    const isBilingualText = value => typeof value === "object" && langCodes.every(code => code in value);
    const resolveTag = tag => {
        if (typeof tag === "string") return tag;
        if ("name" in tag && "url" in tag) {
            const name = isBilingualText(tag.name) ? (tag.name[lang] ?? tag.name[defaultLang]) : tag.name;
            return { [name]: tag.url };
        }
        return isBilingualText(tag) ? (tag[lang] ?? tag[defaultLang]) : tag;
    };
    return articles.map(article => ({
        slug: article.slug,
        title: article.title[lang] ?? article.title[defaultLang],
        date: article.date,
        tags: article.tags.map(resolveTag)
    }));
};
