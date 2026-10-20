// The language switcher of the built site: each language link opens the same page in that language (home, blog, legal pages, project pages), and the page it opens is in that language.
const { test, expect, data, langs } = require('./site');

const projects = data('_data/projects.json');
const nav = data('_data/nav.json');
// One page of each kind, by its path without the language
const pages = ['', '/blog', '/policy', '/terms', `/${projects.cards.find(card => !/^(https?:|blog#)/.test(card.explore)).explore}`];

for (const from of langs) {
    for (const to of langs.filter(lang => lang !== from)) {
        for (const page of pages) {
            test(`the ${to.toUpperCase()} link of /${from}${page} opens /${to}${page} in ${to}`, async ({ page: tab }) => {
                await tab.goto(`/${from}${page}`);
                await expect(tab.locator('html')).toHaveAttribute('lang', from);
                await tab.locator(`#language-switcher a[hreflang="${to}"]`).click();
                await expect(tab).toHaveURL(new RegExp(`/${to}${page}$`));
                await expect(tab.locator('html')).toHaveAttribute('lang', to);
            });
        }
    }

    test(`the home page in ${from} shows its menu and sections in ${from}`, async ({ page }) => {
        await page.goto(`/${from}`);
        await expect(page.locator('#ftco-nav .nav-link')).toHaveText(nav.menus.map(menu => menu[from]));
        await expect(page.locator('#projects-section h2')).toHaveText(projects[from].heading);
    });
}
