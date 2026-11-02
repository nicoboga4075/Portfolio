const { test, expect } = require('@playwright/test');
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

const text = (value, lang) => value[lang] ?? value;

test.describe('awards', () => {
    for (const lang of ['en', 'fr']) {
        test(`gives an award with a scoreTip a question mark after its score with its tooltip, and the others none, on the ${lang} page`, () => {
            const html = render(lang).replaceAll(/>\s+</g, '><');
            const colon = lang === 'fr' ? ' :' : ':';
            const tipped = resume.awards.filter(award => award.scoreTip);
            expect(tipped.length).toBeGreaterThan(0);
            for (const award of tipped) {
                const score = text(award.score, lang);
                const tip = award.scoreTip[lang];
                expect(html).toContain(`<span class="position">${score} <button type="button" class="award-tip" data-bs-toggle="tooltip" data-container="body" title="${tip}" aria-label="${score}${colon} ${tip}"><i class="icon-question-circle" aria-hidden="true"></i></button></span>`);
            }
            expect(html.match(/class="award-tip"/g)).toHaveLength(tipped.length);
            for (const award of resume.awards.filter(other => !other.scoreTip)) expect(html).toContain(`<span class="position">${text(award.score, lang)}</span>`);
        });
    }
});
