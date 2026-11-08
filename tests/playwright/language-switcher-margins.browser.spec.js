// The language switcher of the built home page: below the navbar's expand breakpoint it has vertical margins and no auto side margins, so it does not take the free space of its row; on a laptop it keeps its auto side margins.
const { test, expect, langs } = require('./site');

const margins = page => page.locator('.navbar #language-switcher').evaluate(el => {
    const style = getComputedStyle(el);
    return { top: style.marginTop, bottom: style.marginBottom, left: style.marginLeft, right: style.marginRight };
});

for (const lang of langs) {
    test(`/${lang} on a phone: the language switcher has vertical margins and no side margins`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 800 });
        await page.goto(`/${lang}`);
        const { top, bottom, left, right } = await margins(page);
        expect(top).toBe('10px');
        expect(bottom).toBe('10px');
        expect(left).toBe('0px');
        expect(right).toBe('0px');
    });

    test(`/${lang} on a laptop: the language switcher keeps its auto side margins`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(`/${lang}`);
        const { top, bottom, left, right } = await margins(page);
        expect(top).not.toBe('10px');
        expect(bottom).not.toBe('10px');
        // Auto side margins resolve to the same used width on both sides
        expect(left).toBe(right);
    });
}
