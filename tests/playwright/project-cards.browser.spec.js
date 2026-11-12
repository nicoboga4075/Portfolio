// The project cards of the home page: one per card of _data/projects.json, in order, their details shown on hover, and the Explore button of a card with its own page opening that page in the same language.
const fs = require('node:fs');
const path = require('node:path');
const { test, expect, data, langs } = require('./site');

const projects = data('_data/projects.json');
const pageCard = projects.cards.find(card => !/^(https?:|blog#)/.test(card.explore));

for (const lang of langs) {
    test(`/${lang} shows every project card in order, each Explore button pointing at its target`, async ({ page }) => {
        await page.goto(`/${lang}`);
        const cards = page.locator('#projects-section .project');
        await expect(cards).toHaveCount(projects.cards.length);
        for (const [index, card] of projects.cards.entries()) {
            await expect(cards.nth(index)).toHaveAttribute('id', card.id);
            const href = await cards.nth(index).locator('.explore').getAttribute('href');
            if (/^https?:/.test(card.explore)) expect(href).toBe(card.explore);
            else expect(href).toBe(`/${lang}/${card.explore}`);
        }
    });

    test(`/${lang} shows the kind of each project in its top right bubble, its icon before its name in ${lang}`, async ({ page }) => {
        await page.goto(`/${lang}`);
        const icons = { school: 'icon-graduation-cap', internship: 'icon-briefcase', permanent: 'icon-briefcase' };
        for (const card of projects.cards) {
            const bubble = page.locator(`#${card.id} .project-type`);
            await expect(bubble).toHaveText(projects[lang].types[card.type]);
            await expect(bubble.locator(`.${icons[card.type]}`)).toHaveAttribute('aria-hidden', 'true');
            // In the top right corner, facing the technology badge in the top left one
            const [cardBox, bubbleBox] = [await page.locator(`#${card.id}`).boundingBox(), await bubble.boundingBox()];
            expect(cardBox.x + cardBox.width - (bubbleBox.x + bubbleBox.width)).toBeCloseTo(10, 0);
            expect(bubbleBox.y - cardBox.y).toBeCloseTo(10, 0);
            // Not styled as the technology badge: white with a blue outline, where the badge is filled
            const colors = await page.locator(`#${card.id}`).evaluate(el => [el.querySelector('.project-type'), el.querySelector('.badge:not(.project-type)')].map(badge => getComputedStyle(badge).backgroundColor));
            expect(colors[0]).toBe('rgb(255, 255, 255)');
            expect(colors[1]).not.toBe(colors[0]);
        }
    });

    test(`/${lang} in dark mode keeps the kind bubble white with its text readable`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto(`/${lang}`);
        await expect(page.locator('html')).toHaveClass(/dark-mode/);
        const [background, color] = await page.locator(`#${projects.cards[0].id} .project-type`).evaluate(el => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color]);
        expect(background).toBe('rgb(255, 255, 255)');
        expect(color).not.toBe(background);
    });

    test(`/${lang} shows the sectors of each project in ${lang}, each after its icon, as on the experiences of the resume`, async ({ page }) => {
        await page.goto(`/${lang}`);
        const resume = data('_data/resume.json');
        for (const card of projects.cards) {
            const tags = page.locator(`#${card.id} .project-sectors .sector-tag`);
            await expect(tags).toHaveText(card.sector.map(tag => tag[lang] ?? tag));
            for (const [index, tag] of card.sector.entries()) {
                const icon = resume.sectorIcons[tag.en ?? tag];
                expect(icon).toMatch(/^icon-/);
                await expect(tags.nth(index).locator(`i.${icon}`)).toHaveAttribute('aria-hidden', 'true');
            }
        }
    });

    test(`/${lang} shows the stack of each project as chips, each after the logo of its hard skill or an icon, with no label before them`, async ({ page }) => {
        await page.goto(`/${lang}`);
        for (const card of projects.cards) {
            const chips = page.locator(`#${card.id} .tech-chips .tech-chip`);
            await expect(page.locator(`#${card.id} .details`)).not.toContainText('Technologies');
            await expect(chips).toHaveText(card.technologies.map(t => (t.detail ? `${t.label} (${t.detail})` : t.label)));
            for (const [index, t] of card.technologies.entries()) {
                const chip = chips.nth(index);
                if (t.key) {
                    expect(fs.existsSync(path.join(__dirname, '..', '..', 'images', `${t.key}.png`)), t.key).toBe(true);
                    await expect(chip.locator('img')).toHaveAttribute('src', `images/${t.key}.png`);
                    await expect(chip.locator('img')).toHaveAttribute('alt', '');
                } else {
                    await expect(chip.locator(`i.${t.icon}`)).toHaveAttribute('aria-hidden', 'true');
                }
            }
        }
    });

    test(`/${lang} ends the context of each card with its duration, then its period in ${lang} between brackets when it has one`, async ({ page }) => {
        await page.goto(`/${lang}`);
        const colon = lang === 'fr' ? ' :' : ':';
        for (const card of projects.cards) {
            // The text of the context of _data (its <i> around the company names) as the browser reads it, rather than stripping its tags with a pattern
            const context = await page.evaluate(html => new DOMParser().parseFromString(html, 'text/html').body.textContent, card.context[lang]);
            const period = card.date ? ` (${card.date[lang]})` : '';
            await expect(page.locator(`#${card.id} .details p:not(.project-sectors)`).first()).toHaveText(`${projects[lang].context}${colon} ${context}${period}`);
            // An icon instead of the visible labels of the context and the description, which screen readers still read
            const lines = page.locator(`#${card.id} .project-line`);
            await expect(lines.nth(0).locator('i.icon-info-circle')).toHaveAttribute('aria-hidden', 'true');
            await expect(lines.nth(0).locator('.sr-only')).toHaveText(`${projects[lang].context}${colon} `);
            await expect(lines.nth(1).locator('i.icon-file-text-o')).toHaveAttribute('aria-hidden', 'true');
            await expect(lines.nth(1).locator('.sr-only')).toHaveText(`${projects[lang].description}${colon} `);
            await expect(lines.nth(0).locator('u')).toHaveCount(0);
        }
    });

    test(`/${lang}: hovering a card shows its details, and its Explore button opens the project page in ${lang}`, async ({ page }) => {
        await page.goto(`/${lang}`);
        const card = page.locator(`#${pageCard.id}`);
        await card.scrollIntoViewIfNeeded();
        // The title of the card as the page shows it, the project page shows the same in its heading
        const title = (await card.locator('.project-title h3').textContent()).trim();
        await expect(card.locator('.explore')).toBeHidden();
        await card.hover();
        await expect(card.locator('.explore')).toBeVisible();
        await card.locator('.explore').click();
        await expect(page).toHaveURL(new RegExp(`/${lang}/${pageCard.explore}$`));
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(page.locator('h1')).toContainText(title);
    });
}
