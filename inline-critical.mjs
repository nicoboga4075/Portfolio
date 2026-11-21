// Inlines the critical CSS of every built page with beasties, the last step of the Netlify production build (CONTEXT=production): the CSS rules a page uses go into a <style> of its head, and its stylesheets load without blocking the first paint (media="print" switched to all once loaded, a <noscript> link for browsers without JS)
// Run on Netlify only, like the netlify-plugin-inline-critical-css it replaces: the production build writes the pages over their sources, so a local run would bake the inlined CSS into the tracked files; node inline-critical.mjs reports/<folder> runs it on a preview build moved there, for a check or a test
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Beasties from 'beasties';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ENCODING = 'utf-8';

// The pages Eleventy writes: <name>_<lang>.html and 404.html at the root, the articles and the projects in their folders; never the Nunjucks partials of _includes/ nor the vendored or generated HTML
export function builtPages(dir) {
    const { locales } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), ENCODING)).config;
    // A suffix test, not a RegExp built from the data
    const endings = Object.keys(locales).map(lang => `_${lang}.html`);
    const isPage = name => endings.some(ending => name.endsWith(ending));
    const inFolder = folder => {
        const full = path.join(dir, folder);
        return fs.existsSync(full) ? fs.readdirSync(full).filter(isPage).map(name => path.join(full, name)) : [];
    };
    const atRoot = fs.readdirSync(dir).filter(name => isPage(name) || name === '404.html').map(name => path.join(dir, name));
    return [...atRoot, ...inFolder('articles'), ...inFolder('projects')];
}

// The @font-face of the local fallbacks of Poppins in css/common.css (src: local(...), sized like Poppins): beasties keeps a @font-face only when an inlined font-family names it, and the site names them through var(--font-family), which it doesn't read; without them the text first shows in an unsized sans-serif, then shifts when Poppins arrives
export function localFontFaces(dir) {
    const file = path.join(dir, 'css', 'common.css');
    if (!fs.existsSync(file)) {
        return '';
    }
    const faces = fs.readFileSync(file, ENCODING).match(/@font-face\s*\{[^}]*\}/g) ?? [];
    return faces.filter(face => face.includes('local(')).map(face => face.replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').replace(/;\}/g, '}')).join('');
}

// One page in place; the stylesheets are read from the root of the site, where css/ lives, whatever the <base> of the page; the local fallback fonts go at the end of its head
export async function inlinePage(beasties, file, fonts = '') {
    const html = await beasties.process(fs.readFileSync(file, ENCODING));
    fs.writeFileSync(file, fonts ? html.replace('</head>', `<style>${fonts}</style></head>`) : html, ENCODING);
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
        // And the selectors of a class or id attribute with a value test ([class^="icon-"], [class*=col-]), which beasties 0.5 wrongly looks up as a whole class name (icon-) and always drops: the base rule of the icon fonts among them, without which no icon glyph nor its @font-face is inlined
        allowRules: [/^html\.dark-mode\b/, '.ftco-animated', '.fadeInUp', /\[(?:class|id)[\^*$|~]=/],
        // The @font-face of the fonts the inlined rules use (the Icomoon and Flaticon icons), or the icons show as empty boxes until their stylesheets load; no font preload, beasties would preload the first source of each @font-face, the .eot that no current browser reads
        inlineFonts: true,
        preloadFonts: false,
        compress: true,
        logLevel: 'warn'
    });
    // Every page at once: each one is read, processed and written on its own
    const pages = builtPages(dir);
    const fonts = localFontFaces(dir);
    await Promise.all(pages.map(file => inlinePage(beasties, file, fonts)));
    return pages.length;
}

// The folder given on the command line: only a folder of reports/ (a preview build moved by ELEVENTY_OUTPUT), as serve-build.mjs accepts it, never a path elsewhere on the disk
export function commandLineFolder(arg) {
    const reports = path.join(ROOT, 'reports');
    const dir = path.resolve(ROOT, arg);
    if (!dir.startsWith(reports + path.sep)) {
        throw new Error(`inline-critical: ${arg} is not a folder of reports/`);
    }
    return dir;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const arg = process.argv[2];
    if (!arg && process.env.CONTEXT !== 'production') {
        console.warn('inline-critical: skipped, it runs on the Netlify production build only (or on the folder of reports/ given)');
    } else {
        const count = await inlineCritical(arg ? commandLineFolder(arg) : ROOT);
        console.warn(`inline-critical: critical CSS inlined in ${count} pages`);
    }
}
