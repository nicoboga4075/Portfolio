// The backs of the counters of the home page: the experiences in two columns of one line each from 1280px (one per line below), with nothing cut, and the filters of the three backs keeping only the items of the group pressed.
const { test, expect, langs } = require('./site');

// The counters stay hidden until the scroll reveals them: shown at once, so a test needs no scroll; the toggles are clicked from the page, the tilt and the sparks of the pointer slowing Firefox down
const openCard = async (page, index) => {
    await page.addStyleTag({ content: '.ftco-animate { visibility: visible !important; opacity: 1 !important; }' });
    const card = page.locator('#counter-section .soft-card').nth(index);
    await card.locator('.soft-card-toggle').evaluate(button => button.click());
    await expect(card).toHaveClass(/is-unlocked/);
    return card;
};

// The rows of the experiences and their heights, read from the layout (the turning card skews the boxes on screen), and whether anything is cut on the right
const layout = card => card.locator('.soft-card-back').evaluate(back => ({
    tops: [...back.querySelectorAll('.counter-list-grid li')].map(li => li.offsetTop),
    lines: [...back.querySelectorAll('.counter-list-grid li')].map(li => li.offsetHeight),
    cut: back.scrollWidth > back.clientWidth
}));

for (const lang of langs) {
    test(`/${lang}: the work experiences sit two by row, one line each, from 1280px, and one per line below`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(`/${lang}`);
        const card = await openCard(page, 1);
        let { tops, lines, cut } = await layout(card);
        expect(tops).toHaveLength(6);
        // Two by row: each pair shares its top, the next row lower
        for (let index = 0; index < tops.length; index += 2) expect(tops[index + 1]).toBe(tops[index]);
        expect(tops[2]).toBeGreaterThan(tops[0]);
        // One line each, and nothing cut on the right
        expect(Math.max(...lines)).toBeLessThan(20);
        expect(cut).toBe(false);

        await page.setViewportSize({ width: 1200, height: 900 });
        ({ tops, lines, cut } = await layout(card));
        expect(new Set(tops).size).toBe(6);
        expect(Math.max(...lines)).toBeLessThan(20);
        expect(cut).toBe(false);
    });

    test(`/${lang}: each filter of a counter keeps the items of its group, and All all of them`, async ({ page }) => {
        // Three cards and a dozen filters: more time than the default for Firefox, slow to draw the home page in software
        test.setTimeout(90_000);
        await page.goto(`/${lang}`);
        // The certifications (subject), the work experiences (contract, a job of two contracts under both) and the countries (continent)
        for (const index of [0, 1, 2]) {
            const card = await openCard(page, index);
            const buttons = card.locator('.counter-filter button');
            const total = await card.locator('li[data-filter]').count();
            // The groups of the items left shown, read at once (the flags and the logos pass under the pointer, so the buttons are clicked from the page)
            const shown = () => card.locator('li[data-filter]:not([hidden])').evaluateAll(items => items.map(item => item.dataset.filter.split(' ')));
            for (let button = 1; button < await buttons.count(); button++) {
                await buttons.nth(button).evaluate(element => element.click());
                await expect(buttons.nth(button)).toHaveAttribute('aria-pressed', 'true');
                const group = await buttons.nth(button).getAttribute('data-filter');
                const number = Number(/\((\d+)\)/.exec(await buttons.nth(button).textContent())[1]);
                const groups = await shown();
                expect(groups).toHaveLength(number);
                for (const list of groups) expect(list).toContain(group);
            }
            await buttons.first().evaluate(element => element.click());
            expect(await shown()).toHaveLength(total);
            await card.locator('.soft-card-toggle').evaluate(button => button.click());
        }
    });
}
