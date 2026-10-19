// The preview build of the site into .eleventy/, done once before the specs that read the built pages (the Built project of playwright.config.js depends on it), so no two of them build at the same time; ELEVENTY_PREVIEW leaves the page sources alone.
const { test } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');

test('builds the preview of the site', () => {
    execFileSync(process.execPath, [path.join(root, 'node_modules', '@11ty', 'eleventy', 'cmd.cjs')], { cwd: root, env: { ...process.env, ELEVENTY_PREVIEW: '1' }, stdio: 'pipe' });
});
