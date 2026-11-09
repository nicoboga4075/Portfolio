// The filter of the hard skills: 16px under the tabs, each category keeping only its tools in the carousel started again, All bringing them all back, and shown with the hard skills tab only.
const { test, expect, langs } = require('./site');

for (const lang of langs) {
    test(`/${lang}: the hard skills filter keeps the tools of each category, and only shows with the hard skills`, async ({ page }) => {
        // Each category starts the carousel again: more time than the default for Firefox, slow to draw the home page in software
        test.setTimeout(90_000);
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(`/${lang}`);
        await page.locator('#carousel-section').scrollIntoViewIfNeeded();
        const filter = page.locator('#hard-skills-filter');
        await expect(filter).toBeVisible();
        const gap = await page.evaluate(() => document.querySelector('#hard-skills-filter').getBoundingClientRect().top - document.querySelector('.owl-menus').getBoundingClientRect().bottom);
        expect(Math.round(gap)).toBe(16);

        const buttons = filter.locator('button');
        const items = page.locator('#hard-skills .owl-item > div');
        const total = await items.count();
        for (let button = 1; button < await buttons.count(); button++) {
            await buttons.nth(button).click();
            await expect(buttons.nth(button)).toHaveAttribute('aria-pressed', 'true');
            const category = await buttons.nth(button).getAttribute('data-filter');
            const number = Number(/\((\d+)\)/.exec(await buttons.nth(button).textContent())[1]);
            await expect(items).toHaveCount(number);
            for (const list of await items.evaluateAll(tools => tools.map(tool => tool.dataset.filter.split(' ')))) expect(list).toContain(category);
        }
        await buttons.first().click();
        await expect(items).toHaveCount(total);

        await page.locator('.owl-menu[data-target="#soft-skills"]').click();
        await expect(filter).toBeHidden();
        await page.locator('.owl-menu[data-target="#hard-skills"]').click();
        await expect(filter).toBeVisible();
    });
}
