const { test, expect } = require('@playwright/test');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const resume = require(path.join(root, '_data', 'resume.json'));
const skills = require(path.join(root, '_data', 'skills.json'));
const tools = require(path.join(root, '_data', 'tools.json'));
const languages = require(path.join(root, '_data', 'languages.json'));

// Renders the resume include, its own includes read from _includes, with the experiences and the education given
function render(lang, experiences = resume.experiences, education = resume.education) {
    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(root, '_includes')), { autoescape: true });
    return env.render('index-resume.html', { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, resume: { ...resume, experiences, education }, skills, tools, languages, profile: { xp: 5 } });
}

// The experiences only, the education above them sharing their markup
const experiences = html => [...html.slice(html.indexOf('id="experiences"'), html.indexOf('id="skills"')).matchAll(/<div class="resume-wrap d-flex ftco-animate( is-first)?( is-current)?">/g)].map(match => Boolean(match[2]));

// What stands before the name of a skill chip: the logo of a technology, an emoji, or an icon
function chipMark(skill) {
    if (skill.image) return `<img src="images/${skill.image}.png" alt="" width="14" height="14" loading="lazy">`;
    if (skill.emoji) return `<span class="skill-emoji" aria-hidden="true">${skill.emoji}</span>`;
    return `<span class="${skill.icon}" aria-hidden="true"></span>`;
}

test.describe('resume timeline', () => {
    test('shows each sector of an experience after its own icon, apart from its standards', () => {
        for (const lang of ['en', 'fr']) {
            const html = render(lang);
            const sectors = resume.experiences.flatMap(e => e.sector ?? []);
            expect(sectors.length).toBeGreaterThan(0);
            for (const sector of sectors) {
                // Its icon from sectorIcons, by its English name
                const icon = resume.sectorIcons[sector.en ?? sector];
                expect(icon).toMatch(/^icon-/);
                const text = (sector[lang] ?? sector).replaceAll('&', '&amp;').replaceAll("'", '&#39;');
                expect(html).toContain(`<span class="sector-tag"><i class="${icon}" aria-hidden="true"></i>${text}</span>`);
            }
            expect(html).not.toMatch(/<span class="standard-tag"><i /);
        }
    });

    test('marks the first experience, the one whose frame is closed above it', () => {
        const html = render('en');
        const section = html.slice(html.indexOf('id="experiences"'), html.indexOf('id="skills"'));
        expect(section.match(/ is-first/g)).toHaveLength(1);
        expect(section.indexOf(' is-first')).toBe(section.indexOf('class="resume-wrap') + 'class="resume-wrap d-flex ftco-animate'.length);
    });

    test('marks the first education, the one whose frame is closed above it', () => {
        const html = render('en');
        const section = html.slice(html.indexOf('id="education"'), html.indexOf('id="experiences"'));
        expect(section.match(/ is-first/g)).toHaveLength(1);
        expect(section.indexOf(' is-first')).toBe(section.indexOf('class="resume-wrap') + 'class="resume-wrap d-flex ftco-animate'.length);
    });

    for (const lang of ['en', 'fr']) {
        test(`marks only the job held today as current on the ${lang} page`, () => {
            expect(experiences(render(lang))).toEqual(resume.experiences.map(experience => Boolean(experience.current)));
            const marked = resume.experiences.map((experience, index) => ({ ...experience, current: index === 0 }));
            expect(experiences(render(lang, marked))).toEqual(marked.map((_, index) => index === 0));
        });

        test(`folds the missions of an experience that has some, each section under its label in a fixed order, and shows no toggle for the others, on the ${lang} page`, () => {
            const details = {
                en: { projects: [{ label: 'Rewrite', href: '#esh', text: 'legacy' }], mission: 'Build it', responsibilities: [{ label: 'First', text: 'one' }, 'Second', { label: 'Linked only', href: '/en/blog#a' }, { label: 'Elsewhere', href: 'https://example.com', text: 'away' }] },
                fr: { projects: [{ label: 'Refonte', href: '#esh', text: 'legacy' }], mission: 'Le construire', responsibilities: [{ label: 'Première', text: 'une' }, 'Deuxième', { label: 'Lien seul', href: '/fr/blog#a' }, { label: 'Ailleurs', href: 'https://example.com', text: 'loin' }] }
            };
            const html = render(lang, [{ ...resume.experiences[0], details, skillIcons: undefined }, { ...resume.experiences[1], details: undefined }]).replaceAll(/>\s+</g, '><');
            const label = key => `<p class="resume-details-label">${resume[lang].detailSections[key].replaceAll('&', '&amp;')}</p>`;
            // A line is a plain text, or its label in bold (linked when it has an href), the separator of the language, then its text
            const line = item => (typeof item === 'string' ? item : `<strong>${item.href ? `<a href="${item.href}"${item.href.startsWith('https://') ? ' target="_blank" rel="noopener"' : ''}>${item.label}</a>` : item.label}</strong>${item.text ? `${lang === 'fr' ? ' : ' : ': '}${item.text}` : ''}`);
            const list = lines => `<ul>${lines.map(item => `<li>${line(item)}</li>`).join('')}</ul>`;
            const { mission, responsibilities, projects } = details[lang];
            expect(html).toContain(`<details class="resume-details"><summary><i class="icon-search" aria-hidden="true"></i> ${resume[lang].moreToggle}</summary>${label('missionAlone')}<p>${mission}</p>${label('responsibilities')}${list(responsibilities)}${label('projectsAlone')}<p>${line(projects[0])}</p></details>`);
            expect(html.slice(html.indexOf('id="experiences"')).match(/class="resume-details"/g)).toHaveLength(1);
        });

        test(`shows the skills of an experience that has skillIcons under its summary, each behind its icon, and none elsewhere, on the ${lang} page`, () => {
            const html = render(lang).replaceAll(/>\s+</g, '><');
            const withIcons = resume.experiences.filter(experience => experience.skillIcons);
            expect(withIcons).toEqual(resume.experiences);
            for (const experience of withIcons) {
                const summary = experience.details[lang].mission ?? experience.details[lang].field;
                const chips = experience.skillIcons.map(skill => `<li>${chipMark(skill)} ${skill.label[lang].replaceAll("'", '&#39;')}</li>`).join('');
                expect(html).toContain(`<p>${summary.replaceAll("'", '&#39;')}</p><ul class="skill-icons">${chips}</ul>`);
            }
            expect(html.match(/class="skill-icons"/g)).toHaveLength(withIcons.length);
        });

        test(`folds the school projects of an education that has some, each with its repository when it has one, its problem and its tools, and shows no toggle for the others, on the ${lang} page`, () => {
            const projects = [
                { name: 'Linked', href: 'https://github.com/example/linked', problem: { en: 'Why?', fr: "Pourquoi l'école ?" }, desc: { en: 'Because.', fr: 'Parce que.' }, techs: ['Python'] },
                { name: 'Unlinked', problem: { en: 'How?', fr: 'Comment ?' }, desc: { en: 'Like this.', fr: 'Ainsi.' }, techs: ['Java', 'SQL'] }
            ];
            const withFixture = resume.education.map((item, index) => (index === 0 ? { ...item, projects } : item));
            const html = render(lang, resume.experiences, withFixture).replaceAll(/>\s+</g, '><');
            const section = html.slice(html.indexOf('id="education"'), html.indexOf('id="experiences"'));
            const withProjects = withFixture.filter(item => item.projects);
            expect(withProjects).toHaveLength(1);
            expect(render(lang).match(/<summary>[^<]*<\/summary><div class="school-projects">/g)).toBeNull();
            for (const education of withProjects) {
                const cards = education.projects.map(project => `<article class="school-project">${project.href ? `<a class="school-project-title" href="${project.href}" target="_blank" rel="noopener">${project.name} <i class="icon-github" aria-hidden="true"></i></a>` : `<span class="school-project-title">${project.name}</span>`}<p><em>${project.problem[lang].replaceAll("'", '&#39;')}</em> ${project.desc[lang].replaceAll("'", '&#39;')}</p>${project.techs.map(tech => `<span class="school-project-tech">${tech}</span>`).join('')}</article>`).join('');
                expect(section).toContain(`<details class="resume-details"><summary><i class="icon-search" aria-hidden="true"></i> ${resume[lang].moreToggle}</summary><div class="school-projects">${cards}</div></details>`);
            }
            expect(section.match(/class="resume-details"/g)).toHaveLength(withProjects.length);
        });
    }
});
