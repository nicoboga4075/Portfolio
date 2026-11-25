// The glossary of the "Du voc de dev" article: its domain filters, several at once, and on a phone screen the badges of a definition sit in the flow of its header, so a long term wraps beside them instead of running under them, and none of them overlaps another, the term or the + sign.
const { test, expect, data, langs } = require('./site');

const messages = data('_data/messages.json');

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

    test(`/articles/du-voc-de-dev_${lang}.html filters the definitions by domain, several domains at once, and resets them`, async ({ page }) => {
        await page.goto(`/articles/du-voc-de-dev_${lang}.html`);
        const cards = page.locator('.accordion > .card');
        const total = await cards.count();
        const shown = page.locator('.accordion > .card:visible');
        const count = page.locator('.glossary-count');
        const text = n => messages['glossary-count'][lang].replace('{count}', n).replace('{total}', total);
        await expect(count).toHaveText(text(total));
        await expect(page.locator('.glossary-filters .filter-group-label')).toHaveText(messages['glossary-domains'][lang]);
        // A native group (fieldset) named by its legend, the visible label starting the row of chips in every browser
        await expect(page.getByRole('group', { name: messages['glossary-domains'][lang] })).toBeVisible();
        const [label, firstChip] = await page.locator('.glossary-filters').evaluate(bar => [bar.querySelector('.filter-group-label'), bar.querySelector('.filter-chip')].map(element => element.getBoundingClientRect()));
        expect(firstChip.left).toBeGreaterThan(label.right);
        expect(Math.abs(firstChip.top - label.top)).toBeLessThan(10);
        // One chip per domain of the badges, each once
        const domains = await page.locator('.accordion .badge-definition').evaluateAll(badges => [...new Set(badges.map(badge => badge.textContent.trim()))]);
        await expect(page.locator('.glossary-filters .filter-chip')).toHaveCount(domains.length);
        const network = lang === 'fr' ? 'Réseau' : 'Network';
        const chosen = ['Cloud', network];
        for (const domain of chosen) {
            const chip = page.locator('.glossary-filters .filter-chip', { hasText: new RegExp(`^${domain}$`) });
            await chip.click();
            await expect(chip).toHaveAttribute('aria-pressed', 'true');
        }
        const expected = await cards.evaluateAll((all, wanted) => all.filter(card => [...card.querySelectorAll('.badge-definition')].some(badge => wanted.includes(badge.textContent.trim()))).length, chosen);
        expect(expected).toBeGreaterThan(0);
        expect(expected).toBeLessThan(total);
        await expect(shown).toHaveCount(expected);
        await expect(count).toHaveText(text(expected));
        const badgesShown = await shown.evaluateAll((all, wanted) => all.every(card => [...card.querySelectorAll('.badge-definition')].some(badge => wanted.includes(badge.textContent.trim()))), chosen);
        expect(badgesShown).toBe(true);
        await page.locator('.glossary-filters .filter-reset').click();
        await expect(shown).toHaveCount(total);
        await expect(page.locator('.glossary-filters .filter-chip[aria-pressed="true"]')).toHaveCount(0);
        await expect(page.locator('.glossary-filters .filter-reset')).toBeHidden();
    });

    test(`/${lang}/blog#du-voc-de-dev builds the domain filters of the article injected into the blog page, and a search resets them`, async ({ page }) => {
        await page.goto(`/${lang}/blog#du-voc-de-dev`);
        const chips = page.locator('#article-shape .glossary-filters .filter-chip');
        await expect(chips.first()).toBeVisible();
        const total = await page.locator('#article-shape .accordion > .card').count();
        await chips.filter({ hasText: /^Cloud$/ }).click();
        await expect(page.locator('#article-shape .accordion > .card:visible')).not.toHaveCount(total);
        await expect(page.locator('#article-shape .glossary-filters .filter-group')).toHaveCount(1);
        // A native group named by its legend, on the blog page too
        await expect(page.locator('#article-shape').getByRole('group', { name: messages['glossary-domains'][lang] })).toBeVisible();
        // A search puts every definition back, every chip off, and the chips still filter afterwards
        await page.locator('input[name="search-input"]').fill('Kubernetes');
        await page.locator('.search-form').evaluate(form => form.requestSubmit());
        await expect(page.locator('#article-shape mark.highlight').first()).toBeAttached();
        await expect(page.locator('#article-shape .accordion > .card:visible')).toHaveCount(total);
        await expect(page.locator('#article-shape .glossary-filters .filter-chip[aria-pressed="true"]')).toHaveCount(0);
        await chips.filter({ hasText: /^Cloud$/ }).click();
        await expect(page.locator('#article-shape .accordion > .card:visible')).not.toHaveCount(total);
    });
}
