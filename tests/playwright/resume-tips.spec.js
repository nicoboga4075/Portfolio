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

        test(`gives an education with a tip a question mark after its title, its tooltip holding the tip and the link of tipHref, and the others none, on the ${lang} page`, () => {
            const html = section(render(lang).replaceAll(/>\s+</g, '><'), 'education', 'experiences');
            const tipped = resume.education.filter(education => education.tip);
            expect(tipped.some(education => education.tipHref)).toBe(true);
            for (const education of tipped) {
                const title = escapeHtml(education.title[lang]);
                const profile = escapeHtml(resume[lang].jobProfile);
                const link = education.tipHref ? ` <a href="${education.tipHref}" target="_blank" rel="noopener" data-bs-toggle="tooltip" data-container="body" title="${profile}" aria-label="${profile}"><i class="icon-briefcase" aria-hidden="true"></i></a>` : '';
                expect(html).toContain(`<h2>${title} <span class="info-tip-wrap"><button type="button" class="info-tip" aria-label="${title}${colonOf(lang)} ${resume[lang].educationDetails}"><i class="icon-question-circle" aria-hidden="true"></i></button><span class="info-tip-box"><span class="info-tip-line">${escapeHtml(education.tip[lang])}${link}</span>${education.tipResults ? `<span class="info-tip-line">${escapeHtml(education.tipResults[lang])}</span>` : ''}</span></span></h2>`);
            }
            expect(html.match(/class="info-tip"/g)).toHaveLength(tipped.length);
            for (const education of resume.education.filter(other => !other.tip)) expect(html).toContain(`<h2>${escapeHtml(education.title[lang])}</h2>`);
        });
    }
});
