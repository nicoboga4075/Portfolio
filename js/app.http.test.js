/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost"}
 */
// Unit tests of js/app.js on http, as on the local site of npm run dev, whatever its port since js/app.js only reads the protocol (the docblock above, a block by Jest's syntax, picks jsdom and that origin, each test setting its own path): no visit is counted, the contact form is not submitted to Netlify after its e-mail, and the session is kept.
const { loadApp, cleanUp, flush, routeFetch } = require('../tests/jest/fixture.cjs');

afterEach(cleanUp);

const token = { token_type: 'Bearer', access_token: 't' };
const formBody = '<form name="contactForm"><input name="name" value="Nico"><input name="subject" value="Hello"><textarea name="message">Hi</textarea></form><p id="callback-form"></p><span id="ftco-visitor"></span>';

test('counts no visit on the local site', () => {
    const app = loadApp({ body: formBody });
    app.initIndexPage('en');
    expect(window.fetch).not.toHaveBeenCalledWith('/.netlify/functions/visit');
});

test('sends the e-mail of the contact form without submitting it to Netlify, and keeps the session', async () => {
    const app = loadApp({ body: formBody, before: () => routeFetch({ 'gmail/v1': { ok: true } }) });
    sessionStorage.setItem('tokenAPI', JSON.stringify(token));
    const submit = jest.spyOn($.fn, 'submit');
    app.initPage();
    $('form').trigger('submit');
    await flush(20);
    expect($('#callback-form').text()).toBe(app.getMessage('success-generic'));
    expect(submit).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem('tokenAPI'))).toEqual(token);
});
