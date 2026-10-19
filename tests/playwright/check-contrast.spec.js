// The WCAG contrast checker (check-contrast.mjs), as a black box on what is cheap: --list prints the pages a run would check, and the filters and their errors, without crawling.
const { test, expect } = require('@playwright/test');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const script = path.join(root, '.claude', 'skills', 'wcag-contrast', 'check-contrast.mjs');
const { locales } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).config;
const langs = Object.keys(locales);
const articles = JSON.parse(fs.readFileSync(path.join(root, '_data', 'articles.json'), 'utf8'));

// Runs the script with --no-build, so nothing is rebuilt and the sources stay untouched.
function run(...args) {
    const result = spawnSync(process.execPath, [script, '--no-build', ...args], { cwd: root, encoding: 'utf8', timeout: 120000 });
    return { status: result.status, out: result.stdout, err: result.stderr };
}

test('--list prints the pages, sizes and themes without checking anything', () => {
    const { status, out } = run('--list');
    expect(status).toBe(0);
    expect(out).toMatch(/^\d+ page\(s\) × 4 size\(s\) × 2 theme\(s\): /);
    for (const lang of langs) {
        expect(out).toContain(` /${lang} `);
        expect(out).toContain(`/${lang}/blog#${articles[0].slug}`);
    }
});

test('--only keeps the pages whose url contains the text', () => {
    const lang = langs[0];
    const { status, out } = run('--list', `--only=${lang}/blog`);
    expect(status).toBe(0);
    const urls = out.split(': ')[1].trim().split(' ');
    expect(urls[0]).toBe(`/${lang}/blog`);
    expect(urls.length).toBe(articles.length + 1);
    urls.forEach(url => expect(url).toContain(`/${lang}/blog`));
});

test('--sizes and --modes narrow the sizes and the themes', () => {
    const { out } = run('--list', '--sizes=phone,tablet', '--modes=dark', `--pages=/${langs[0]}`);
    expect(out).toMatch(/^1 page\(s\) × 2 size\(s\) × 1 theme\(s\): /);
});

test('--pages keeps only the exact urls', () => {
    const [first, second] = langs;
    const { out } = run('--list', `--pages=/${first},/${second}/blog`);
    expect(out).toMatch(/^2 page\(s\)/);
    expect(out.trim().endsWith(`/${first} /${second}/blog`) || out.trim().endsWith(`/${second}/blog /${first}`)).toBe(true);
});

test('a filter that matches no page exits with 2', () => {
    const { status, err } = run('--list', '--only=no-such-page-anywhere');
    expect(status).toBe(2);
    expect(err).toContain('No page to check matching "no-such-page-anywhere"');
});
