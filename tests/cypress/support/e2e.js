// Loaded before every spec: each test starts with no stored theme or section, so a suite passes alone and in any order.
beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
});
