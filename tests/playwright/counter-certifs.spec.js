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
    env.addFilter('workYears', require('../../work-years'));
    return env.renderString(template, { page: { fileSlug: `index_${lang}` }, siteLanguages: { default: 'en' }, viewport: 'desktop', counter, resume, profile }).replaceAll(/>\s+</g, '><');
}

const escapeHtml = text => text.replaceAll("'", '&#39;');

test.describe('counters that turn over', () => {
    test('lists as many certifications as the count shows, each certificate a public file and each logo an image', () => {
        expect(counter.certifList).toHaveLength(profile.certifsCount);
        for (const certif of counter.certifList) {
            expect(certif.href).toMatch(/^\/docs\/public\//);
            expect(fs.existsSync(path.join(root, decodeURIComponent(certif.href)))).toBe(true);
            expect(fs.existsSync(path.join(root, 'images', 'certifs', `${certif.logo}.png`))).toBe(true);
        }
    });

    test('lists the work experiences of the count: the permanent jobs and internships of the resume, each logo an image', () => {
        const shown = resume.experiences.filter(experience => experience.type !== 'other');
        expect(shown).toHaveLength(profile.experiencesCount);
        for (const experience of shown) expect(fs.existsSync(path.join(root, 'images', 'companies', `${experience.logo}.png`))).toBe(true);
    });

    for (const lang of ['en', 'fr']) {
        test(`turns the work experiences count over to each company, its contracts and its years on the ${lang} page`, () => {
            const html = render(lang);
            expect(html).toContain(`aria-label="${escapeHtml(counter[lang].experiencesToggle)}" data-icons="icon-question-circle icon-close">`);
            const [, list] = [...html.matchAll(/<ul class="counter-list">(.*?)<\/ul>/g)].map(match => match[1]);
            const items = [...list.matchAll(/<li data-filter="[^"]+"><img src="images\/companies\/([^"]+)\.png" alt="" width="16" height="16" loading="lazy" class="counter-logo"><a href="([^"]+)"[^>]*>([^<]+)<\/a> · <span class="counter-by">([^<]+)<\/span> · <span class="counter-details">([^<]+)<\/span><\/li>/g)].map(match => match.slice(1));
            const shown = resume.experiences.filter(experience => experience.type !== 'other');
            expect(items.map(([logo]) => logo)).toEqual(shown.map(experience => experience.logo));
            expect(items.map(([, , company]) => company)).toEqual(shown.map(experience => experience.company));
            // Each company, then its role and its years after a middle dot each, its contracts left to the filter
            expect(items.map(([, , , role]) => role)).toEqual(shown.map(experience => experience.title[lang].replaceAll('&', '&amp;')));
            for (const [, , , , years] of items) expect(years).toMatch(/^\d{4}(–\d{4})?$/);
            // A job started in December counts from the next year: ChapsVision (December 2025 - August 2026) and Astek (December 2024 - August 2025)
            expect(items.find(([, , company]) => company === 'ChapsVision')[4]).toBe('2026');
            expect(items.find(([, , company]) => company === 'Astek')[4]).toBe('2025');
            // Above the list, the filter of the contracts with the number of experiences of each, a job of two contracts in both; each item names its contracts
            const types = experience => [experience.type].flat();
            const filter = `<div class="counter-filter" role="group" aria-label="${escapeHtml(counter[lang].experiencesFilterLabel)}"><button type="button" data-filter="" aria-pressed="true">${counter[lang].filterAll} (${shown.length})</button>${counter[lang].experiencesFilter.map(key => `<button type="button" data-filter="${key}" aria-pressed="false">${resume[lang].types[key]} (${shown.filter(experience => types(experience).includes(key)).length})</button>`).join('')}</div>`;
            expect(html).toContain(`${filter}<ul class="counter-list">`);
            expect([...list.matchAll(/<li data-filter="([^"]+)">/g)].map(match => match[1])).toEqual(shown.map(experience => types(experience).join(' ')));
        });
    }

    for (const lang of ['en', 'fr']) {
        test(`turns the count over from its question mark to the list of certifications on the ${lang} page`, () => {
            const html = render(lang);
            expect(html).toContain(`<button type="button" class="soft-card-toggle" aria-expanded="false" aria-label="${escapeHtml(counter[lang].certifsToggle)}" data-icons="icon-question-circle icon-close"><i class="icon-question-circle" aria-hidden="true"></i></button>`);
            expect(html).toContain(`<strong id="certifs-count" class="number" data-number="${profile.certifsCount}">0</strong>`);
            // The spaces between the name, its issuer and its details are gone with the whitespace render() collapses between tags
            const level = certif => (certif.level ? `<button type="button" class="counter-level" data-bs-toggle="tooltip" data-container="body" data-boundary="window" title="${escapeHtml(certif.levelTip[lang])}">${certif.level[lang]}</button> · ` : '');
            const items = counter.certifList.map(certif => `<li data-filter="${certif.category}"><img src="images/certifs/${certif.logo}.png" alt="" width="16" height="16" loading="lazy" class="counter-logo"><a href="${certif.href}" target="_blank" rel="noopener">${certif.name[lang]}</a><span class="counter-by">[${certif.by}]</span><span class="counter-details">${certif.score ? `${certif.score} · ` : ''}${level(certif)}${certif.date}</span></li>`).join('');
            // Above the list, a filter of the subjects with the number of certifications of each
            const filter = `<div class="counter-filter" role="group" aria-label="${escapeHtml(counter[lang].certifsFilterLabel)}"><button type="button" data-filter="" aria-pressed="true">${counter[lang].filterAll} (${counter.certifList.length})</button>${Object.entries(counter[lang].certifCategories).map(([key, label]) => `<button type="button" data-filter="${key}" aria-pressed="false">${label} (${counter.certifList.filter(certif => certif.category === key).length})</button>`).join('')}</div>`;
            expect(html).toContain(`<div class="soft-card-face soft-card-back" aria-hidden="true" inert>${filter}<ul class="counter-list">${items}</ul></div>`);
            for (const certif of counter.certifList) expect(counter[lang].certifCategories[certif.category]).toBeTruthy();
        });
    }

    test('shows a flag for each visited country of the count, each flag an image and each continent named in every language', () => {
        expect(counter.countryList).toHaveLength(profile.countriesCount);
        for (const country of counter.countryList) {
            expect(fs.existsSync(path.join(root, 'images', 'flags', `${country.flag}.svg`))).toBe(true);
            for (const lang of ['en', 'fr']) expect(counter[lang].continents[country.continent]).toBeTruthy();
        }
    });

    for (const lang of ['en', 'fr']) {
        test(`turns the visited countries count over to the flags only, under a filter of their continents, on the ${lang} page`, () => {
            const html = render(lang);
            const filter = `<div class="counter-filter counter-filter-grid" role="group" aria-label="${escapeHtml(counter[lang].continentsLabel)}"><button type="button" data-filter="" aria-pressed="true">${counter[lang].filterAll} (${counter.countryList.length})</button>${Object.entries(counter[lang].continents).map(([key, label]) => `<button type="button" data-filter="${key}" aria-pressed="false">${label} (${counter.countryList.filter(country => country.continent === key).length})</button>`).join('')}</div>`;
            const flags = counter.countryList.map(country => `<li data-filter="${country.continent}"><img src="images/flags/${country.flag}.svg" alt="${escapeHtml(country.name[lang])}" data-bs-toggle="tooltip" data-container="body" data-boundary="window" title="${escapeHtml(country.name[lang])}" width="30" height="20" loading="lazy"></li>`).join('');
            expect(html).toContain(`aria-label="${escapeHtml(counter[lang].countriesToggle)}" data-icons="icon-question-circle icon-close">`);
            expect(html).toContain(`<div class="soft-card-face soft-card-back" aria-hidden="true" inert>${filter}<ul class="counter-flags">${flags}</ul></div>`);
        });
    }
});
