// The theme button of the built site: it cycles auto, light, dark and back to auto, stores the choice, shows its label in the page language, and auto follows the colour scheme of the system.
const { test, expect, data, langs } = require('./site');

const nav = data('_data/nav.json');
const darkClass = /(^|\s)dark-mode(\s|$)/;

for (const lang of langs) {
    for (const path of [`/${lang}`, `/${lang}/policy`]) {
        test(`${path}: the button cycles auto, light, dark and auto, and the page keeps the stored choice on reload`, async ({ page }) => {
            await page.emulateMedia({ colorScheme: 'light' });
            await page.goto(path);
            const label = page.locator('#dark-icon .sr-only');
            const html = page.locator('html');
            await expect(label).toHaveText(nav[lang].theme.auto);
            await expect(html).not.toHaveClass(darkClass);

            await page.locator('#dark-icon').click();
            await expect(label).toHaveText(nav[lang].theme.light);
            await expect(html).not.toHaveClass(darkClass);
            expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');

            await page.locator('#dark-icon').click();
            await expect(label).toHaveText(nav[lang].theme.dark);
            await expect(html).toHaveClass(darkClass);
            expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

            await page.reload();
            await expect(html).toHaveClass(darkClass);
            await expect(label).toHaveText(nav[lang].theme.dark);

            await page.locator('#dark-icon').click();
            await expect(label).toHaveText(nav[lang].theme.auto);
            await expect(html).not.toHaveClass(darkClass);
            expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
        });
    }

    test(`/${lang}: auto follows the colour scheme of the system, even when it changes`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto(`/${lang}`);
        await expect(page.locator('html')).toHaveClass(darkClass);
        await page.emulateMedia({ colorScheme: 'light' });
        await expect(page.locator('html')).not.toHaveClass(darkClass);
    });
}
