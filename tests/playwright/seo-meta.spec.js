const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const out = path.join(root, '.eleventy');
const pkg = require(path.join(root, 'package.json'));
const resume = require(path.join(root, '_data', 'resume.json'));
const site = pkg.routes.site;

const read = file => fs.readFileSync(path.join(out, file), 'utf8');
// &amp; last, so a "&amp;lt;" in the page stays "&lt;" instead of being decoded twice into "<"
const decode = text => text.replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');

// Every <meta> of the head as [attribute value, content] pairs, keyed by name or property
function metas(html) {
    const head = html.slice(0, html.indexOf('</head>'));
    return [...head.matchAll(/<meta\s+(name|property)="([^"]+)"\s+content="([^"]*)"/g)].map(m => [m[2], decode(m[3])]);
}
const values = (list, key) => list.filter(([k]) => k === key).map(([, v]) => v);
const jsonLd = html => JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);

// No browser here: run in one project only, so the three projects do not build into .eleventy/ at the same time
test.skip(({ browserName }) => browserName !== 'chromium', 'no browser needed');

test.beforeAll(() => {
    // The preview build writes to .eleventy/ and leaves the page sources alone
    execFileSync('npx', ['@11ty/eleventy'], { cwd: root, env: { ...process.env, ELEVENTY_PREVIEW: '1' }, shell: true, stdio: 'pipe' });
});

test.describe('title', () => {
    test('home has no page title: site name and author only', () => {
        const html = read('index_en.html');
        expect(html).toContain(`<title>${pkg.name} - ${pkg.author.name}</title>`);
    });

    test('inner page: site name, page title, author', () => {
        const html = read('articles/mcs_en.html');
        expect(html).toContain(`<title>${pkg.name} - What is a MSC application? - ${pkg.author.name}</title>`);
    });
});

test.describe('head metas', () => {
    test('author, email and twitter card', () => {
        const list = metas(read('index_en.html'));
        expect(values(list, 'author')).toEqual([pkg.author.name]);
        expect(values(list, 'email')).toEqual([pkg.author.email]);
        expect(values(list, 'twitter:card')).toEqual(['summary_large_image']);
    });

    test('home Open Graph tags', () => {
        const list = metas(read('index_en.html'));
        expect(values(list, 'og:site_name')).toEqual([pkg.name]);
        expect(values(list, 'og:title')).toEqual([pkg.name]);
        expect(values(list, 'og:image')).toEqual([`${site}/images/view.png`]);
        expect(values(list, 'og:type')).toEqual(['website']);
        expect(values(list, 'og:url')).toEqual([`${site}/en`]);
        expect(values(list, 'og:description')[0]).toBeTruthy();
        expect(values(list, 'og:locale')).toEqual([pkg.routes.locales.en.replace('-', '_')]);
        expect(values(list, 'og:locale:alternate')).toEqual([pkg.routes.locales.fr.replace('-', '_')]);
        expect(values(list, 'og:image:alt')).toEqual([pkg.name]);
        expect(values(list, 'og:image:type')).toEqual(['image/png']);
        expect(Number(values(list, 'og:image:width')[0])).toBeGreaterThan(0);
        expect(Number(values(list, 'og:image:height')[0])).toBeGreaterThan(0);
        expect(values(list, 'article:published_time')).toEqual([]);
        expect(values(list, 'article:tag')).toEqual([]);
    });

    test('the og:image size is the real size of the PNG', () => {
        const list = metas(read('index_en.html'));
        const png = fs.readFileSync(path.join(root, 'images', 'view.png'));
        expect(values(list, 'og:image:width')).toEqual([String(png.readUInt32BE(16))]);
        expect(values(list, 'og:image:height')).toEqual([String(png.readUInt32BE(20))]);
    });

    test('French page uses its own locale and url', () => {
        const list = metas(read('index_fr.html'));
        expect(values(list, 'og:url')).toEqual([`${site}/fr`]);
        expect(values(list, 'og:locale')).toEqual(['fr_FR']);
        expect(values(list, 'og:locale:alternate')).toEqual(['en_US']);
    });

    test('article Open Graph tags', () => {
        const list = metas(read('articles/mcs_en.html'));
        expect(values(list, 'og:type')).toEqual(['article']);
        expect(values(list, 'og:title')).toEqual(['What is a MSC application?']);
        expect(values(list, 'og:url')).toEqual([`${site}/en/blog#mcs`]);
        expect(values(list, 'article:published_time')).toEqual(['2024-12-23']);
        expect(values(list, 'article:author')).toEqual([`${site}/en`]);
        expect(values(list, 'article:tag')).toEqual(['MCS', 'CyberSecurity', 'Vulnerability', 'REST', 'API', 'OAuth2']);
    });

    test('article tags are translated in French', () => {
        const list = metas(read('articles/mcs_fr.html'));
        expect(values(list, 'article:tag')).toEqual(['MCS', 'Cybersécurité', 'Vulnérabilité', 'REST', 'API', 'OAuth2']);
        expect(values(list, 'article:author')).toEqual([`${site}/fr`]);
    });
});

test.describe('JSON-LD', () => {
    for (const lang of ['en', 'fr']) {
        test(`home alumniOf lists every school of the resume (${lang})`, () => {
            const data = jsonLd(read(`index_${lang}.html`));
            const person = data['@graph'].find(node => node.alumniOf);
            expect(person.alumniOf.map(s => s.name)).toEqual(resume.education.map(s => s.school));
            for (const school of person.alumniOf) {
                expect(school['@type']).toBe('EducationalOrganization');
                expect(school.url).toMatch(/^https?:\/\//);
            }
            const web = data['@graph'].find(node => node['@type'] === 'WebSite');
            expect(web.name).toBe(pkg.name);
        });
    }
});

test.describe('Explore buttons of the project cards', () => {
    const cards = require(path.join(root, '_data', 'projects.json')).cards;
    for (const lang of ['en', 'fr']) {
        test(`open what each card's explore says, in the page's language (${lang})`, () => {
            const hrefs = [...read(`index_${lang}.html`).matchAll(/<a\s+class="explore[^"]*"\s+href="([^"]*)"/g)].map(m => decode(m[1]));
            expect(hrefs).toEqual(cards.map(card => (card.explore.startsWith('https://') ? card.explore : `/${lang}/${card.explore}`)));
        });
    }
});
