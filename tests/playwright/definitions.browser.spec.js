// The glossary of the "Du voc de dev" article on a phone screen: the badges of a definition sit in the flow of its header, so a long term wraps beside them instead of running under them, and none of them overlaps another, the term or the + sign.
const { test, expect, langs } = require('./site');

for (const lang of langs) {
    test(`/articles/du-voc-de-dev_${lang}.html at 320px keeps every definition badge clear of its term, of the other badges and of the + sign`, async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 800 });
        await page.goto(`/articles/du-voc-de-dev_${lang}.html`);
        await expect(page.locator('.accordion .badge-definition').first()).toBeVisible();
        const overlaps = await page.locator('.accordion').evaluate(accordion => {
            const found = [];
            const crosses = (a, b) => a.right > b.left + 0.5 && a.left < b.right - 0.5 && a.bottom > b.top + 0.5 && a.top < b.bottom - 0.5;
            for (const header of accordion.querySelectorAll('.card-header')) {
                const label = header.querySelector('label');
                const pills = [...header.querySelectorAll('.badge-definition')].map(badge => badge.getBoundingClientRect());
                // The lines of the term's text itself, not the box of the label, which may be wider than its text
                const range = document.createRange();
                range.selectNodeContents(label);
                const lines = [...range.getClientRects()];
                const box = header.getBoundingClientRect();
                // The + sign is drawn in the last 40 px of the header
                if (lines.some(line => line.right > box.right - 40)) found.push(`${label.textContent}: term under the + sign`);
                pills.forEach((pill, index) => {
                    if (lines.some(line => crosses(line, pill))) found.push(`${label.textContent}: term under badge ${index + 1}`);
                    if (pill.right > box.right - 40) found.push(`${label.textContent}: badge ${index + 1} under the + sign`);
                    if (pills.slice(index + 1).some(other => crosses(pill, other))) found.push(`${label.textContent}: badge ${index + 1} under another badge`);
                });
            }
            return found;
        });
        expect(overlaps).toEqual([]);
    });

    test(`/articles/du-voc-de-dev_${lang}.html gives every definition at least one badge`, async ({ page }) => {
        await page.goto(`/articles/du-voc-de-dev_${lang}.html`);
        const headers = page.locator('.accordion .card-header');
        await expect(headers.first()).toBeVisible();
        const withoutBadge = await headers.evaluateAll(all => all.filter(header => !header.querySelector('.badge-definition')).map(header => header.textContent.trim()));
        expect(withoutBadge).toEqual([]);
    });
}
