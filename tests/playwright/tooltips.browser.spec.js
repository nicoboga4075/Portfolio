// Every tooltip of the site looks the same: on the home and blog pages each title goes through the Bootstrap tooltip of the theme button (never the browser's own), the light pages hold no title at all (their theme button shows its label as a look-alike), and the two tooltips drawn by the site's CSS (the details of a spoken language or an education, the theme button of the light pages) take the colours, font, padding and corners of the Bootstrap one, in both themes.
const { test, expect, langs } = require('./site');

const lightPages = ['/en/policy', '/en/terms', '/fr/policy', '/fr/terms', '/en/crm_elphicom', '/fr/crm_elphicom'];
const looks = ['backgroundColor', 'color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'borderTopLeftRadius', 'paddingTop', 'paddingLeft'];

// The opening tags of the body that carry a title attribute (not data-title or data-subtitle), the head and the frames of third parties left out
const titledTags = html => {
    const body = html.slice(html.indexOf('<body'));
    return [...body.matchAll(/<(?!iframe\b)[a-z][^>]*\stitle="[^"]*"[^>]*>/g)].map(match => match[0]);
};

const styleOf = (locator, props) => locator.evaluate((el, names) => {
    const style = getComputedStyle(el);
    return Object.fromEntries(names.map(name => [name, style[name]]));
}, props);

for (const lang of langs) {
    for (const path of [`/${lang}`, `/${lang}/blog`]) {
        test(`${path}: every title shows as a Bootstrap tooltip`, async ({ request }) => {
            const tags = titledTags(await (await request.get(path)).text());
            expect(tags.length).toBeGreaterThan(0);
            expect(tags.filter(tag => !tag.includes('data-bs-toggle="tooltip"'))).toEqual([]);
        });
    }
}

for (const path of lightPages) {
    test(`${path}: no title for the browser to show, the light pages have no Bootstrap`, async ({ request }) => {
        expect(titledTags(await (await request.get(path)).text())).toEqual([]);
    });
}

for (const theme of ['light', 'dark']) {
    test(`the tooltips drawn by the site's CSS look like the Bootstrap one in the ${theme} theme`, async ({ page }) => {
        // Two heavy pages and three hovers: more time than the default under a loaded machine, and no wait for the third-party scripts of the load event
        test.setTimeout(90_000);
        await page.addInitScript(value => localStorage.setItem('theme', value), theme);
        await page.goto('/en', { waitUntil: 'domcontentloaded' });
        await page.locator('#dark-icon').hover();
        const bootstrap = page.locator('.tooltip.show .tooltip-inner');
        await expect(bootstrap).toBeVisible();
        const reference = await styleOf(bootstrap, looks);
        await page.mouse.move(0, 0);

        // The question mark of the first education, its block shown at once: the scroll reveal (ftco-animate) keeps it hidden until a waypoint fires, which some browsers delay after a scroll made by script
        await page.addStyleTag({ content: '.ftco-animate { visibility: visible !important; opacity: 1 !important; }' });
        const details = page.locator('#resume-section .info-tip-wrap').first();
        await details.scrollIntoViewIfNeeded();
        await expect(details).toBeVisible();
        // Polled: the box takes its look once the browser has applied the hover
        await details.hover();
        await expect.poll(() => styleOf(details.locator('.info-tip-box'), looks)).toEqual(reference);

        await page.goto('/en/policy', { waitUntil: 'domcontentloaded' });
        await page.locator('#dark-icon').hover();
        await expect.poll(() => styleOf(page.locator('#dark-icon .sr-only'), looks)).toEqual(reference);
    });
}
