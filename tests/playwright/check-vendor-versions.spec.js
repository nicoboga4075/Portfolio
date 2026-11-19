// .github/scripts/check-vendor-versions.mjs: run without a browser in a temporary folder, with a manifest of made-up libraries and a fetch answering from a preload file.
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..', '..');
const dirs = [];

// The report the script writes when the registries answer with these bodies (a body of null answers HTTP 500), for these manifest entries.
function report(manifest, answers) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vendor-versions-'));
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, 'scripts'));
    fs.copyFileSync(path.join(root, '.github', 'scripts', 'check-vendor-versions.mjs'), path.join(dir, 'scripts', 'check-vendor-versions.mjs'));
    fs.writeFileSync(path.join(dir, 'vendor-versions.json'), JSON.stringify(manifest));
    fs.writeFileSync(path.join(dir, 'preload.mjs'), `const answers = ${JSON.stringify(answers)};
globalThis.fetch = async url => {
    const key = Object.keys(answers).find(name => String(url).includes(name));
    const body = answers[key];
    return { ok: body !== null, status: body === null ? 500 : 200, json: async () => body };
};
`);
    execFileSync(process.execPath, ['--import', pathToFileURL(path.join(dir, 'preload.mjs')).href, path.join(dir, 'scripts', 'check-vendor-versions.mjs')], { cwd: dir, stdio: 'pipe' });
    return fs.readFileSync(path.join(dir, 'vendor-report.md'), 'utf8');
}

const npm = (name, version) => ({ name, file: `js/${name}.js`, source: 'npm', npm: name, version });
const github = (name, repo, version) => ({ name, file: `js/${name}.js`, source: 'github', repo, version });

test.describe('check-vendor-versions', () => {
    test.afterAll(() => {
        for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
    });

    test('lists a library with a newer release in its major and a newer major', () => {
        const text = report([npm('alpha', '1.0.0')], {
            'registry.npmjs.org/alpha': { 'dist-tags': { latest: '2.0.0' }, versions: { '1.0.0': {}, '1.2.0': {}, '1.3.0-beta.1': {}, '2.0.0': {} } }
        });
        expect(text).toContain('### Updates available');
        expect(text).toContain('| alpha | `js/alpha.js` | 1.0.0 | 1.2.0 | 2.0.0 |');
    });

    test('does not list an up to date library', () => {
        const text = report([npm('alpha', '1.0.0')], {
            'registry.npmjs.org/alpha': { 'dist-tags': { latest: '1.0.0' }, versions: { '1.0.0': {} } }
        });
        expect(text).not.toContain('### Updates available');
    });

    test('lists a library of unknown version with its latest', () => {
        const text = report([npm('alpha', null)], {
            'registry.npmjs.org/alpha': { 'dist-tags': { latest: '3.1.0' }, versions: { '3.1.0': {} } }
        });
        expect(text).toContain('| alpha | `js/alpha.js` | 3.1.0 |');
    });

    test('falls back to no latest version when the npm answer lacks dist-tags and versions', () => {
        const text = report([npm('alpha', null)], { 'registry.npmjs.org/alpha': {} });
        expect(text).toContain('| alpha | `js/alpha.js` | null |');
        expect(text).not.toContain('### Check failed');
    });

    test('falls back to no version when the npm answer lacks versions', () => {
        const text = report([npm('alpha', '1.0.0')], { 'registry.npmjs.org/alpha': { 'dist-tags': { latest: '1.0.0' } } });
        expect(text).not.toContain('### Updates available');
        expect(text).not.toContain('### Check failed');
    });

    test('skips the GitHub tags without a name', () => {
        const text = report([github('beta', 'org/beta', '1.0.0')], {
            'repos/org/beta/tags': [{}, { name: 'v1.1.0' }, { name: 'v1.0.0' }]
        });
        expect(text).toContain('| beta | `js/beta.js` | 1.0.0 | 1.1.0 | 1.1.0 |');
    });

    test('falls back to no version when GitHub does not answer with a list', () => {
        const text = report([github('beta', 'org/beta', null)], { 'repos/org/beta/tags': { message: 'rate limit' } });
        expect(text).toContain('| beta | `js/beta.js` | null |');
        expect(text).not.toContain('### Check failed');
    });

    test('reports a failed request without aborting the others', () => {
        const text = report([npm('alpha', '1.0.0'), npm('gamma', '1.0.0')], {
            'registry.npmjs.org/alpha': null,
            'registry.npmjs.org/gamma': { 'dist-tags': { latest: '1.1.0' }, versions: { '1.0.0': {}, '1.1.0': {} } }
        });
        expect(text).toContain('- alpha: npm registry HTTP 500');
        expect(text).toContain('| gamma | `js/gamma.js` | 1.0.0 | 1.1.0 | 1.1.0 |');
    });
});
