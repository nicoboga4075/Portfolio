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
                // The section is reached once it fills part of the window: images that load while scrolling can still move its top
                cy.get(section).should(([element]) => {
                    const { top, bottom } = element.getBoundingClientRect();
                    expect(top).to.be.lessThan(element.ownerDocument.defaultView.innerHeight);
                    expect(bottom).to.be.greaterThan(0);
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
