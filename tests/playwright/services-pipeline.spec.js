const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'index-services.html'), 'utf8');
const services = require(path.join(root, '_data', 'services.json'));
// The steps in the order they show, those of a group (CI, CD) and the branches out of CD in their place
const steps = services.pipeline.flatMap(item => item.steps ?? item.branches ?? (item.link ? [] : [item]));
const branches = services.pipeline.filter(item => item.branches);
const groups = services.pipeline.filter(item => item.steps);

// Renders the services include alone, the way Eleventy gives it its data
function render(fileSlug, data = services) {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, { page: { fileSlug }, siteLanguages: { default: 'en' }, siteUrl: 'https://example.com', services: data });
}

test.describe('services delivery pipeline', () => {
    for (const lang of ['en', 'fr']) {
        test(`lists every step in order on the ${lang} page`, () => {
            const html = render(`index_${lang}`);
            const escape = text => text.replaceAll('&', '&amp;').replaceAll("'", '&#39;');
            expect(html).toContain(`<p class="mb-3">${escape(services[lang].pipelineHeading)}</p>`);
            const titles = [...html.matchAll(/<span class="pipeline-title">([^<]*)<\/span>/g)].map(match => match[1]);
            expect(titles).toEqual(steps.map(step => escape(step.title[lang])));
            for (const step of steps) expect(html).toContain(`<i class="${step.icon}"></i>`);
        });

        test(`shows the badge of a step above its circle on the ${lang} page`, () => {
            const html = render(`index_${lang}`);
            const badged = steps.filter(step => step.badge);
            expect(badged.length).toBeGreaterThan(0);
            for (const step of badged) {
                expect(html).toContain(`<span class="pipeline-badge"><img src="${step.badge.logo}" alt="" width="14" height="14" loading="lazy">${step.badge.label[lang].replaceAll("'", '&#39;')}</span>`);
            }
            expect(html.match(/ has-badge"/g)).toHaveLength(badged.length);
        });

        test(`puts the steps of a group in its own list under its label on the ${lang} page`, () => {
            const html = render(`index_${lang}`);
            expect(groups.length).toBeGreaterThan(0);
            expect(html.match(/<li class="pipeline-group">/g)).toHaveLength(groups.length);
            const lists = [...html.matchAll(/<ol class="pipeline-substeps">([\s\S]*?)<\/ol>/g)].map(match => (match[1].match(/class="pipeline-step/g) ?? []).length);
            expect(lists).toEqual(groups.map(group => group.steps.length));
            for (const group of groups) {
                expect(html).toContain(`<strong>${group.title[lang]}</strong>`);
                for (const chip of group.chips) {
                    const icon = chip.icon ? `<i class="${chip.icon}" aria-hidden="true"></i>` : '';
                    const logo = chip.logo ? `<img src="${chip.logo}" alt="" width="12" height="12" loading="lazy">` : icon;
                    expect(html).toContain(`<span class="pipeline-chip">${logo}${chip.label[lang].replaceAll("'", '&#39;')}</span>`);
                }
            }
        });

        test(`lists under the steps of a box what it stands on, each item with its icon and system on the ${lang} page`, () => {
            const html = render(`index_${lang}`);
            const footed = groups.filter(group => group.footer);
            expect(footed.length).toBeGreaterThan(0);
            expect(html.match(/<span class="pipeline-footer">/g)).toHaveLength(footed.length);
            for (const entry of footed.flatMap(group => group.footer)) {
                const os = entry.os ? ` · <i class="${entry.os.icon}" aria-hidden="true"></i>${entry.os.name}` : '';
                expect(html).toContain(`<span class="pipeline-footer-item"><i class="${entry.icon} pipeline-footer-icon" aria-hidden="true"></i>${entry.label[lang]}${os}</span>`);
            }
        });

        test(`puts the webhook between the CI and CD boxes on the ${lang} page`, () => {
            const html = render(`index_${lang}`).replaceAll(/>\s+</g, '><');
            const index = services.pipeline.findIndex(item => item.link);
            expect(services.pipeline[index - 1].title.en).toBe('CI');
            expect(services.pipeline[index + 1].title.en).toBe('CD');
            const { icon, label, caption } = services.pipeline[index].link;
            const [link] = html.match(/<li class="pipeline-link">[\s\S]*?<\/li>/);
            expect(link).toContain(`<span class="pipeline-link-pill"><i class="${icon}" aria-hidden="true"></i>${label[lang]}</span>`);
            // The heartbeat on the line: a trace, and the beat that runs along it on its halo, the same path
            expect(link).toMatch(/<svg class="pipeline-ecg"[^>]*aria-hidden="true"><path class="pipeline-ecg-trace" d="([^"]+)"[^>]*><path class="pipeline-beat-halo" d="\1"[^>]*><path class="pipeline-beat" d="\1"/);
            expect(link).toContain(`<span class="pipeline-link-caption">${caption[lang]}</span>`);
            expect(html.indexOf('class="pipeline-link"')).toBeLessThan(html.indexOf(`<strong>CD</strong>`));
        });

        test(`puts what the deploy gives out in its own list of branches, at the end, on the ${lang} page`, () => {
            const html = render(`index_${lang}`);
            expect(branches).toHaveLength(1);
            const [list] = [...html.matchAll(/<ol class="pipeline-branches">([\s\S]*?)<\/ol>/g)].map(match => match[1]);
            const titles = [...list.matchAll(/<span class="pipeline-title">([^<]*)<\/span>/g)].map(match => match[1]);
            expect(titles).toEqual(branches[0].branches.map(step => step.title[lang]));
            expect(services.pipeline.at(-1)).toBe(branches[0]);
            // The beat of the fork: one path per branch, from where the line meets the trunk, up or down it to the circle of the branch, then along its arrow to the base of the arrowhead
            const count = branches[0].branches.length;
            const forks = [...html.matchAll(/<path class="pipeline-beat" d="([^"]+)"/g)].map(match => match[1]).slice(1);
            expect(forks).toEqual(branches[0].branches.map((_, index) => `M9 ${28 + (count - 1) * 56} V${28 + index * 112} H42`));
            expect(html).toContain(`<svg class="pipeline-fork" viewBox="0 0 56 ${count * 112 - 16}" width="56" height="${count * 112 - 16}" aria-hidden="true">`);
        });

        test(`lists the tools of a step each after its logo, a single one as text, on the ${lang} page`, () => {
            const html = render(`index_${lang}`).replaceAll(/>\s+</g, '><');
            // The logo of a tool: an image of images/, or else an icon of the icon font
            const logo = name => {
                const source = services.toolLogos[name];
                expect(source).toBeTruthy();
                return source.startsWith('images/') ? `<img class="pipeline-tool-logo" src="${source}" alt="" width="14" height="14" loading="lazy">` : `<i class="${source} pipeline-tool-logo" aria-hidden="true"></i>`;
            };
            // The tools of a step, or of each kind of a step that sorts them
            for (const tools of steps.flatMap(step => step.groups ? step.groups.map(group => group.detail[lang]) : [step.detail[lang]])) {
                // A single reader to subscribe with is a link to its subscription to the feed of the page language
                const single = tools[0].subscribe
                    ? `<a class="pipeline-detail" href="${tools[0].subscribe}${encodeURIComponent(`feed/https://example.com/feed_${lang}.xml`)}" target="_blank" rel="noopener">${logo(tools[0].name)}${tools[0].name}</a>`
                    : `<span class="pipeline-detail">${logo(tools[0])}${tools[0]}</span>`;
                const markup = tools.length > 1 ? tools.map(tool => `<li class="pipeline-tool">${logo(tool)}${tool}</li>`).join('') : single;
                expect(html).toContain(markup);
            }
        });

        test(`sorts the tools of a step into kinds, each under its label, on the ${lang} page`, () => {
            const html = render(`index_${lang}`).replaceAll(/>\s+</g, '><');
            const grouped = steps.filter(step => step.groups);
            expect(grouped.length).toBeGreaterThan(0);
            expect(html.match(/<div class="pipeline-detail pipeline-tool-groups">/g)).toHaveLength(grouped.length);
            for (const group of grouped.flatMap(step => step.groups)) {
                expect(html).toContain(`<div class="pipeline-tool-group"><span class="pipeline-tool-group-label">${group.label[lang]}</span>`);
            }
        });

        test(`a card with a subtitle shows it under its title on the ${lang} page`, () => {
            const html = render(`index_${lang}`);
            const details = services.cards.filter(card => card.subtitle).map(card => `<p class="services-subtitle">${card.subtitle[lang]}</p>`);
            expect(details.length).toBeGreaterThan(0);
            for (const detail of details) expect(html).toContain(detail);
            expect(html.match(/class="services-subtitle"/g)).toHaveLength(details.length);
        });

        test(`the CV review button scrolls to the booking on the ${lang} page`, () => {
            const escape = text => text.replaceAll("'", '&#39;');
            expect(render(`index_${lang}`)).toContain(`href="/${lang}#contact-section">${escape(services[lang].cvReviewCta)}</a>`);
        });

        test(`shows no CV review button when its text is missing or empty on the ${lang} page`, () => {
            for (const cvReviewCta of [undefined, '']) {
                const html = render(`index_${lang}`, { ...services, [lang]: { ...services[lang], cvReviewCta } });
                expect(html).not.toContain('#contact-section');
            }
        });
    }
});
