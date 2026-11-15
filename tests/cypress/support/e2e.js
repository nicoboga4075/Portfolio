// Loaded before every spec: each test starts with no stored theme or section, so a suite passes alone and in any order.
beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
});

// No service worker, as in the Playwright tests (serviceWorkers: 'block'): every page and script comes from the build, never from a worker a previous test registered
Cypress.on('window:before:load', win => {
    delete Object.getPrototypeOf(win.navigator).serviceWorker;
});

// The choices of the consent banner (js/consent.js), stored before each page unless the test stored its own: the banner stays out of the way and the third-party services load as for a visitor who allowed them
Cypress.on('window:before:load', win => {
    if (!win.localStorage.getItem('consent')) {
        win.localStorage.setItem('consent', JSON.stringify({ services: true, date: Date.now() }));
    }
});
