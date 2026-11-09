const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'skills-hard.html'), 'utf8');
const skillsData = require(path.join(root, '_data', 'skills.json'));

// Renders the hard skills include alone, the way Eleventy gives it its page
function render(lang) {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, { page: { fileSlug: `index_${lang}` }, skills: skillsData });
}

// Reads the image and the label of each skill of the carousel
function items(html) {
    return [...html.matchAll(/<img src="images\/([^"]+)\.png"[^>]*alt="([^"]*)"[^>]*><span>([^<]*)<\/span>/g)].map(match => ({ key: match[1], alt: match[2], label: match[3] }));
}

test.describe('hard skills carousel', () => {
    for (const lang of ['en', 'fr']) {
        test(`shows each tool with its image and the same label as alt text on the ${lang} page`, () => {
            const skills = items(render(lang));
            expect(skills.length).toBeGreaterThan(0);
            for (const skill of skills) {
                expect(skill.label).toBe(skill.alt);
                expect(fs.existsSync(path.join(root, 'images', `${skill.key}.png`))).toBe(true);
            }
        });
    }

    test('lists the added tools with their plain names in both languages', () => {
        for (const lang of ['en', 'fr']) {
            const labels = items(render(lang)).map(skill => skill.label);
            for (const name of ['.NET', 'TypeScript', 'Playwright', 'xUnit', 'Snyk', 'Agile', 'Netlify', 'JavaScript']) {
                expect(labels).toContain(name);
            }
            expect(labels).not.toContain('JS');
        }
    });

    for (const lang of ['en', 'fr']) {
        test(`links Figma to its doc from a PDF icon only, named for screen readers, on the ${lang} page`, () => {
            const colon = lang === 'fr' ? ' :' : ':';
            const html = render(lang);
            // The name and the logo stay plain, the PDF icon in the corner is the only link
            expect(html).toContain(`<div class="d-flex flex-column align-items-center hard-skill" data-filter="frontend"><img src="images/figma.png" class="img-fluid" alt="Figma" loading="lazy" height="75" width="75"><span>Figma</span><a class="hard-skill-doc" href="/docs/public/Certificat%20FIGMA.pdf" target="_blank" rel="noopener" aria-label="Figma${colon} ${skillsData.carousel[lang].docLinkLabel}"><i class="icon-file-pdf-o" aria-hidden="true"></i></a></div>`);
            expect(fs.existsSync(path.join(root, 'docs', 'public', 'Certificat FIGMA.pdf'))).toBe(true);
            // Every doc a hard skill links to is a public file
            for (const [, href] of html.matchAll(/class="hard-skill-doc" href="([^"]+)"/g)) expect(fs.existsSync(path.join(root, decodeURIComponent(href)))).toBe(true);
            expect(html.match(/class="hard-skill-doc"/g)).toHaveLength(7);
        });
    }

    for (const lang of ['en', 'fr']) {
        test(`shows the tip of a hard skill in a tooltip from a question mark in its corner on the ${lang} page`, () => {
            const colon = lang === 'fr' ? ' :' : ':';
            const html = render(lang).replaceAll(/>\s+</g, '><');
            const tips = Object.entries(skillsData.hardTips);
            expect(tips.length).toBeGreaterThan(0);
            for (const [key, tip] of tips) {
                const label = items(render(lang)).find(skill => skill.key === key).label;
                expect(html).toContain(`<button type="button" class="hard-skill-tip" data-bs-toggle="tooltip" data-container="body" title="${tip[lang]}" aria-label="${label}${colon} ${tip[lang]}"><i class="icon-question-circle" aria-hidden="true"></i></button>`);
            }
            expect(html.match(/class="hard-skill-tip"/g)).toHaveLength(tips.length);
        });
    }

    for (const lang of ['en', 'fr']) {
        test(`lists the certificates of a hard skill with several, from a PDF icon, each name linked on the ${lang} page`, () => {
            const colon = lang === 'fr' ? ' :' : ':';
            const html = render(lang).replaceAll(/>\s+</g, '><');
            for (const [key, docs] of Object.entries(skillsData.hardDocs)) {
                const label = items(render(lang)).find(skill => skill.key === key).label;
                const lines = docs.map(d => `<span class="hard-skill-docs-line"><a href="/docs/public/${encodeURIComponent(d.doc)}" target="_blank" rel="noopener">${d.name}</a>${d.text[lang].replaceAll("'", '&#39;')}</span>`).join('');
                expect(html).toContain(`<button type="button" class="hard-skill-doc hard-skill-docs" aria-label="${label}${colon} ${skillsData.carousel[lang].docsLinkLabel}"><i class="icon-file-pdf-o" aria-hidden="true"></i></button><span class="hard-skill-docs-list" hidden>${lines}</span>`);
                for (const { doc } of docs) expect(fs.existsSync(path.join(root, 'docs', 'public', doc))).toBe(true);
            }
        });
    }

    test('spells the V model in the language of the page', () => {
        const label = lang => items(render(lang)).find(skill => skill.key === 'v-model').label;
        expect(label('en')).toBe('V model');
        expect(label('fr')).toBe('Cycle en V');
    });
    for (const lang of ['en', 'fr']) {
        test(`filters the tools by category above the carousel, each button with its number of tools, on the ${lang} page`, () => {
            const html = render(lang).replaceAll(/>\s+</g, '><');
            const carousel = skillsData.carousel[lang];
            const categories = [...html.matchAll(/<div class="d-flex flex-column align-items-center[^"]*" data-filter="([^"]*)">/g)].map(match => match[1].split(' ').filter(Boolean));
            expect(categories).toHaveLength(items(html).length);
            // From the most tools to the fewest, a tie in the order of hardCategories (a stable sort)
            const buttons = Object.entries(carousel.hardCategories).map(([key, name]) => [key, name, categories.filter(list => list.includes(key)).length]).toSorted((a, b) => b[2] - a[2]).map(([key, name, number]) => `<button type="button" data-filter="${key}" aria-pressed="false"><i class="${skillsData.hardFilterIcons[key]}" aria-hidden="true"></i>${name.replaceAll('&', '&amp;')} (${number})</button>`).join('');
            expect(html).toContain(`<div id="hard-skills-filter" class="skill-filter" role="group" aria-label="${carousel.hardFilterLabel}"><button type="button" data-filter="" aria-pressed="true"><i class="${skillsData.hardFilterIcons.all}" aria-hidden="true"></i>${carousel.hardFilterAll} (${categories.length})</button>${buttons}</div><div id="hard-skills"`);
            // Every category has tools, and a tool belongs to known categories only
            for (const key of Object.keys(carousel.hardCategories)) expect(categories.some(list => list.includes(key))).toBe(true);
            for (const list of categories) for (const key of list) expect(Object.keys(carousel.hardCategories)).toContain(key);
        });
    }
});
