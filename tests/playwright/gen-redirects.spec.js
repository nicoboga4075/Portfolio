// gen-redirects.js, which writes _redirects from the routes of package.json: run without a browser in a temporary folder, on made-up routes, then on the real ones.
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const dirs = [];

// The _redirects gen-redirects.js writes next to a package.json with these routes, as its lines.
function generate(routes) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-redirects-'));
    dirs.push(dir);
    fs.copyFileSync(path.join(root, 'gen-redirects.js'), path.join(dir, 'gen-redirects.js'));
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ routes }));
    execFileSync(process.execPath, [path.join(dir, 'gen-redirects.js')], { stdio: 'pipe' });
    return fs.readFileSync(path.join(dir, '_redirects'), 'utf8').split('\n');
}

const routes = { locales: { en: 'en-US', fr: 'fr-FR' }, defaultLang: 'fr', sections: ['blog'], projects: ['demo'] };

test.describe('gen-redirects', () => {
    // A pure Node test: one browser project is enough.
    test.skip(({ browserName }) => browserName !== 'chromium');

    test.afterAll(() => {
        for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
    });

    test('sends / to the default language', () => {
        expect(generate(routes)).toContain('/ /fr 301!');
    });

    test('rewrites the pretty urls of every language, section and project', () => {
        const lines = generate(routes);
        for (const rule of ['/en /index_en.html 200', '/fr /index_fr.html 200', '/en/blog /blog_en.html 200', '/fr/blog /blog_fr.html 200', '/en/demo /projects/demo_en.html 200', '/fr/demo /projects/demo_fr.html 200']) {
            expect(lines).toContain(rule);
        }
        expect(lines.filter(line => line.endsWith(' 200') && !line.startsWith('#') && !line.startsWith('/docs/public/'))).toHaveLength(6);
    });

    test('hides the source pages of the home and of each section', () => {
        const lines = generate(routes);
        expect(lines).toContain('/index_* /404.html 404!');
        expect(lines).toContain('/blog_* /404.html 404!');
    });

    test('keeps /docs/public reachable before /docs is blocked', () => {
        const lines = generate(routes);
        expect(lines.indexOf('/docs/public/* /docs/public/:splat 200')).toBeLessThan(lines.indexOf('/docs/* /404.html 404!'));
    });

    test('blocks the dev scripts at the deploy root', () => {
        const lines = generate(routes);
        for (const script of ['gen-redirects.js', 'uglify-code.js', 'dev-watch.js', 'update-version.js']) {
            expect(lines).toContain(`/${script} /404.html 404!`);
        }
    });

    test('ends with a single newline', () => {
        const lines = generate(routes);
        expect(lines.at(-1)).toBe('');
        expect(lines.at(-2)).not.toBe('');
    });

    test('matches the committed _redirects for the real routes', () => {
        const { routes: real } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
        const committed = fs.readFileSync(path.join(root, '_redirects'), 'utf8').replaceAll('\r\n', '\n');
        expect(generate(real).join('\n')).toBe(committed);
    });
});
