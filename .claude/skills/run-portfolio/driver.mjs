#!/usr/bin/env node
// Drives the running portfolio in headless Chromium: opens each page, saves a screenshot, prints its title, h1 and console errors, then switches the home page to French with the language switcher.
// Usage: node .claude/skills/run-portfolio/driver.mjs [path ...] [--base <url>] [--out <dir>] (paths en and en/blog by default, written without their leading slash since Git Bash turns /en into C:/Program Files/Git/en; base http://localhost on the port of [dev] in netlify.toml, screenshots in reports/run)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import toml from 'toml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
// Value after a --flag, removed from the list of paths with it
const option = (name, fallback) => {
    const i = args.indexOf(name);
    return i === -1 ? fallback : args.splice(i, 2)[1];
};
// The site port of npm run dev, where browser-sync serves the pages
const sitePort = toml.parse(fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8')).dev.port;
const BASE = option('--base', `http://localhost:${sitePort}`).replace(/\/$/, '');
const OUT = path.resolve(ROOT, option('--out', 'reports/run'));
const paths = (args.length ? args : ['en', 'en/blog']).map(arg => `/${arg.replace(/^\/+/, '')}`);

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let errors = [];
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', error => errors.push(error.message));
let failed = false;

// Opens or reports the current page: status, title, h1, console errors, screenshot named after its path
async function report(label, response) {
    await page.waitForLoadState('networkidle').catch(() => {});
    const file = path.join(OUT, `${label.replace(/^\/|\/$/g, '').replaceAll('/', '_') || 'root'}.png`);
    await page.screenshot({ path: file });
    const h1 = (await page.locator('h1').first().textContent().catch(() => '')).trim();
    const status = response ? response.status() : '-';
    console.log(`${label} -> ${page.url()} [${status}] title="${await page.title()}" h1="${h1}" errors=${errors.length} screenshot=${path.relative(ROOT, file)}`);
    errors.forEach(error => console.log(`  console error: ${error}`));
    if ((response && !response.ok()) || errors.length) failed = true;
    errors = [];
}

try {
    for (const pagePath of paths) {
        const response = await page.goto(BASE + pagePath, { waitUntil: 'domcontentloaded' });
        await report(pagePath, response);
    }
    // One user flow: the FR link of the language switcher on the English home page
    await page.goto(`${BASE}/en`, { waitUntil: 'domcontentloaded' });
    await Promise.all([page.waitForURL(/\/fr/), page.locator('#language-switcher a[hreflang="fr"]').first().click()]);
    await report('/en-switch-to-fr', null);
    if (await page.locator('html').getAttribute('lang') !== 'fr') {
        console.error('Language switch failed: html lang is not fr');
        failed = true;
    }
} catch (error) {
    console.error(`Driver error: ${error.message}`);
    failed = true;
} finally {
    await browser.close();
}
process.exit(failed ? 1 : 0);
