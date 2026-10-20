// Every page of the built site in every language: its route answers, the page is in that language, its title names the author, and its language switcher links to every language.
const { config, author } = require('../../../package.json');
const projects = require('../../../_data/projects.json');

const langs = Object.keys(config.locales);
// The routes of package.json (the 404 page has no language) and the project pages
const routes = [
    ...Object.entries(config.appRoutes).filter(([name]) => name !== 'error404').map(([, route]) => route),
    ...projects.cards.filter(card => !/^(https?:|blog#)/.test(card.explore)).map(card => `/{lng}/${card.explore}`)
];

describe('pages', () => {
    for (const lang of langs) {
        for (const route of routes) {
            const url = route.replace('{lng}', lang);
            it(`${url} is in ${lang}, names the author and links to every language`, () => {
                cy.visit(url);
                cy.get('html').should('have.attr', 'lang', lang);
                cy.title().should('contain', author.name);
                cy.get('#language-switcher a').should('have.length', langs.length);
                for (const other of langs) cy.get(`#language-switcher a[hreflang="${other}"]`).should('have.attr', 'href').and('match', new RegExp(`^/${other}([/#]|$)`));
            });
        }
    }

    it('an unknown page answers 404', () => {
        cy.request({ url: '/en/no-such-page', failOnStatusCode: false }).its('status').should('eq', 404);
    });
});
