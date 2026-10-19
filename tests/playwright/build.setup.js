// The preview build of the site into .eleventy/, done once before the specs that read the built pages (the Built project of playwright.config.js depends on it), so no two of them build at the same time; ELEVENTY_PREVIEW leaves the page sources alone.
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const { locales } = require(path.join(root, 'package.json')).config;

test('builds the preview of the site, with the home page of every language written by this build', () => {
    // A page left by an earlier build doesn't count: each home page must be newer than the start of this one
    const start = Date.now() - 1000;
    execFileSync(process.execPath, [path.join(root, 'node_modules', '@11ty', 'eleventy', 'cmd.cjs')], { cwd: root, env: { ...process.env, ELEVENTY_PREVIEW: '1' }, stdio: 'pipe' });
    for (const lang of Object.keys(locales)) expect(fs.statSync(path.join(root, '.eleventy', `index_${lang}.html`)).mtimeMs, `index_${lang}.html`).toBeGreaterThan(start);
});
