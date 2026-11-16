// The consent banner of the preview build, as a first-time visitor sees it: shown on every page with the third-party services only (Google Analytics is built in production alone), each choice kept, the Google scripts of the contact form, Calendly and Botpress loaded only once the services are allowed.
const { test, expect, data } = require('./site');

const consent = data('_data/consent.json');
// The hosts of the third-party services of the banner: Google (reCAPTCHA, sign-in, API client), Calendly and Botpress
const thirdParty = url => /(^|\.)(google\.com|calendly\.com|botpress\.cloud|bpcontent\.cloud)$/.test(url.hostname);

test.use({ storedConsent: null });

// The third-party requests of the page, answered empty so that nothing leaves the machine
async function recordThirdParty(page) {
    const requested = [];
    await page.route(thirdParty, route => {
        requested.push(route.request().url());
        return route.fulfill({ contentType: 'text/javascript', body: '' });
    });
    return requested;
}

test('offers the third-party services alone in the preview build, every box unticked, and keeps a refusal', async ({ page }) => {
    await page.goto('/fr/policy');
    const banner = page.locator('#consent-banner');
    await expect(banner).toBeVisible();
    await expect(banner.locator('input[name="consent"]')).toHaveCount(1);
    await expect(banner.locator('input[value="services"]')).not.toBeChecked();
    await banner.getByRole('button', { name: consent.fr.refuse }).click();
    await expect(banner).toBeHidden();
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem('consent')))).toEqual({ services: false, date: expect.any(Number) });
    await page.reload();
    await expect(banner).toBeHidden();
    await page.locator('#consent-manage').click();
    await expect(banner).toBeVisible();
});

test('loads no Google script with the contact form until the services are allowed from its notice', async ({ page }) => {
    const requested = await recordThirdParty(page);
    await page.goto('/en');
    await page.locator('#consent-banner').getByRole('button', { name: consent.en.refuse }).click();
    await page.locator('form[name="contactForm"]').scrollIntoViewIfNeeded();
    const notice = page.locator('#contact-consent');
    await expect(notice).toBeVisible();
    expect(requested).toEqual([]);
    await notice.getByRole('button', { name: consent.en.allow }).click();
    await expect(notice).toBeHidden();
    await expect.poll(() => requested.some(url => url.includes('recaptcha/api.js'))).toBe(true);
});

test('asks in the banner before Calendly, and opens it once the services are allowed there', async ({ page }) => {
    const requested = await recordThirdParty(page);
    await page.goto('/en');
    const banner = page.locator('#consent-banner');
    await banner.getByRole('button', { name: consent.en.refuse }).click();
    // Its section fades in once scrolled to (.ftco-animate)
    await page.locator('#calendly-cta').scrollIntoViewIfNeeded();
    await page.locator('#calendly-cta').click();
    await expect(banner).toBeVisible();
    await expect(banner.locator('input[value="services"]')).toBeFocused();
    expect(requested).toEqual([]);
    await banner.locator('input[value="services"]').check();
    await banner.getByRole('button', { name: consent.en.save }).click();
    // The host itself, not a substring of the address that any host could hold (CodeQL js/incomplete-url-substring-sanitization)
    await expect.poll(() => requested.some(url => /(^|\.)calendly\.com$/.test(new URL(url).hostname))).toBe(true);
});
