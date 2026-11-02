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
        test(`links Figma to its certificate from a PDF icon only, named for screen readers, on the ${lang} page`, () => {
            const colon = lang === 'fr' ? ' :' : ':';
            const html = render(lang);
            // The name and the logo stay plain, the PDF icon in the corner is the only link
            expect(html).toContain(`<div class="d-flex flex-column align-items-center hard-skill"><img src="images/figma.png" class="img-fluid" alt="Figma" loading="lazy" height="75" width="75"><span>Figma</span><a class="hard-skill-certificate" href="/docs/public/Certificat%20FIGMA.pdf" target="_blank" rel="noopener" aria-label="Figma${colon} ${skillsData.carousel[lang].docLinkLabel}"><i class="icon-file-pdf-o" aria-hidden="true"></i></a></div>`);
            expect(fs.existsSync(path.join(root, 'docs', 'public', 'Certificat FIGMA.pdf'))).toBe(true);
        });
    }

    test('spells the V model in the language of the page', () => {
        const label = lang => items(render(lang)).find(skill => skill.key === 'v-model').label;
        expect(label('en')).toBe('V model');
        expect(label('fr')).toBe('Cycle en V');
    });
});
