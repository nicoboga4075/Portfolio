// Inlines the critical CSS of every built page with beasties, the last step of the Netlify production build (CONTEXT=production): the CSS rules a page uses go into a <style> of its head, and its stylesheets load without blocking the first paint (media="print" switched to all once loaded, a <noscript> link for browsers without JS)
// Run on Netlify only, like the netlify-plugin-inline-critical-css it replaces: the production build writes the pages over their sources, so a local run would bake the inlined CSS into the tracked files; node inline-critical.mjs <dir> runs it on another folder (a preview build), for a check or a test
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Beasties from 'beasties';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ENCODING = 'utf-8';

// The pages Eleventy writes: <name>_<lang>.html and 404.html at the root, the articles and the projects in their folders; never the Nunjucks partials of _includes/ nor the vendored or generated HTML
export function builtPages(dir) {
    const { locales } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), ENCODING)).config;
    const page = new RegExp(`_(${Object.keys(locales).join('|')})\\.html$`);
    const inFolder = folder => {
        const full = path.join(dir, folder);
        return fs.existsSync(full) ? fs.readdirSync(full).filter(name => page.test(name)).map(name => path.join(full, name)) : [];
    };
    const atRoot = fs.readdirSync(dir).filter(name => page.test(name) || name === '404.html').map(name => path.join(dir, name));
    return [...atRoot, ...inFolder('articles'), ...inFolder('projects')];
}

// One page in place; the stylesheets are read from the root of the site, where css/ lives, whatever the <base> of the page
export async function inlinePage(beasties, file) {
    const html = fs.readFileSync(file, ENCODING);
    fs.writeFileSync(file, await beasties.process(html), ENCODING);
}

export async function inlineCritical(dir) {
    const beasties = new Beasties({
        path: dir,
        publicPath: '/',
        // media="print" then onload, the way the plugin loaded them; the CSP allows inline handlers (script-src 'unsafe-inline')
        preload: 'media',
        noscriptFallback: true,
        // The full stylesheets stay as they are: the blog injects articles whose rules the blog page doesn't use, and the theme classes added by the scripts (html.dark-mode) match nothing at build time
        pruneSource: false,
        // Rules of classes the scripts add, which match nothing at build time: the dark theme, set by the inline script of base.njk before the first paint, so a dark page doesn't show light parts while its stylesheets load; the scroll reveal of app.js (ftco-animated and its fadeInUp), without which the hero stays hidden until app.css arrives
        allowRules: [/^html\.dark-mode\b/, '.ftco-animated', '.fadeInUp'],
        inlineFonts: false,
        compress: true,
        logLevel: 'warn'
    });
    const pages = builtPages(dir);
    for (const file of pages) {
        await inlinePage(beasties, file);
    }
    return pages.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const dir = process.argv[2];
    if (!dir && process.env.CONTEXT !== 'production') {
        console.warn('inline-critical: skipped, it runs on the Netlify production build only (or on the folder given)');
    } else {
        const count = await inlineCritical(path.resolve(dir ?? ROOT));
        console.warn(`inline-critical: critical CSS inlined in ${count} pages`);
    }
}
