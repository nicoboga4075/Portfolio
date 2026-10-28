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

// The token client of gisLoaded, whose consent the Google API reports at its first check
async function withConsent(app) {
    window.google = { accounts: { oauth2: { initTokenClient: jest.fn(() => ({ requestAccessToken: jest.fn() })) } } };
    window.gapi = { client: { getToken: jest.fn(() => token) } };
    app.gisLoaded();
    await flush();
    return window.google.accounts.oauth2.initTokenClient.mock.results[0].value;
}

// Sends one message and lets the consent check of 3 seconds run
async function send(app) {
    const sending = app.sendEmail('Nico', 'Hello', 'Hi');
    await jest.advanceTimersByTimeAsync(3000);
    await sending;
}

test('sends the e-mail of the contact form without submitting it to Netlify, and keeps the session', async () => {
    jest.useFakeTimers();
    const app = loadApp({ body: formBody, before: () => routeFetch({ 'functions/env': { ENV_CLIENT_ID: 'id' }, 'gmail/v1': { ok: true } }) });
    await withConsent(app);
    sessionStorage.setItem('currentHash', 'contact-section');
    app.initPage();
    $('form').trigger('submit');
    await jest.advanceTimersByTimeAsync(3000);
    await flush(20);
    expect($('#callback-form').text()).toBe(app.getMessage('success-generic'));
    expect(window.fetch).not.toHaveBeenCalledWith('/en', expect.anything());
    expect(sessionStorage.getItem('currentHash')).toBe('contact-section');
});

test('keeps the token of the consent in memory for the next message, never in a storage', async () => {
    jest.useFakeTimers();
    const app = loadApp({ body: formBody, before: () => routeFetch({ 'functions/env': { ENV_CLIENT_ID: 'id' }, 'gmail/v1': { ok: true } }) });
    const client = await withConsent(app);
    await send(app);
    await app.sendEmail('Nico', 'Hello again', 'Hi');
    expect(client.requestAccessToken).toHaveBeenCalledTimes(1);
    expect(window.fetch.mock.calls.filter(call => String(call[0]).includes('gmail'))).toHaveLength(2);
    expect(JSON.stringify({ ...sessionStorage, ...localStorage })).not.toContain(token.access_token);
});

test('forgets the kept token when Gmail refuses a message, and asks for consent again', async () => {
    jest.useFakeTimers();
    const app = loadApp({ body: formBody, before: () => routeFetch({ 'functions/env': { ENV_CLIENT_ID: 'id' }, 'gmail/v1': { ok: true } }) });
    const client = await withConsent(app);
    await send(app);
    routeFetch({ 'gmail/v1': { ok: false } });
    await app.sendEmail('Nico', 'Hello', 'Hi');
    expect($('#callback-form').text()).toBe(app.getMessage('error-generic'));
    routeFetch({ 'gmail/v1': { ok: true } });
    await send(app);
    expect(client.requestAccessToken).toHaveBeenCalledTimes(2);
    expect($('#callback-form').text()).toBe(app.getMessage('success-generic'));
});

test('forgets the kept token when Gmail cannot be reached, and logs why', async () => {
    jest.useFakeTimers();
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const app = loadApp({ body: formBody, before: () => routeFetch({ 'functions/env': { ENV_CLIENT_ID: 'id' }, 'gmail/v1': { ok: true } }) });
    const client = await withConsent(app);
    await send(app);
    routeFetch({ 'gmail/v1': new Error('offline') });
    await app.sendEmail('Nico', 'Hello', 'Hi');
    expect(log).toHaveBeenCalledWith(new Error('offline'));
    expect($('#callback-form').text()).toBe(app.getMessage('error-generic'));
    routeFetch({ 'gmail/v1': { ok: true } });
    await send(app);
    expect(client.requestAccessToken).toHaveBeenCalledTimes(2);
});
