// The skip link of every kind of page: hidden until the first Tab, then shown in the page language, and Enter moves the focus to the content without leaving the page.
const { test, expect, data, langs } = require('./site');

const common = data('_data/common.json');
const projects = data('_data/projects.json');
// One page of each kind, by its path without the language: home, blog, a legal page and a project page
const pages = ['', '/blog', '/policy', `/${projects.cards.find(card => !/^(https?:|blog#)/.test(card.explore)).explore}`];

for (const lang of langs) {
    for (const path of pages) {
        test(`/${lang}${path} has a skip link to its content on the first Tab`, async ({ page, browserName }) => {
            await page.goto(`/${lang}${path}`);
            const link = page.locator('#skip-link');
            await expect(link).toHaveText(common.skipLink[lang]);
            // Out of sight until focused
            expect((await link.boundingBox()).y).toBeLessThan(0);
            // WebKit, as Safari by default, skips links on Tab (Alt+Tab does not reach them either in the Playwright WebKit): the link is focused there as Tab would
            if (browserName === 'webkit') {
                await link.focus();
            } else {
                await page.keyboard.press('Tab');
            }
            await expect(link).toBeFocused();
            await expect.poll(async () => (await link.boundingBox()).y).toBeGreaterThanOrEqual(0);
            const url = page.url();
            await page.keyboard.press('Enter');
            // One content per page, the blog included: the <main> of the article it injects becomes a plain div (initBlogPage of js/app.js)
            await expect(page.locator('main')).toHaveCount(1);
            await expect(page.locator('#ftco-main')).toBeFocused();
            expect(page.url()).toBe(url);
        });
    }
}
