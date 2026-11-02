const { test, expect } = require('@playwright/test');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const resume = require(path.join(root, '_data', 'resume.json'));
const skills = require(path.join(root, '_data', 'skills.json'));
const tools = require(path.join(root, '_data', 'tools.json'));
const languages = require(path.join(root, '_data', 'languages.json'));

// Renders the resume include, its own includes read from _includes, the way Eleventy gives it its data
function render(lang, data = resume) {
    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(root, '_includes')), { autoescape: true });
    return env.render('index-resume.html', { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, resume: data, skills, tools, languages, profile: { xp: 5 } });
}

const text = (value, lang) => value[lang] ?? value;
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll("'", '&#39;');
const colonOf = lang => (lang === 'fr' ? ' :' : ':');
const button = (name, tip, lang) => `<button type="button" class="resume-tip" data-bs-toggle="tooltip" data-container="body" title="${tip}" aria-label="${name}${colonOf(lang)} ${tip}"><i class="icon-question-circle" aria-hidden="true"></i></button>`;
const section = (html, id, next) => html.slice(html.indexOf(`id="${id}"`), html.indexOf(`id="${next}"`));

test.describe('resume tips', () => {
    for (const lang of ['en', 'fr']) {
        test(`gives an award with a scoreTip a question mark after its score with its tooltip, and the others none, on the ${lang} page`, () => {
            const html = section(render(lang).replaceAll(/>\s+</g, '><'), 'awards', 'never');
            const tipped = resume.awards.filter(award => award.scoreTip);
            expect(tipped.length).toBeGreaterThan(0);
            for (const award of tipped) {
                const score = text(award.score, lang);
                expect(html).toContain(`<span class="position">${score} ${button(score, award.scoreTip[lang], lang)}</span>`);
            }
            expect(html.match(/class="resume-tip"/g)).toHaveLength(tipped.length);
            for (const award of resume.awards.filter(other => !other.scoreTip)) expect(html).toContain(`<span class="position">${text(award.score, lang)}</span>`);
        });

        test(`gives an education with a tip a question mark after its title with its tooltip, and the others none, on the ${lang} page`, () => {
            const html = section(render(lang), 'education', 'experiences');
            const tipped = resume.education.filter(education => education.tip);
            expect(tipped.length).toBeGreaterThan(0);
            for (const education of tipped) expect(html).toContain(`<h2>${escapeHtml(education.title[lang])} ${button(escapeHtml(education.title[lang]), escapeHtml(education.tip[lang]), lang)}</h2>`);
            expect(html.match(/class="resume-tip"/g)).toHaveLength(tipped.length);
            for (const education of resume.education.filter(other => !other.tip)) expect(html).toContain(`<h2>${escapeHtml(education.title[lang])}</h2>`);
        });
    }
});
