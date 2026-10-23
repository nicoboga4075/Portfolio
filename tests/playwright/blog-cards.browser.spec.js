// The blog cards of the home page: one per entry of _data/blog.json, with its title in the page language, each opening its article of _data/articles.json (same position) on the blog page.
const { test, expect, data, langs } = require('./site');

const blog = data('_data/blog.json');
const articles = data('_data/articles.json');

for (const lang of langs) {
    test(`/${lang} shows every blog card in order, with its title and its link to the article`, async ({ page }) => {
        await page.goto(`/${lang}`);
        const entries = page.locator('#blog-section .blog-entry');
        await expect(entries).toHaveCount(blog.entries.length);
        for (const [index, entry] of blog.entries.entries()) {
            await expect(entries.nth(index).locator('h3')).toHaveText(entry.title[lang]);
            await expect(entries.nth(index).locator('a.article-image')).toHaveAttribute('href', `/${lang}/blog#${articles[index].slug}`);
        }
    });

    test(`/${lang}: a blog card opens its article on the blog page, in ${lang}`, async ({ page }) => {
        // Two full pages, then the article fetched and injected with its own styles and script: Firefox on the GitLab runner needs more than the default 30 s and 5 s for it
        test.slow();
        const index = blog.entries.length - 1;
        await page.goto(`/${lang}`);
        const card = page.locator('#blog-section a.article-image').nth(index);
        await card.scrollIntoViewIfNeeded();
        await card.click();
        await expect(page).toHaveURL(new RegExp(`/${lang}/blog#${articles[index].slug}$`), { timeout: 15000 });
        await expect(page.locator('#article-shape')).toContainText(articles[index].title[lang], { timeout: 15000 });
    });
}
