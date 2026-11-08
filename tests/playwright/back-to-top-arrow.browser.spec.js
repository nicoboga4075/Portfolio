// The arrow of the scroll button on the light pages (policy, terms), which load no icon font: standalone.css draws it as a chevron, down on the first screen and up past it.
const { test, expect } = require('./site');

const pages = ['/en/policy', '/en/terms', '/fr/policy', '/fr/terms'];

for (const url of pages) {
    test(`${url} draws the arrow of the scroll button, down then up`, async ({ page }) => {
        await page.goto(url);
        const button = page.locator('#back-to-top');
        await expect(button.locator('.icon-arrow-down')).toHaveCount(1);
        const chevron = name => button.locator(`.${name}`).evaluate(el => {
            const style = getComputedStyle(el, '::before');
            return { content: style.content, width: style.width, borderTop: style.borderTopWidth, transform: style.transform };
        });
        const down = await chevron('icon-arrow-down');
        expect(down.content).not.toBe('none');
        expect(down.width).toBe('10px');
        expect(down.borderTop).toBe('2px');
        expect(down.transform).not.toBe('none');
        // Scrolled to the bottom of the page, the arrow turns up
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await expect(button.locator('.icon-arrow-up')).toHaveCount(1);
        const up = await chevron('icon-arrow-up');
        expect(up.content).not.toBe('none');
        expect(up.width).toBe('10px');
        expect(up.transform).not.toBe(down.transform);
    });
}
