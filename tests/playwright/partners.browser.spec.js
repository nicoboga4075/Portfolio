// The partner logos of the home page: each one links to its brand and its alternative text is the brand name as the brand writes it (OpenAI, NVIDIA, OVHcloud), not its image key with a capital letter.
const { test, expect, langs } = require('./site');

for (const lang of langs) {
    test(`/${lang} names every partner logo as its brand writes it`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(`/${lang}`);
        const logos = page.locator('#partners-section .partner img');
        const alts = await logos.evaluateAll(images => images.map(image => image.alt));
        expect(alts.length).toBeGreaterThan(0);
        for (const name of ['OpenAI', 'NVIDIA', 'OVHcloud', 'Microsoft']) {
            expect(alts).toContain(name);
        }
        for (const alt of alts) {
            expect(alt.trim()).not.toBe('');
        }
    });
}
