// A menu link of the home page, on a first visit (nothing in the cache, the pictures above loading as the page scrolls): the page lands with its section right under the navbar, and the menu highlights that section, not the one before.
const { test, expect, langs } = require('./site');

for (const lang of langs) {
    for (const section of ['services-section', 'projects-section', 'blog-section']) {
        test(`/${lang}: the menu link to ${section} lands on it and highlights it`, async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 800 });
            await page.goto(`/${lang}`);
            await page.locator(`#ftco-nav a[href="#${section}"]`).click();
            // Under the navbar (70px), give or take a pixel, once the corrections are over
            await expect.poll(() => page.evaluate(id => Math.round(document.getElementById(id).getBoundingClientRect().top), section), { timeout: 10_000 }).toBeGreaterThanOrEqual(69);
            await expect.poll(() => page.evaluate(id => Math.round(document.getElementById(id).getBoundingClientRect().top), section), { timeout: 10_000 }).toBeLessThanOrEqual(71);
            await expect(page.locator('#ftco-nav .nav-link.active')).toHaveAttribute('href', `#${section}`);
        });
    }
}
