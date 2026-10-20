// The menu of the home page: each link scrolls to its section, and on a phone the menu stays folded until the Menu button opens it.
const { config } = require('../../../package.json');
const nav = require('../../../_data/nav.json');

const langs = Object.keys(config.locales);

describe('menu of the home page', () => {
    for (const lang of langs) {
        it(`/${lang}: each menu link scrolls to its section`, () => {
            cy.visit(`/${lang}`);
            cy.get('#ftco-nav .nav-link').should('have.length', nav.menus.length).each(link => {
                const section = link.attr('href');
                cy.wrap(link).click();
                // The menu bar is fixed: the section is reached once its top sits near the top of the window
                cy.get(section).should(([element]) => {
                    expect(Math.abs(element.getBoundingClientRect().top)).to.be.lessThan(120);
                });
            });
        });

        it(`/${lang} on a phone: the menu is folded until the Menu button opens it`, () => {
            cy.viewport('iphone-x');
            cy.visit(`/${lang}`);
            cy.get('#ftco-nav').should('not.be.visible');
            cy.get('.navbar-toggler').should('be.visible').and('have.attr', 'aria-label', nav[lang].navigation).click();
            cy.get('#ftco-nav').should('be.visible');
            cy.get('#ftco-nav .nav-link').first().should('be.visible').and('have.text', nav.menus[0][lang]);
        });
    }
});
