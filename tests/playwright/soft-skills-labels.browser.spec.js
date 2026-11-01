// The soft skill cards of the home page: a label never spills over the border of its card, even on a tablet where "management" is wider than the card, and every card keeps room for three lines.
const { test, expect, langs } = require('./site');

for (const lang of langs) {
    test(`/${lang}: every soft skill label stays inside its card on a tablet`, async ({ page }) => {
        // The carousel is hidden below 576px and the soft skills tab until it is chosen: open it at a width where the cards are narrow
        await page.setViewportSize({ width: 768, height: 900 });
        await page.goto(`/${lang}`);
        await page.locator('#carousel-section').scrollIntoViewIfNeeded();
        await page.locator('.owl-menu[data-target="#soft-skills"]').click();
        const cards = page.locator('#soft-skills .soft-card');
        await expect(cards.first()).toBeVisible();
        const count = await cards.count();
        expect(count).toBeGreaterThan(0);
        for (let index = 0; index < count; index++) {
            const metrics = await cards.nth(index).evaluate(card => {
                const label = card.querySelector('.soft-card-label');
                const front = card.querySelector('.soft-card-front').getBoundingClientRect();
                const box = label.getBoundingClientRect();
                return { inside: box.left >= front.left - 0.5 && box.right <= front.right + 0.5, scroll: label.scrollWidth, client: label.clientWidth, width: box.width, minHeight: Number.parseFloat(getComputedStyle(label).minHeight) };
            });
            expect(metrics.width).toBeGreaterThan(0);
            expect(metrics.inside).toBe(true);
            expect(metrics.scroll).toBeLessThanOrEqual(metrics.client);
            expect(metrics.minHeight).toBe(72);
        }
    });
}
