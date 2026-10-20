// The project cards of the home page: one per card of _data/projects.json, in order, their details shown on hover, and the Explore button of a card with its own page opening that page in the same language.
const { test, expect, data, langs } = require('./site');

const projects = data('_data/projects.json');
const pageCard = projects.cards.find(card => !/^(https?:|blog#)/.test(card.explore));

for (const lang of langs) {
    test(`/${lang} shows every project card in order, each Explore button pointing at its target`, async ({ page }) => {
        await page.goto(`/${lang}`);
        const cards = page.locator('#projects-section .project');
        await expect(cards).toHaveCount(projects.cards.length);
        for (const [index, card] of projects.cards.entries()) {
            await expect(cards.nth(index)).toHaveAttribute('id', card.id);
            const href = await cards.nth(index).locator('.explore').getAttribute('href');
            if (/^https?:/.test(card.explore)) expect(href).toBe(card.explore);
            else expect(href).toBe(`/${lang}/${card.explore}`);
        }
    });

    test(`/${lang}: hovering a card shows its details, and its Explore button opens the project page in ${lang}`, async ({ page }) => {
        await page.goto(`/${lang}`);
        const card = page.locator(`#${pageCard.id}`);
        await card.scrollIntoViewIfNeeded();
        // The title of the card as the page shows it, the project page shows the same in its heading
        const title = (await card.locator('.project-title h3').textContent()).trim();
        await expect(card.locator('.explore')).toBeHidden();
        await card.hover();
        await expect(card.locator('.explore')).toBeVisible();
        await card.locator('.explore').click();
        await expect(page).toHaveURL(new RegExp(`/${lang}/${pageCard.explore}$`));
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(page.locator('h1')).toContainText(title);
    });
}
