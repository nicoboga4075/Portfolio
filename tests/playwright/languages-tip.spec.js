const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const resume = require(path.join(root, '_data', 'resume.json'));
const skills = require(path.join(root, '_data', 'skills.json'));
const tools = require(path.join(root, '_data', 'tools.json'));
const languages = require(path.join(root, '_data', 'languages.json'));

// Renders the resume include, its own includes read from _includes, the way Eleventy gives it its data
function render(lang) {
    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(root, '_includes')), { autoescape: true });
    return env.render('index-resume.html', { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, resume, skills, tools, languages, profile: { xp: 5 } });
}

const escapeHtml = text => text.replaceAll("'", '&#39;');

// The text of a detail line: plain, or its parts marked up by the template (bold, italics, an icon with its label for screen readers)
const partHtml = part => {
    if (part.highlight) return `<strong>${escapeHtml(part.highlight)}</strong>`;
    if (part.term) return `<em>${escapeHtml(part.term)}</em>`;
    if (part.icon) return `<i class="${part.icon}" title="${escapeHtml(part.label)}" aria-hidden="true"></i><span class="sr-only"> (${escapeHtml(part.label)})</span>`;
    return escapeHtml(part.text);
};
const textHtml = (detail, lang) => (detail.parts ? detail.parts[lang].map(partHtml).join('') : escapeHtml(detail.text[lang]));

test.describe('spoken languages', () => {
    for (const lang of ['en', 'fr']) {
        test(`gives a language with details a question mark and their tooltip, each certificate linked, and the others none, on the ${lang} page`, () => {
            const html = render(lang).replaceAll(/>\s+</g, '><');
            const colon = lang === 'fr' ? ' :' : ':';
            const detailed = languages.filter(language => language.details);
            expect(detailed.length).toBeGreaterThan(0);
            for (const language of detailed) {
                const lines = language.details.map(detail => `<span class="info-tip-line">${detail.doc ? `<a href="/docs/public/${encodeURIComponent(detail.doc)}" target="_blank" rel="noopener">${escapeHtml(detail.name[lang])}</a>` : ''}${textHtml(detail, lang)}</span>`).join('');
                expect(html).toContain(`${language.name[lang]} (${language.level[lang]}) <span class="info-tip-wrap"><button type="button" class="info-tip" aria-label="${language.name[lang]}${colon} ${resume[lang].languageDetails}"><i class="icon-question-circle" aria-hidden="true"></i></button><span class="info-tip-box">${lines}</span></span></h3>`);
                for (const { doc } of language.details.filter(detail => detail.doc)) expect(fs.existsSync(path.join(root, 'docs', 'public', doc))).toBe(true);
            }
            expect(html.slice(html.indexOf('id="skills"'), html.indexOf('id="awards"')).match(/class="info-tip"/g)).toHaveLength(detailed.length);
            for (const language of languages.filter(other => !other.details)) expect(html).toContain(`${language.name[lang]} (${language.level[lang]})</h3>`);
        });

        test(`shows the two flags of a language spoken in two countries in turn, and one flag for the others, on the ${lang} page`, () => {
            const html = render(lang);
            const swapped = languages.filter(language => language.flag2);
            expect(swapped.map(language => language.name.en)).toEqual(['English']);
            for (const language of swapped) {
                expect(html).toContain(`<h3><span class="flag-swap mr-2"><img src="images/${language.flag}" alt="${language.countryAlt[lang]}" width="27" height="18"><img src="images/${language.flag2.src}" alt="${language.flag2.alt[lang]}" width="27" height="18" class="flag-swap-second"></span>${language.name[lang]} (`);
                expect(fs.existsSync(path.join(root, 'images', language.flag2.src))).toBe(true);
            }
            for (const language of languages.filter(other => !other.flag2)) expect(html).toContain(`<h3><img src="images/${language.flag}" alt="${language.countryAlt[lang]}" width="27" height="18" class="mr-2 align-middle">${language.name[lang]} (`);
        });
    }
});
