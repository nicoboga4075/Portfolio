/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://nicoboga.netlify.app/en"}
 */
// Unit tests of js/consent.js: every category refused until the visitor allows it, the choices kept 6 months, the banner shown again from the footer, the consentchange event, whenConsented asking in the banner, and the button of the contact form allowing the third-party services alone.

const choice = category => `<label><input type="checkbox" name="consent" value="${category}"></label>`;
const banner = (categories = ['analytics', 'services']) => `<footer><button type="button" id="consent-manage">Manage cookies</button><section id="consent-banner" hidden><fieldset>${categories.map(choice).join('')}</fieldset><button type="button" data-consent="denied">Refuse all</button><button type="button" data-consent="custom">Save my choices</button><button type="button" data-consent="granted">Accept all</button></section></footer>`;
const grantButton = '<button type="button" id="grant" data-consent-grant="services">Allow</button>';
const sixMonths = 182 * 24 * 60 * 60 * 1000;

// Runs the script after the given body and returns its top-level functions, with the consentchange events it dispatches
function runScript(body = banner()) {
    document.body.innerHTML = body;
    const events = [];
    document.addEventListener('consentchange', event => events.push(event.detail));
    let api;
    jest.isolateModules(() => {
        api = require('./consent.js');
    });
    return { ...api, events };
}

const consentBanner = () => document.getElementById('consent-banner');
const checkbox = category => document.querySelector(`input[value="${category}"]`);
const stored = () => JSON.parse(localStorage.getItem('consent'));
const click = selector => document.querySelector(selector).click();

function storeConsent(choices, age = 0) {
    localStorage.setItem('consent', JSON.stringify({ ...choices, date: Date.now() - age }));
}

afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
});

describe('consent.js', () => {
    test('shows the banner without a stored choice, every category refused', () => {
        const { hasConsent } = runScript();
        expect(consentBanner().hidden).toBe(false);
        expect(hasConsent('analytics')).toBe(false);
        expect(hasConsent('services')).toBe(false);
    });

    test('allows every category of the banner on Accept all, stores it with its time and tells the page', () => {
        const { hasConsent, events } = runScript();
        click('[data-consent="granted"]');
        expect(consentBanner().hidden).toBe(true);
        expect(hasConsent('analytics')).toBe(true);
        expect(hasConsent('services')).toBe(true);
        expect(stored()).toEqual({ analytics: true, services: true, date: expect.any(Number) });
        expect(events).toEqual([{ analytics: true, services: true }]);
    });

    test('refuses every category on Refuse all, even a ticked one', () => {
        const { hasConsent, events } = runScript();
        checkbox('services').checked = true;
        click('[data-consent="denied"]');
        expect(hasConsent('services')).toBe(false);
        expect(stored()).toEqual({ analytics: false, services: false, date: expect.any(Number) });
        expect(events).toEqual([{ analytics: false, services: false }]);
    });

    test('keeps the ticked categories only on Save my choices', () => {
        const { hasConsent } = runScript();
        checkbox('services').checked = true;
        click('[data-consent="custom"]');
        expect(hasConsent('analytics')).toBe(false);
        expect(hasConsent('services')).toBe(true);
    });

    test('only offers the categories of the banner: audience measurement stays refused where it is not built in', () => {
        const { hasConsent } = runScript(banner(['services']));
        click('[data-consent="granted"]');
        expect(hasConsent('analytics')).toBe(false);
        expect(stored()).toEqual({ services: true, date: expect.any(Number) });
    });

    test('keeps the banner hidden with a choice of less than 6 months, and removes the old choice of Google Analytics alone', () => {
        localStorage.setItem('analytics-consent', JSON.stringify({ value: 'granted', date: Date.now() }));
        storeConsent({ analytics: false, services: true }, sixMonths - 60000);
        const { hasConsent } = runScript();
        expect(consentBanner().hidden).toBe(true);
        expect(hasConsent('services')).toBe(true);
        expect(localStorage.getItem('analytics-consent')).toBeNull();
    });

    test('asks again once a choice is 6 months old, or when the stored value is not JSON', () => {
        storeConsent({ services: true }, sixMonths);
        expect(runScript().hasConsent('services')).toBe(false);
        expect(consentBanner().hidden).toBe(false);
        localStorage.setItem('consent', '{');
        runScript();
        expect(consentBanner().hidden).toBe(false);
    });

    test('asks on every page when the storage is blocked, the choices still applying to the page', () => {
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        const { hasConsent } = runScript();
        expect(consentBanner().hidden).toBe(false);
        click('[data-consent="granted"]');
        expect(consentBanner().hidden).toBe(true);
        expect(hasConsent('services')).toBe(true);
    });

    test('shows the banner again from the footer button, with the current choices ticked and its first button focused', () => {
        storeConsent({ analytics: false, services: true });
        runScript();
        click('#consent-manage');
        expect(consentBanner().hidden).toBe(false);
        expect(checkbox('analytics').checked).toBe(false);
        expect(checkbox('services').checked).toBe(true);
        expect(document.activeElement).toBe(document.querySelector('[data-consent="denied"]'));
    });

    test('works without the footer button', () => {
        const { hasConsent } = runScript(banner().replace(/<button type="button" id="consent-manage">.*?<\/button>/, ''));
        click('[data-consent="granted"]');
        expect(hasConsent('services')).toBe(true);
    });

    test('allows the third-party services alone from the button of the contact form, the other choices kept', () => {
        storeConsent({ analytics: true, services: false });
        const { hasConsent, events } = runScript(banner() + grantButton);
        click('#grant');
        expect(hasConsent('analytics')).toBe(true);
        expect(hasConsent('services')).toBe(true);
        expect(events).toEqual([{ analytics: true, services: true, date: expect.any(Number) }]);
    });

    test('allows the third-party services alone from that button before any choice, and hides the banner', () => {
        const { hasConsent } = runScript(banner() + grantButton);
        click('#grant');
        expect(hasConsent('services')).toBe(true);
        expect(hasConsent('analytics')).toBe(false);
        expect(consentBanner().hidden).toBe(true);
    });

    describe('whenConsented', () => {
        test('runs the callback at once when the category is allowed', () => {
            storeConsent({ services: true });
            const { whenConsented } = runScript();
            const callback = jest.fn();
            whenConsented('services', callback);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('asks in the banner, its checkbox focused, and runs the callback once the category is allowed there', () => {
            storeConsent({ services: false });
            const { whenConsented } = runScript();
            const callback = jest.fn();
            whenConsented('services', callback);
            expect(consentBanner().hidden).toBe(false);
            expect(document.activeElement).toBe(checkbox('services'));
            expect(callback).not.toHaveBeenCalled();
            checkbox('services').checked = true;
            click('[data-consent="custom"]');
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('drops the callback on a refusal, and runs only the last one asked for', () => {
            storeConsent({ services: false });
            const { whenConsented } = runScript();
            const refused = jest.fn();
            whenConsented('services', refused);
            click('[data-consent="denied"]');
            click('[data-consent="granted"]');
            expect(refused).not.toHaveBeenCalled();
            const first = jest.fn();
            const last = jest.fn();
            storeConsent({ services: false });
            const again = runScript();
            again.whenConsented('services', first);
            again.whenConsented('services', last);
            click('[data-consent="granted"]');
            expect(first).not.toHaveBeenCalled();
            expect(last).toHaveBeenCalledTimes(1);
        });

        test('focuses the first button when the banner has no checkbox for the category', () => {
            storeConsent({ services: false });
            const { whenConsented } = runScript(banner(['services']));
            whenConsented('analytics', jest.fn());
            expect(document.activeElement).toBe(document.querySelector('[data-consent="denied"]'));
        });

        test('does nothing on a page without the banner', () => {
            const { whenConsented, hasConsent } = runScript('<footer></footer>');
            const callback = jest.fn();
            whenConsented('services', callback);
            expect(callback).not.toHaveBeenCalled();
            expect(hasConsent('services')).toBe(false);
        });
    });
});
