const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'index-counter.html'), 'utf8');
const counter = require(path.join(root, '_data', 'counter.json'));
const resume = require(path.join(root, '_data', 'resume.json'));
const { profile } = require(path.join(root, 'package.json')).config;

// Renders the counter include alone, the way Eleventy gives it its data on the desktop build
function render(lang) {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, viewport: 'desktop', counter, resume, profile }).replaceAll(/>\s+</g, '><');
}

const escapeHtml = text => text.replaceAll("'", '&#39;');

test.describe('counters that turn over', () => {
    test('lists as many certifications as the count shows, each certificate a public file', () => {
        expect(counter.certifList).toHaveLength(profile.certifsCount);
        for (const certif of counter.certifList) {
            expect(certif.href).toMatch(/^\/docs\/public\//);
            expect(fs.existsSync(path.join(root, decodeURIComponent(certif.href)))).toBe(true);
        }
    });

    test('lists the work experiences of the count: the permanent jobs and internships of the resume', () => {
        expect(resume.experiences.filter(experience => experience.type !== 'other')).toHaveLength(profile.experiencesCount);
    });

    for (const lang of ['en', 'fr']) {
        test(`turns the work experiences count over to each company, its contracts and its years on the ${lang} page`, () => {
            const html = render(lang);
            expect(html).toContain(`aria-label="${escapeHtml(counter[lang].experiencesToggle)}" data-icons="icon-question-circle icon-close">`);
            const [, list] = [...html.matchAll(/<ul class="counter-list">(.*?)<\/ul>/g)].map(match => match[1]);
            const items = [...list.matchAll(/<li><a href="([^"]+)"[^>]*>([^<]+)<\/a><span class="counter-by">\[([^\]]+)\]<\/span><span class="counter-details">([^<]+)<\/span><\/li>/g)].map(match => match.slice(1));
            const shown = resume.experiences.filter(experience => experience.type !== 'other');
            expect(items.map(([, company]) => company)).toEqual(shown.map(experience => experience.company));
            expect(items.find(([, company]) => company === 'Soft Concept')[2]).toBe(['internship', 'permanent'].map(type => resume[lang].types[type]).join(', '));
            for (const [, , , years] of items) expect(years).toMatch(/^\d{4}(–\d{4})?$/);
        });
    }

    for (const lang of ['en', 'fr']) {
        test(`turns the count over from its question mark to the list of certifications on the ${lang} page`, () => {
            const html = render(lang);
            expect(html).toContain(`<button type="button" class="soft-card-toggle" aria-expanded="false" aria-label="${escapeHtml(counter[lang].certifsToggle)}" data-icons="icon-question-circle icon-close"><i class="icon-question-circle" aria-hidden="true"></i></button>`);
            expect(html).toContain(`<strong id="certifs-count" class="number" data-number="${profile.certifsCount}">0</strong>`);
            // The spaces between the name, its issuer and its details are gone with the whitespace render() collapses between tags
            const level = certif => (certif.level ? `<span class="counter-level" tabindex="0" data-bs-toggle="tooltip" data-container="body" data-boundary="window" title="${escapeHtml(certif.levelTip[lang])}">${certif.level[lang]}</span> · ` : '');
            const items = counter.certifList.map(certif => `<li><a href="${certif.href}" target="_blank" rel="noopener">${certif.name[lang]}</a><span class="counter-by">[${certif.by}]</span><span class="counter-details">${certif.score ? `${certif.score} · ` : ''}${level(certif)}${certif.date}</span></li>`).join('');
            expect(html).toContain(`<div class="soft-card-face soft-card-back" aria-hidden="true" inert><ul class="counter-list">${items}</ul></div>`);
        });
    }
});
