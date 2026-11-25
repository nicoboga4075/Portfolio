/**
 * @jest-environment jsdom
 */
// Unit tests of initGlossaryFilters of js/standalone.js on a jsdom page holding the markup of _includes/glossary-filters.html and a glossary accordion: one chip per domain sorted in the page language, several chips at once keeping the cards of any chosen domain, the count, and the reset button.

// The filter bar of _includes/glossary-filters.html, then an accordion with one card per entry of `cards` (the badges of each one)
function glossaryPage(cards, lang = 'fr') {
    document.documentElement.lang = lang;
    document.body.innerHTML = `
        <div class="glossary-filters" data-reset="Réinitialiser" data-count="{count} définitions sur {total}">
            <div class="filter-group"><span class="filter-group-label">Domaines</span></div>
            <p class="glossary-count"></p>
        </div>
        <div class="accordion">${cards.map((badges, index) => `
            <div class="card">
                <input type="checkbox" id="q${index + 1}">
                <div class="card-header"><label for="q${index + 1}">Term ${index + 1}</label>${badges.map(badge => `<span class="badge badge-definition">${badge}</span>`).join('')}</div>
                <div class="card-body">Text</div>
            </div>`).join('')}
        </div>`;
}

function runScript() {
    let script;
    jest.isolateModules(() => {
        script = require('./standalone.js');
    });
    return script;
}

const chips = () => [...document.querySelectorAll('.filter-chip')];
const chip = name => chips().find(button => button.textContent === name);
const shown = () => [...document.querySelectorAll('.accordion > .card:not(.filtered-out)')].map(card => card.querySelector('label').textContent);
const count = () => document.querySelector('.glossary-count').textContent;
const reset = () => document.querySelector('.glossary-filters .filter-reset');

afterEach(() => {
    document.body.innerHTML = '';
    delete window.initPage;
});

test('does nothing on a page without the glossary filters', () => {
    document.body.innerHTML = '<div class="accordion"></div>';
    expect(() => runScript().initGlossaryFilters()).not.toThrow();
    expect(chips()).toHaveLength(0);
});

test('adds one chip per domain of the badges, once each, sorted in the page language, all off, and shows every card with the count', () => {
    glossaryPage([['Réseau', 'Cloud'], ['Cyber'], ['Cloud', 'Données']]);
    runScript().initGlossaryFilters();
    expect(chips().map(button => button.textContent)).toEqual(['Cloud', 'Cyber', 'Données', 'Réseau']);
    chips().forEach(button => {
        expect(button.type).toBe('button');
        expect(button.getAttribute('aria-pressed')).toBe('false');
    });
    expect(shown()).toEqual(['Term 1', 'Term 2', 'Term 3']);
    expect(count()).toBe('3 définitions sur 3');
    expect(reset().hidden).toBe(true);
    expect(reset().textContent).toBe('Réinitialiser');
    // The chips and the reset button go after the label of the group
    expect(document.querySelector('.filter-group').firstElementChild.className).toBe('filter-group-label');
    expect(document.querySelector('.filter-group').lastElementChild).toBe(reset());
});

test('keeps the cards of any chosen domain when several chips are on, and a second click turns a chip off', () => {
    glossaryPage([['Réseau', 'Cloud'], ['Cyber'], ['Cloud', 'Données'], ['Dev']]);
    runScript().initGlossaryFilters();
    chip('Cyber').click();
    expect(shown()).toEqual(['Term 2']);
    expect(chip('Cyber').classList.contains('active')).toBe(true);
    expect(chip('Cyber').getAttribute('aria-pressed')).toBe('true');
    expect(count()).toBe('1 définitions sur 4');
    expect(reset().hidden).toBe(false);
    chip('Cloud').click();
    expect(shown()).toEqual(['Term 1', 'Term 2', 'Term 3']);
    chip('Cyber').click();
    expect(shown()).toEqual(['Term 1', 'Term 3']);
    expect(chip('Cyber').classList.contains('active')).toBe(false);
    expect(chip('Cyber').getAttribute('aria-pressed')).toBe('false');
});

test('turns every chip off and shows every card again on reset', () => {
    glossaryPage([['Cloud'], ['Cyber'], ['Dev']]);
    runScript().initGlossaryFilters();
    chip('Cloud').click();
    chip('Dev').click();
    reset().click();
    expect(shown()).toEqual(['Term 1', 'Term 2', 'Term 3']);
    expect(chips().every(button => !button.classList.contains('active') && button.getAttribute('aria-pressed') === 'false')).toBe(true);
    expect(count()).toBe('3 définitions sur 3');
    expect(reset().hidden).toBe(true);
});

test('builds the chips again, all off, when the blog search has put back the article with chips that lost their listeners', () => {
    glossaryPage([['Cloud'], ['Cyber']]);
    const script = runScript();
    script.initGlossaryFilters();
    chip('Cloud').click();
    // The HTML of the article as the search keeps and puts it back: the chips are there, without their listeners
    const html = document.body.innerHTML;
    document.body.innerHTML = html;
    script.initGlossaryFilters();
    expect(chips().map(button => button.textContent)).toEqual(['Cloud', 'Cyber']);
    expect(document.querySelectorAll('.glossary-filters .filter-reset')).toHaveLength(1);
    chip('Cyber').click();
    expect(shown()).toEqual(['Term 2']);
    expect(chip('Cloud').getAttribute('aria-pressed')).toBe('false');
});

test('is run by initArticle, on a page of its own as in the blog page', () => {
    glossaryPage([['Cloud']], 'en');
    global.loadImages = jest.fn();
    global.initTranslator = jest.fn();
    runScript().initArticle(false);
    expect(chips()).toHaveLength(1);
    delete global.loadImages;
    delete global.initTranslator;
});
