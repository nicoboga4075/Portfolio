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
}
