// The diagram of the steps of a survey in the article "Surveys from A to Z", read from the sources without a browser: the same six steps, icons and example tools in every language, the steps lit in turn only for a visitor who accepts motion, a column on a phone
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const css = read('css/standalone.css');
const pages = { en: read('articles/les-enquetes-de-a-a-z_en.html'), fr: read('articles/les-enquetes-de-a-a-z_fr.html') };

// The part of a page between the opening of the flow and its figure end
function flow(html) {
    return html.match(/<figure class="survey-flow-figure"[\s\S]*?<\/figure>/)[0];
}

test.describe('survey flow of the article Surveys from A to Z', () => {
    for (const lang of ['en', 'fr']) {
        test(`draws six steps, each with an icon and a title, then the loop on the ${lang} page`, () => {
            const html = flow(pages[lang]);
            expect(html.match(/<li class="survey-flow-step">/g)).toHaveLength(6);
            expect(html.match(/<span class="survey-flow-icon" aria-hidden="true"><i class="icon-[a-z-]+"><\/i><\/span>/g)).toHaveLength(6);
            expect(html.match(/<span class="survey-flow-title">[^<]+<\/span>/g)).toHaveLength(6);
            expect(html.match(/<figcaption class="survey-flow-loop">/g)).toHaveLength(1);
            expect(html).toMatch(/aria-label="[^"]+"/);
        });
    }

    test('uses the same icons in the same order in both languages', () => {
        const icons = html => [...flow(html).matchAll(/<i class="(icon-[a-z-]+)"><\/i><\/span>/g)].map(match => match[1]);
        expect(icons(pages.en)).toEqual(icons(pages.fr));
    });

    test('lists the same example tools in both languages', () => {
        const tools = html => [...flow(html).matchAll(/<p class="survey-flow-tools">[^<]*((?:<span>[^<]*<\/span>(?:, )?)+)/g)].map(match => match[1]);
        expect(tools(pages.en).length).toBeGreaterThan(0);
        expect(tools(pages.fr)).toEqual(tools(pages.en));
    });

    test('lights the steps one after another with a delay of two seconds each', () => {
        expect(css).toContain('@keyframes survey-flow-light');
        expect(css).toMatch(/\.survey-flow-icon\s*\{[^}]*animation: survey-flow-light 12s infinite;/);
        for (let step = 2; step <= 6; step++) {
            expect(css).toMatch(new RegExp(`\\.survey-flow-step:nth-child\\(${step}\\) \\.survey-flow-icon\\s*\\{\\s*animation-delay: ${(step - 1) * 2}s;`));
        }
    });

    test('runs the animation only when the visitor accepts motion', () => {
        const block = css.match(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}\n/)[0];
        expect(block).toContain('animation: survey-flow-light');
        expect(css.replace(block, '')).not.toMatch(/\.survey-flow-icon\s*\{[^}]*animation:/);
    });

    test('stacks the steps in a column under 768px', () => {
        const block = css.match(/@media \(max-width: 767\.98px\) \{\s*\/\* Room on the left[\s\S]*?\n\}\n/)[0];
        expect(block).toMatch(/\.survey-flow\s*\{[^}]*flex-direction: column;/);
        expect(block).toMatch(/\.survey-flow-step:not\(:last-child\)::after\s*\{[^}]*width: 2px;/);
    });

    test('keeps a tool name on one line', () => {
        expect(css).toMatch(/\.survey-flow-tools span\s*\{\s*white-space: nowrap;/);
    });
});
