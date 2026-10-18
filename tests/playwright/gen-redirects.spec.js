// gen-redirects.js, which writes _redirects from config of package.json: run without a browser in a temporary folder, on made-up routes, then on the real ones.
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const dirs = [];

// The _redirects gen-redirects.js writes next to a package.json with these routes, the root pages of these sections, project cards with these explore targets and a js/ folder with these files, as its lines.
function generate(routes, { sections = [], explore = [], jsFiles = [] } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-redirects-'));
    dirs.push(dir);
    for (const folder of ['js', '_data', 'projects']) fs.mkdirSync(path.join(dir, folder));
    for (const name of ['index', ...sections]) fs.writeFileSync(path.join(dir, `${name}_${routes.defaultLang}.html`), '');
    for (const file of jsFiles) fs.writeFileSync(path.join(dir, 'js', file), '');
    fs.copyFileSync(path.join(root, 'gen-redirects.js'), path.join(dir, 'gen-redirects.js'));
    fs.copyFileSync(path.join(root, 'projects', 'resolve-projects.js'), path.join(dir, 'projects', 'resolve-projects.js'));
    fs.copyFileSync(path.join(root, 'resolve-sections.js'), path.join(dir, 'resolve-sections.js'));
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ config: routes }));
    fs.writeFileSync(path.join(dir, '_data', 'projects.json'), JSON.stringify({ cards: explore.map(target => ({ explore: target })) }));
    execFileSync(process.execPath, [path.join(dir, 'gen-redirects.js')], { stdio: 'pipe' });
    return fs.readFileSync(path.join(dir, '_redirects'), 'utf8').split('\n');
}

const routes = { locales: { en: 'en-US', fr: 'fr-FR' }, defaultLang: 'fr' };
const sections = ['blog'];
// A project with its own page, one opening an article, one an address: only the first gets its pretty URL
const explore = ['demo', 'blog#mcs', 'https://example.com'];

test.describe('gen-redirects', () => {
    // A pure Node test: one browser project is enough.
    test.skip(({ browserName }) => browserName !== 'chromium');

    test.afterAll(() => {
        for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
    });

    test('sends / to the default language', () => {
        expect(generate(routes, { sections, explore })).toContain('/ /fr 301!');
    });

    test('rewrites the pretty urls of every language, section and project', () => {
        const lines = generate(routes, { sections, explore });
        for (const rule of ['/en /index_en.html 200', '/fr /index_fr.html 200', '/en/blog /blog_en.html 200', '/fr/blog /blog_fr.html 200', '/en/demo /projects/demo_en.html 200', '/fr/demo /projects/demo_fr.html 200']) {
            expect(lines).toContain(rule);
        }
        expect(lines.filter(line => line.endsWith(' 200') && !line.startsWith('#') && !line.startsWith('/docs/public/'))).toHaveLength(6);
    });

    test('hides the source pages of the home and of each section', () => {
        const lines = generate(routes, { sections, explore });
        expect(lines).toContain('/index_* /404.html 404!');
        expect(lines).toContain('/blog_* /404.html 404!');
    });

    test('keeps /docs/public reachable before /docs is blocked', () => {
        const lines = generate(routes, { sections, explore });
        expect(lines.indexOf('/docs/public/* /docs/public/:splat 200')).toBeLessThan(lines.indexOf('/docs/* /404.html 404!'));
    });

    test('blocks the dev scripts at the deploy root', () => {
        const lines = generate(routes, { sections, explore });
        for (const script of ['gen-redirects.js', 'uglify-code.js', 'dev-watch.js', 'update-version.js', 'resolve-sections.js']) {
            expect(lines).toContain(`/${script} /404.html 404!`);
        }
    });

    test('blocks each Jest test of js/, and only them', () => {
        const lines = generate(routes, { sections, explore, jsFiles: ['app.js', 'app.test.js', 'analytics.test.js'] });
        expect(lines).toContain('/js/analytics.test.js /404.html 404!');
        expect(lines).toContain('/js/app.test.js /404.html 404!');
        expect(lines).not.toContain('/js/app.js /404.html 404!');
    });

    test('ends with a single newline', () => {
        const lines = generate(routes, { sections, explore });
        expect(lines.at(-1)).toBe('');
        expect(lines.at(-2)).not.toBe('');
    });

    test('matches the committed _redirects for the real routes', () => {
        const { config: real } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
        const committed = fs.readFileSync(path.join(root, '_redirects'), 'utf8').replaceAll('\r\n', '\n');
        const jsFiles = fs.readdirSync(path.join(root, 'js'));
        const cards = require(path.join(root, '_data', 'projects.json')).cards;
        const realSections = require(path.join(root, 'resolve-sections.js'))(root, real.defaultLang);
        expect(generate(real, { sections: realSections, explore: cards.map(card => card.explore), jsFiles }).join('\n')).toBe(committed);
    });
});
