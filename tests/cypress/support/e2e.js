// Loaded before every spec: each test starts with no stored theme or section, so a suite passes alone and in any order.
beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
});

// No service worker, as in the Playwright tests (serviceWorkers: 'block'): every page and script comes from the build, never from a worker a previous test registered
Cypress.on('window:before:load', win => {
    delete Object.getPrototypeOf(win.navigator).serviceWorker;
});
