// The emoji of the theme button on the light pages, which load no icon font: standalone.css centres it in a flex box instead of leaving it on the text baseline, about 1.5px below the middle of the language pill next to it.
const { test, expect } = require('./site');

const pages = ['/en/policy', '/en/terms', '/fr/policy', '/fr/terms', '/en/crm_elphicom'];

for (const url of pages) {
    test(`${url} centres the emoji of the theme button on the language switcher`, async ({ page }) => {
        await page.goto(url);
        await expect(page.locator('#dark-icon[data-icon-mode="emoji"]')).toHaveCount(1);
        const { emoji, switcher } = await page.evaluate(() => {
            const middle = box => box.top + box.height / 2;
            // The box of the glyph itself, not of its span
            const range = document.createRange();
            range.selectNodeContents(document.querySelector('#dark-icon [aria-hidden]'));
            return { emoji: middle(range.getBoundingClientRect()), switcher: middle(document.querySelector('#language-switcher').getBoundingClientRect()) };
        });
        expect(Math.abs(emoji - switcher)).toBeLessThanOrEqual(1);
    });
}
