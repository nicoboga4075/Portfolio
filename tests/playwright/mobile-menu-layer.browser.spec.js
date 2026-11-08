// The mobile menu of the built home page: once opened it is laid over the fixed buttons of the page (z-index 1000), and back under the default layer when folded; on a laptop the rule does not apply.
const { test, expect, langs } = require('./site');

const layer = page => page.locator('.ftco-navbar-light').evaluate(el => getComputedStyle(el).zIndex);

for (const lang of langs) {
    test(`/${lang} on a phone: the navbar is above the fixed buttons while the menu is open, and not once folded`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 800 });
        await page.goto(`/${lang}`);
        expect(await layer(page)).not.toBe('1000');

        await page.locator('.navbar-toggler').click();
        await expect(page.locator('#ftco-nav')).toHaveClass(/(^|\s)show(\s|$)/);
        expect(await layer(page)).toBe('1000');

        await page.locator('.navbar-toggler').click();
        await expect(page.locator('#ftco-nav')).not.toHaveClass(/(^|\s)show(\s|$)/);
        await expect(page.locator('#ftco-nav')).not.toHaveClass(/collapsing/);
        expect(await layer(page)).not.toBe('1000');
    });

    test(`/${lang} on a laptop: the navbar layer is left alone`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(`/${lang}`);
        expect(await layer(page)).not.toBe('1000');
    });
}
