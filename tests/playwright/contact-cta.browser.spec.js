// The one call to action of the home page and the checks of the contact form, in the preview build: the hero and the hire me section are the only filled buttons outside the form, both leading to the contact section, and the form shows its errors under its fields, in the language of the page, instead of the bubbles of the browser.
const { test, expect, data, langs } = require('./site');

const messages = data('_data/messages.json');
const hero = data('_data/hero.json');

for (const lang of langs) {
    test(`/${lang}: the contact button of the hero and of hire me are the only filled buttons outside the form, and lead to the contact section`, async ({ page }) => {
        await page.goto(`/${lang}`);
        const filled = page.locator('a.btn-primary, button.btn-primary').filter({ hasNot: page.locator('xpath=ancestor::form') });
        const hrefs = await filled.evaluateAll(buttons => buttons.filter(button => !button.closest('form')).map(button => button.getAttribute('href')));
        expect(hrefs).toEqual([`/${lang}#contact-section`, `/${lang}#contact-section`]);
        await page.getByRole('link', { name: hero[lang].contactCta, exact: true }).first().click();
        await expect(page.locator('#contact-section')).toBeInViewport();
    });

    test(`/${lang}: the contact form shows its errors under its fields and focuses the first one`, async ({ page }) => {
        await page.goto(`/${lang}`);
        const form = page.locator('form[name="contactForm"]');
        await form.scrollIntoViewIfNeeded();
        // The send button waits for the captcha, which stays offline here: the form is submitted as the button would
        await page.locator('#contact-subject').fill('Hi');
        await page.locator('#contact-message').fill('Too short');
        await form.evaluate(element => element.requestSubmit());
        await expect(page.locator('#contact-name-error')).toHaveText(messages['form-required'][lang]);
        await expect(page.locator('#contact-subject-error')).toHaveText(messages['form-too-short'][lang].replace('{min}', '3'));
        await expect(page.locator('#contact-message-error')).toHaveText(messages['form-too-short'][lang].replace('{min}', '10'));
        await expect(page.locator('#contact-name')).toBeFocused();
        await expect(page.locator('#contact-name')).toHaveAttribute('aria-invalid', 'true');
        await page.locator('#contact-name').fill('Nico');
        await expect(page.locator('#contact-name-error')).toBeHidden();
    });

    test(`/${lang}: the tennis upload serves several files into the basket, bounces the refused ones off the rim, and takes each file back out`, async ({ page }) => {
        const { maxSizeMb, maxFiles, extensions } = data('package.json').config.contactAttachment;
        const file = (name, size = 2048) => ({ name, mimeType: 'application/pdf', buffer: Buffer.alloc(size) });
        await page.goto(`/${lang}`);
        const zone = page.locator('.tennis-upload');
        const listed = page.locator('.tennis-upload-files li');
        const error = page.locator('#contact-file-error');
        await zone.scrollIntoViewIfNeeded();
        await page.setInputFiles('#contact-file', [file('a.pdf'), file('b.pdf')]);
        await expect(zone).toHaveClass(/\bis-in\b/);
        await expect(listed).toHaveCount(2);
        await expect(page.locator('.tennis-basket-ball')).toHaveCount(2);
        await expect(page.locator('.tennis-upload-status')).toHaveText(['a.pdf', 'b.pdf'].map(name => messages['contact-file-in'][lang].replace('{name}', name)).join(' '));
        // A second pick adds to the basket, the input itself emptied each time
        await page.setInputFiles('#contact-file', [file('c.pdf')]);
        await expect(listed).toHaveCount(3);
        expect(await page.locator('#contact-file').evaluate(input => input.files.length)).toBe(0);
        await page.setInputFiles('#contact-file', [file('big.pdf', maxSizeMb * 1024 * 1024)]);
        await expect(zone).toHaveClass(/\bis-out\b/);
        await expect(error).toHaveText(messages['form-file-too-big'][lang].replace('{max}', String(maxSizeMb)));
        await page.setInputFiles('#contact-file', [{ name: 'run.exe', mimeType: 'application/octet-stream', buffer: Buffer.alloc(8) }]);
        await expect(error).toHaveText(messages['form-file-type'][lang].replace('{name}', 'run.exe').replace('{types}', extensions.join(', ')));
        await page.setInputFiles('#contact-file', Array.from({ length: maxFiles }, (_, index) => file(`more-${index}.pdf`, 10)));
        await expect(listed).toHaveCount(maxFiles);
        await expect(error).toHaveText(messages['form-file-too-many'][lang].replace('{max}', String(maxFiles)));
        await page.getByRole('button', { name: messages['contact-file-remove'][lang].replace('{name}', 'b.pdf') }).click();
        await expect(listed).toHaveCount(maxFiles - 1);
        await expect(page.locator('#contact-file')).toBeFocused();
        await expect(listed.filter({ hasText: 'b.pdf' })).toHaveCount(0);
    });
}
