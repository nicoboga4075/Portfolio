// The HTML transform of .eleventy.js, run on every rendered page: tested without a browser, since html-minifier-next is an ES module only, which Jest cannot import without --experimental-vm-modules
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { htmlMode, formatHtml } = require('../../.eleventy');

const root = path.join(__dirname, '..', '..');
const page = '<!DOCTYPE html>\n<html lang="en">\n<head><title>Home</title></head>\n<body>\n<!-- A note for developers -->\n<nav>\n    <a href="#about">About</a> <a href="https://example.com" target="_blank" rel="noopener">Link</a>\n</nav>\n</body>\n</html>\n';
// The construct of _includes/index-resume.html that broke netlify-plugin-minify-html: a {% if %} between two attributes, holding a quote and a slash
const partial = `<a href="{{ line.href }}"{% if line.href.startsWith('https://') %} target="_blank" rel="noopener"{% endif %}>{{ line.label }}</a>`;

test.describe('format-html', () => {
    test('minifies on the Netlify production build and on the preview builds of the tests', () => {
        expect(htmlMode({ CONTEXT: 'production' })).toBe('minify');
        expect(htmlMode({ ELEVENTY_PREVIEW: '1' })).toBe('minify');
        expect(htmlMode({ ELEVENTY_PREVIEW: '1', ELEVENTY_OUTPUT: 'reports/cypress/site' })).toBe('minify');
    });

    test('formats with Prettier under npm run dev, on the in-place build of the CI and on the other Netlify contexts', () => {
        expect(htmlMode({ ELEVENTY_PREVIEW: '1', ELEVENTY_DEV: '1' })).toBe('prettify');
        expect(htmlMode({ CONTEXT: 'production', ELEVENTY_PREVIEW: '1', ELEVENTY_DEV: '1' })).toBe('prettify');
        expect(htmlMode({})).toBe('prettify');
        expect(htmlMode({ CONTEXT: 'deploy-preview' })).toBe('prettify');
        expect(htmlMode({ CONTEXT: 'branch-deploy' })).toBe('prettify');
    });

    test('npm run dev builds with ELEVENTY_DEV, once and under watch', () => {
        const devWatch = fs.readFileSync(path.join(root, 'dev-watch.js'), 'utf8');
        expect(devWatch).toContain("const previewEnv = { ELEVENTY_PREVIEW: '1', ELEVENTY_DEV: '1' };");
        expect(devWatch).toContain('runStep(eleventyCli, [], previewEnv)');
        expect(devWatch).toContain("run(eleventyCli, ['--watch', '--incremental'], previewEnv, 'pipe')");
        expect(devWatch).not.toMatch(/eleventyCli, [^\n]*\{ ELEVENTY_PREVIEW/);
    });

    test('minifies a rendered page: comments dropped, whitespace and attributes kept', async () => {
        const html = await formatHtml(page, 'index_en.html', 'minify');
        expect(html).not.toContain('<!--');
        expect(html).not.toContain('A note for developers');
        expect(html).toContain('<a href="#about">About</a> <a href="https://example.com" target="_blank" rel="noopener">Link</a>');
        expect(html).toContain('\n');
    });

    test('formats a page with Prettier outside production, its comments kept', async () => {
        const html = await formatHtml(page, 'index_en.html', 'prettify');
        expect(html).toContain('<!-- A note for developers -->');
        expect(html).toMatch(/\n {4}<body>\n {8}<!-- A note/);
    });

    test('leaves a file that is not a page untouched', async () => {
        for (const mode of ['minify', 'prettify']) {
            expect(await formatHtml('<!-- kept -->', 'sitemap.xml', mode)).toBe('<!-- kept -->');
            expect(await formatHtml('<!-- kept -->', false, mode)).toBe('<!-- kept -->');
        }
    });

    test('keeps a page it cannot parse as rendered, with a warning naming the page', async () => {
        const warnings = [];
        const warn = console.warn;
        console.warn = message => warnings.push(message);
        try {
            expect(await formatHtml(partial, 'resume.html', 'minify')).toBe(partial);
            expect(await formatHtml(partial, 'resume.html', 'prettify')).toBe(partial);
        } finally {
            console.warn = warn;
        }
        expect(warnings[0]).toMatch(/^Minify failed on resume\.html: /);
        expect(warnings[1]).toMatch(/^Prettier failed on resume\.html: /);
    });

    test('is the transform of the Eleventy config, and netlify.toml no longer minifies every *.html of the publish folder', () => {
        expect(fs.readFileSync(path.join(root, '.eleventy.js'), 'utf8')).toContain('formatHtml(content, outputPath, htmlMode(process.env))');
        expect(fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8')).not.toMatch(/^\s*package = "netlify-plugin-minify-html"/m);
    });
});
