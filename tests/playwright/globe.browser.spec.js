// The globe of the visited countries in the counter section, in the preview build: screen readers get one figure named by its hidden caption listing the countries, while the canvas and its tooltip stay out of their reach and the canvas keeps no role, since it takes the drag (initGlobe of js/app.js, tested in js/app.test.js) and an image role would make an interactive element non-interactive.
const { test, expect, data, langs } = require('./site');

const counter = data('_data/counter.json');

for (const lang of langs) {
    test(`/${lang}: the figure of the globe is named by the visited countries, the dragged canvas and its tooltip are hidden from screen readers`, async ({ page }) => {
        await page.goto(`/${lang}`);
        // Its column stays hidden until scrolled to (.ftco-animate), so hidden elements are included
        const figure = page.getByRole('figure', { name: counter[lang].globeLabel, includeHidden: true });
        await expect(figure).toHaveCount(1);
        await expect(figure.locator('canvas#globe')).toHaveCount(1);
        await expect(page.locator('#globe')).not.toHaveAttribute('role');
        await expect(page.locator('#globe')).toHaveAttribute('aria-hidden', 'true');
        await expect(page.locator('.globe-tooltip')).toHaveAttribute('aria-hidden', 'true');
    });
}
