// The globe of the visited countries in the counter section, in the preview build: screen readers get one image named by the countries, held by the frame of the canvas, while the canvas itself keeps no role, since it takes the drag (initGlobe of js/app.js, tested in js/app.test.js) and an image role would make an interactive element non-interactive.
const { test, expect, data, langs } = require('./site');

const counter = data('_data/counter.json');

for (const lang of langs) {
    test(`/${lang}: the frame of the globe is the image named by the visited countries, the dragged canvas has no role`, async ({ page }) => {
        await page.goto(`/${lang}`);
        // Its column stays hidden until scrolled to (.ftco-animate), so hidden elements are included
        const image = page.getByRole('img', { name: counter[lang].globeLabel, includeHidden: true });
        await expect(image).toHaveCount(1);
        await expect(image.locator('canvas#globe')).toHaveCount(1);
        await expect(page.locator('#globe')).not.toHaveAttribute('role');
        await expect(page.locator('#globe')).not.toHaveAttribute('aria-label');
    });
}
