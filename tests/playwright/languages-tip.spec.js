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

test.describe('spoken languages', () => {
    for (const lang of ['en', 'fr']) {
        test(`gives a language with details a question mark and their tooltip, each certificate linked, and the others none, on the ${lang} page`, () => {
            const html = render(lang).replaceAll(/>\s+</g, '><');
            const colon = lang === 'fr' ? ' :' : ':';
            const detailed = languages.filter(language => language.details);
            expect(detailed.length).toBeGreaterThan(0);
            for (const language of detailed) {
                const lines = language.details.map(detail => `<span class="language-tip-line">${detail.doc ? `<a href="/docs/public/${encodeURIComponent(detail.doc)}" target="_blank" rel="noopener">${escapeHtml(detail.name[lang])}</a>` : ''}${detail.text[lang]}</span>`).join('');
                expect(html).toContain(`${language.name[lang]} (${language.level[lang]}) <span class="language-tip-wrap"><button type="button" class="language-tip" aria-label="${language.name[lang]}${colon} ${resume[lang].languageDetails}"><i class="icon-question-circle" aria-hidden="true"></i></button><span class="language-tip-box">${lines}</span></span></h3>`);
                for (const { doc } of language.details.filter(detail => detail.doc)) expect(fs.existsSync(path.join(root, 'docs', 'public', doc))).toBe(true);
            }
            expect(html.match(/class="language-tip"/g)).toHaveLength(detailed.length);
            for (const language of languages.filter(other => !other.details)) expect(html).toContain(`${language.name[lang]} (${language.level[lang]})</h3>`);
        });
    }
});
