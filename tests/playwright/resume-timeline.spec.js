const { test, expect } = require('@playwright/test');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const resume = require(path.join(root, '_data', 'resume.json'));
const skills = require(path.join(root, '_data', 'skills.json'));
const tools = require(path.join(root, '_data', 'tools.json'));
const languages = require(path.join(root, '_data', 'languages.json'));

// Renders the resume include, its own includes read from _includes, with the experiences given
function render(lang, experiences = resume.experiences) {
    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(root, '_includes')), { autoescape: true });
    return env.render('index-resume.html', { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, resume: { ...resume, experiences }, skills, tools, languages, profile: { xp: 5 } });
}

// The experiences only, the education above them sharing their markup
const experiences = html => [...html.slice(html.indexOf('id="experiences"'), html.indexOf('id="skills"')).matchAll(/<div class="resume-wrap d-flex ftco-animate( is-first)?( is-current)?">/g)].map(match => Boolean(match[2]));

test.describe('resume timeline', () => {
    test('marks the first experience, the one whose frame is closed above it', () => {
        const html = render('en');
        const section = html.slice(html.indexOf('id="experiences"'), html.indexOf('id="skills"'));
        expect(section.match(/ is-first/g)).toHaveLength(1);
        expect(section.indexOf(' is-first')).toBe(section.indexOf('class="resume-wrap') + 'class="resume-wrap d-flex ftco-animate'.length);
    });

    for (const lang of ['en', 'fr']) {
        test(`marks only the job held today as current on the ${lang} page`, () => {
            expect(experiences(render(lang))).toEqual(resume.experiences.map(experience => Boolean(experience.current)));
            const marked = resume.experiences.map((experience, index) => ({ ...experience, current: index === 0 }));
            expect(experiences(render(lang, marked))).toEqual(marked.map((_, index) => index === 0));
        });

        test(`folds the missions of an experience that has some, and shows no toggle for the others, on the ${lang} page`, () => {
            const details = { en: ['First mission', 'Second mission'], fr: ['Première mission', 'Deuxième mission'] };
            const html = render(lang, [{ ...resume.experiences[0], details }, resume.experiences[1]]).replaceAll(/>\s+</g, '><');
            expect(html).toContain(`<details class="resume-details"><summary>${resume[lang].detailsToggle}</summary><ul>${details[lang].map(detail => `<li>${detail}</li>`).join('')}</ul></details>`);
            expect(html.match(/class="resume-details"/g)).toHaveLength(1);
        });
    }
});
