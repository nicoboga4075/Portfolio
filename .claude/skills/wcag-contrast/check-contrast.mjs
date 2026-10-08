#!/usr/bin/env node
// WCAG AA contrast check of every built page, in light and dark mode, at phone / tablet / laptop / desktop sizes: text on load, on hover, after
// interactions (opened cards, menus, windows, panels, carousel slides, search suggestions, tooltips), under keyboard focus, plus non-text contrast
// (focus indicators, icon-only controls, field borders).
// Usage: node .claude/skills/wcag-contrast/check-contrast.mjs [--no-build] [--only=<substring>] [--quick] [--json=<file>]
//   --no-build   reuse the current .eleventy output instead of rebuilding it (ELEVENTY_PREVIEW=1, sources untouched)
//   --only=blog  only pages whose URL contains the substring (no leading slash: Git Bash rewrites /en/... into a Windows path)
//   --quick[=<ref>]        only the pages the files changed since <ref> (HEAD by default, untracked files included; A..B between two commits) can show
//   --sizes=phone,tablet   only these sizes (phone, tablet, laptop, desktop)
//   --modes=dark           only this theme (light, dark)
//   --pages=/fr/blog,/en   only these exact URLs (to recheck what failed without redoing the rest)
//   --list       print the pages a run would check, then stop (no browser)
//   --json=f     also write the full report to f
//   --shots=dir  save the before / after shots of each focus indicator failure into dir
// Exit code 1 when anything fails, 0 otherwise.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(ROOT, '.eleventy');
const AXE = require.resolve('axe-core/axe.min.js', { paths: [ROOT] });
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
// Git Bash turns a leading /en/... into C:/Program Files/Git/en/...: keep only the URL part.
if (typeof args.only === 'string') {
    args.only = args.only.replace(/^.*?(?=\/(en|fr)(\/|$))/, '');
}

const VIEWPORTS = [
    { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true },
    { name: 'tablet', width: 768, height: 1024, isMobile: true, hasTouch: true },
    { name: 'laptop', width: 1280, height: 800 },
    { name: 'desktop', width: 1920, height: 1080 }
].filter(v => typeof args.sizes !== 'string' || args.sizes.split(',').includes(v.name));
// Focus and non-text contrast depend on the theme, not on the width: checked at both ends (mobile and desktop navbar).
const FOCUS_VIEWPORTS = new Set(['phone', 'desktop']);
const SCHEMES = ['light', 'dark'].filter(s => typeof args.modes !== 'string' || args.modes.split(',').includes(s));
const CONCURRENCY = 3;

// ---- Build ----
// --list reuses the last build, unless it is incomplete (a dev server stopped mid-build leaves no js/ or css/).
const builtComplete = ['js/app.js', 'css/common.css'].every(f => fs.existsSync(path.join(OUT, f)));
if (!args['no-build'] && (!args.list || !builtComplete)) {
    const eleventy = path.join(ROOT, 'node_modules', '@11ty', 'eleventy', 'cmd.cjs');
    const r = spawnSync(process.execPath, [eleventy], { cwd: ROOT, env: { ...process.env, ELEVENTY_PREVIEW: '1' }, stdio: ['ignore', 'ignore', 'inherit'] });
    if (r.status !== 0) {
        console.error('Eleventy build failed');
        process.exit(2);
    }
}

// ---- Pages, as Netlify serves them ----
// The pretty URLs are the 200 rewrites of _redirects (/en, /fr/blog, /en/panel_mnt...). Articles are never pages of their own (/articles/* is
// a 404): the blog loads them into itself from /.netlify/functions/article, so each one is checked as /<lang>/blog#<slug>.
const rewrites = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split(/\r?\n/)
    .map(line => line.match(/^(\/(?:en|fr)(?:\/[\w-]+)?)\s+\/(\S+\.html)\s+200\b/))
    .filter(Boolean)
    .map(([, url, file]) => ({ url, file }));
const blogs = rewrites.filter(p => /^\/(en|fr)\/blog$/.test(p.url));
const articles = JSON.parse(fs.readFileSync(path.join(ROOT, '_data', 'articles.json'), 'utf8'))
    .flatMap(({ slug }) => blogs.map(blog => ({ url: `${blog.url}#${slug}`, file: blog.file, article: `${slug}_${blog.url.slice(1, 3)}.html` })));
const changed = args.quick ? pagesForChanges() : null;
const pages = [...rewrites, ...articles]
    .filter(p => !changed || changed.reaches(p))
    .filter(p => !args.only || p.url.includes(args.only))
    .filter(p => typeof args.pages !== 'string' || args.pages.split(',').map(u => u.replace(/^.*?(?=\/(en|fr)(\/|#|$))/, '')).includes(p.url))
    .sort((a, b) => a.url.localeCompare(b.url));
if (changed) {
    console.log(`Changed since ${changed.ref}: ${changed.report.join('; ') || 'nothing'}`);
    if (!pages.length) {
        console.log('No page can show these changes: nothing to check.');
        process.exit(0);
    }
}
if (!pages.length) {
    const filter = args.only ? ` matching "${args.only}"` : '';
    console.error(`No page to check${filter}`);
    process.exit(2);
}
// --quick[=<ref>]: the files changed since <ref> (HEAD by default, untracked ones included), mapped to the pages that can show them.
function pagesForChanges() {
    const ref = typeof args.quick === 'string' ? args.quick : 'HEAD';
    const git = gitArgs => (spawnSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8' }).stdout ?? '').split(/\r?\n/).filter(Boolean);
    // A range (A..B) compares two commits; a single ref compares it with the working tree, untracked files included.
    const untracked = ref.includes('..') ? [] : git(['ls-files', '--others', '--exclude-standard']);
    const files = [...new Set([...git(['diff', '--name-only', ref]), ...untracked])];
    const list = dir => { try { return fs.readdirSync(path.join(ROOT, dir)).filter(f => /\.(html|njk)$/.test(f)).map(f => (dir === '.' ? f : `${dir}/${f}`)); } catch { return []; } };
    const templates = ['.', 'articles', 'projects', '_includes'].flatMap(list);
    const rules = [], report = [], reaching = [];
    for (const file of files) {
        const reach = reachOf(file, templates);
        if (!reach) continue;
        rules.push(reach.test);
        report.push(`${file} → ${reach.why}`);
        reaching.push(file);
    }
    // When the only changes that reach a page are stylesheets, the selectors of the changed rules narrow it further (null: check every reached page).
    const sheets = reaching.filter(f => /^css\/(common|app|standalone)\.css$/.test(f));
    const selectors = sheets.length && sheets.length === reaching.length ? sheets.flatMap(f => changedSelectors(ref, f, git)) : null;
    const usable = selectors && !selectors.includes(null) && selectors.length ? selectors : null;
    // Rules all scoped to one theme (html.dark-mode ..., html:not(.dark-mode) ...) only need that theme.
    const scheme = usable?.every(s => s.startsWith('html.dark-mode')) ? 'dark' : usable?.every(s => s.startsWith('html:not(.dark-mode)')) ? 'light' : null;
    return { ref, report, reaches: p => rules.some(test => test(p)), selectors: usable, scheme };
}

// A source file of the site, or '' when it is missing.
function readSource(file) {
    try {
        return fs.readFileSync(path.join(ROOT, file), 'utf8');
    } catch {
        return '';
    }
}

// The groups of pages a change can reach.
function pageScopes() {
    return {
        all: () => true,
        app: p => /^(index|blog)_/.test(p.file),
        standalone: p => Boolean(p.article) || /^(projects\/|policy_|terms_)/.test(p.file),
        articles: p => Boolean(p.article),
    };
}

// The pages a changed file can show on, as { why, test }, or null when it reaches none.
function reachOf(file, templates) {
    const scopes = pageScopes();
    const base = path.basename(file);
    const byPath = [
        [/^(css\/common\.css|js\/common\.js|_data\/|_redirects$|\.eleventy\.js$|_includes\/base\.njk$)/, 'every page', scopes.all],
        [/^(css\/(app|bootstrap\.min)\.css|js\/(app|botpress)\.js)$/, 'home and blog pages (articles included)', scopes.app],
        [/^(css\/standalone\.css|js\/standalone\.js)$/, 'projects, policy, terms and articles', scopes.standalone],
        [/^netlify\/functions\/article\.mts$/, 'articles', scopes.articles],
    ].find(([pattern]) => pattern.test(file));
    if (byPath) return { why: byPath[1], test: byPath[2] };
    if (/^articles\/[\w-]+_[a-z]{2}\.html$/.test(file)) return { why: 'that article', test: p => p.article === base };
    if (file.startsWith('_includes/')) return reachOfInclude(base, templates);
    if (templates.includes(file)) return { why: 'that page', test: p => p.file === file || (p.article && p.file === file) };
    if (/^(images|docs)\//.test(file)) return reachOfImage(base);
    return null;
}

// An include reaches the pages that pull it in, or every page when the layout does.
function reachOfInclude(base, templates) {
    const { sources, all } = sourcesIncluding(base, templates);
    if (all) return { why: 'every page (through the layout)', test: pageScopes().all };
    if (!sources.size) return null;
    return { why: [...sources].join(', '), test: p => sources.has(p.article ? `articles/${p.article}` : p.file) || (p.article && sources.has(p.file)) };
}

// The page sources that pull a template in, through other templates too (by its quoted name: {% include "x.html" %} or an assets: [...] list).
function sourcesIncluding(name, templates) {
    const sources = new Set(), seen = new Set([name]), queue = [name];
    while (queue.length) {
        const current = queue.shift();
        for (const t of templates.filter(t => new RegExp(`["']${current.replaceAll('.', '\.')}["']`).test(readSource(t)))) {
            const base = path.basename(t);
            if (!t.startsWith('_includes/')) sources.add(t);
            else if (!seen.has(base)) { seen.add(base); queue.push(base); }
        }
    }
    return { sources, all: seen.has('base.njk') };
}

// An image reaches the pages that reference it, or every page of a stylesheet that does.
function reachOfImage(base) {
    const scopes = pageScopes();
    const sheets = ['common', 'app', 'standalone'].filter(s => readSource(`css/${s}.css`).includes(base));
    const builtPages = new Set([...rewrites.map(p => p.file), ...articles.map(p => `articles/${p.article}`)].filter(f => readSource(`.eleventy/${f}`).includes(base)));
    if (sheets.includes('common')) return { why: 'every page (common.css)', test: scopes.all };
    if (!sheets.length && !builtPages.size) return null;
    return { why: [...sheets.map(s => `${s}.css`), ...builtPages].join(', '), test: p => (sheets.includes('app') && scopes.app(p)) || (sheets.includes('standalone') && scopes.standalone(p)) || builtPages.has(p.article ? `articles/${p.article}` : p.file) };
}

// The selectors of the rules a stylesheet's diff touches, on either side of it (null for a change outside any rule: a variable, an @-rule line).
function changedSelectors(ref, file, git) {
    const [from, to] = ref.split('..');
    const show = rev => {
        const r = spawnSync('git', ['show', `${rev}:${file}`], { cwd: ROOT, encoding: 'utf8' });
        return r.status === 0 ? r.stdout : '';
    };
    const oldRules = ruleByLine(show(from).replace(/\r\n/g, '\n'));
    const newRules = ruleByLine((to === undefined ? fs.readFileSync(path.join(ROOT, file), 'utf8') : show(to || 'HEAD')).replace(/\r\n/g, '\n'));
    const headers = new Set();
    for (const hunk of git(['diff', '-U0', ref, '--', file]).filter(l => l.startsWith('@@'))) {
        const [, oldStart, oldCount = '1', newStart, newCount = '1'] = hunk.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        for (let l = +oldStart; l < +oldStart + +oldCount; l++) if (oldRules[l] !== undefined) headers.add(oldRules[l]);
        for (let l = +newStart; l < +newStart + +newCount; l++) if (newRules[l] !== undefined) headers.add(newRules[l]);
    }
    return [...headers].flatMap(h => (h === null ? [null] : splitSelectorList(h)));
}

// The selectors of a selector list, split on the commas outside parentheses (a, b:is(c, d) → a | b:is(c, d)).
function splitSelectorList(header) {
    const parts = [];
    let depth = 0, start = 0;
    for (let i = 0; i < header.length; i++) {
        if (header[i] === '(') depth++;
        else if (header[i] === ')') depth = Math.max(0, depth - 1);
        else if (header[i] === ',' && depth === 0) { parts.push(header.slice(start, i)); start = i + 1; }
    }
    parts.push(header.slice(start));
    return parts.map(s => s.trim()).filter(Boolean);
}

// The selector of the rule each line of a stylesheet belongs to, by line number.
function ruleByLine(text) {
    const state = { rules: [], stack: [], buf: '', line: 1, start: 1, comment: false, content: false, closing: undefined };
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        i = readCssChar(state, text, i);
        if (ch === '\n' || i === text.length - 1) endCssLine(state, ch);
    }
    return state.rules;
}

// Reads the character at i, and returns the index of the last character it used (a comment delimiter uses two).
function readCssChar(state, text, i) {
    const ch = text[i];
    const opensComment = ch === '/' && text[i + 1] === '*';
    if (!state.comment && ch.trim() && !opensComment) state.content = true;
    if (state.comment) {
        if (ch !== '*' || text[i + 1] !== '/') return i;
        state.comment = false;
        return i + 1;
    }
    if (opensComment) {
        state.comment = true;
        return i + 1;
    }
    readCssCode(state, ch);
    return i;
}

// A character of CSS outside comments: opens or closes a block, ends a declaration, or adds to the selector or declaration being read.
function readCssCode(state, ch) {
    if (ch === '{') {
        const header = state.buf.trim();
        state.stack.push(header);
        if (!header.startsWith('@')) for (let l = state.start; l <= state.line; l++) state.rules[l] = header;
        state.buf = '';
    } else if (ch === '}') {
        const closed = state.stack.pop();
        if (closed && !closed.startsWith('@')) state.closing = closed;
        state.buf = '';
    } else if (ch === ';') {
        state.buf = '';
    } else if (ch !== '\n') {
        if (!state.buf.trim() && ch.trim()) state.start = state.line;
        state.buf += ch;
    }
}

// Blank and comment-only lines change nothing; a line of CSS outside any rule (an @-rule, a top-level statement) is unknown (null).
function endCssLine(state, ch) {
    const inner = state.stack.findLast(h => !h.startsWith('@'));
    if (state.content) state.rules[state.line] ??= inner ?? state.closing ?? null;
    if (ch !== '\n') return;
    state.line++;
    state.content = false;
    state.closing = undefined;
    if (state.buf.trim()) state.buf += ' ';
}

// Which of the changed selectors match something on a page once its scripts ran (hover, focus and theme qualifiers dropped).
async function matchSelectors(browser, pageInfo, selectors) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    try {
        await page.goto(BASE + pageInfo.url, { waitUntil: 'load', timeout: 60000 });
        await page.waitForTimeout(1200);
        // An article that did not load proves nothing: keep the page (the catch below).
        if (pageInfo.article) {
            await page.waitForFunction(() => document.querySelector('#article-shape')?.childElementCount, null, { timeout: 15000 });
            await page.waitForTimeout(800);
        }
        return await page.evaluate(list => {
            const isCombinator = c => /[\s>+~]/.test(c ?? '');
            // The selector without its last class, attribute or pseudo-class (a.b.active → a.b), or null when nothing but a combinator precedes it.
            const withoutState = s => {
                let at;
                if (s.endsWith(']')) {
                    at = s.lastIndexOf('[');
                    if (at < 0 || s.indexOf(']', at) !== s.length - 1) return null;
                } else {
                    const end = s.endsWith(')') ? s.lastIndexOf('(') : s.length;
                    if (end < 0 || (end < s.length && s.indexOf(')', end) !== s.length - 1)) return null;
                    at = end;
                    while (at > 0 && /[\w-]/.test(s[at - 1])) at--;
                    // A class or a pseudo-class needs a name; only a pseudo-class takes arguments.
                    if (at === end || !(s[at - 1] === ':' || (s[at - 1] === '.' && end === s.length))) return null;
                    at--;
                }
                const prefix = s.slice(0, at);
                return prefix && !isCombinator(prefix.at(-1)) ? prefix : null;
            };
            // Where the last combinator outside parentheses starts (a > b:not(c d) → 1), or -1 when there is none.
            const lastCombinator = s => {
                let depth = 0, at = -1;
                for (let i = 0; i < s.length; i++) {
                    if (s[i] === '(') depth++;
                    else if (s[i] === ')') depth = Math.max(0, depth - 1);
                    else if (depth === 0 && isCombinator(s[i]) && !isCombinator(s[i - 1])) at = i;
                }
                return at;
            };
            return list.map(sel => {
                // Elements the page only builds on interaction: matched through what declares them.
                const built = { '.tooltip': '[data-bs-toggle="tooltip"]' };
                let bare = sel.replace(/:not\(\.dark-mode\)|\.dark-mode/g, '').replace(/::?(before|after|placeholder|marker|selection|first-line|first-letter|-webkit-[\w-]+|-moz-[\w-]+)\b/g, '')
                    .replace(/:(hover|focus-visible|focus-within|focus|active|visited|target)\b/g, '').trim();
                bare = Object.entries(built).reduce((s, [from, to]) => (s.startsWith(from) ? to : s), bare);
                // Not there on load: drop a state class set later (.scrolled, .active), then try the nearest ancestor (a list item added on typing), stopping before html / body, which every page has.
                while (bare && !/^(html|body|:root|\*)$/i.test(bare)) {
                    try {
                        if (document.querySelector(bare)) return true;
                    } catch {
                        return true;
                    }
                    const state = withoutState(bare);
                    const cut = lastCombinator(bare);
                    if (state) bare = state;
                    else bare = cut > 0 ? bare.slice(0, cut).trim() : '';
                }
                return false;
            });
        }, selectors);
    } catch {
        return selectors.map(() => true);
    } finally {
        await context.close();
    }
}

// ---- Static server: the _redirects rewrites, the article function, no CSP ----
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf' };
const byUrl = new Map(rewrites.map(p => [p.url, p.file]));
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'https://x');
    const pathname = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/';
    let file = byUrl.get(pathname) ?? pathname.slice(1);
    if (pathname === '/.netlify/functions/article') {
        const name = url.searchParams.get('filename') ?? '';
        file = /^[\w-]+_[a-z]{2}\.html$/.test(name) ? `articles/${name}` : '';
    }
    const full = path.join(OUT, file);
    if (!file || !full.startsWith(OUT + path.sep)) {
        res.writeHead(404).end();
        return;
    }
    fs.readFile(full, (err, data) => {
        if (err) {
            res.writeHead(404).end();
            return;
        }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(full).toLowerCase()] ?? 'application/octet-stream' }).end(data);
    });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// ---- Helpers ----
const pause = (page, ms = 150) => page.waitForTimeout(ms);
// Centred rather than just on screen: at the very top, the fixed navbar would cover the element (its ring, its pixels).
// Instant: the site scrolls smoothly (scroll-behavior: smooth), and a box measured mid-scroll puts the shot next to the element.
const centre = el => el.evaluate(e => e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })).catch(() => {});

// Shows everything a visitor would eventually see: scroll-triggered reveals, lazy images, no loader, no transitions.
async function prepare(page) {
    // .ftco-animate only reaches opacity 1 through its fadeInUp animation, so with animations off it is forced visible.
    // [data-contrast-hide] makes an element's text and icons transparent while keeping its background, for measureBehind().
    await page.addStyleTag({ content: `*, *::before, *::after { transition: none !important; animation: none !important; }
        .ftco-animate { opacity: 1 !important; visibility: visible !important; transform: none !important; }
        [data-contrast-hide], [data-contrast-hide] *, [data-contrast-hide]::before, [data-contrast-hide]::after, [data-contrast-hide] *::before, [data-contrast-hide] *::after {
            color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; fill: transparent !important; stroke: transparent !important;
        }` });
    await page.evaluate(async () => {
        // jQuery animations (fadeIn of the search suggestions...) aren't CSS: switch them off too, or a check lands mid-fade.
        if (window.jQuery) {
            window.jQuery.fx.off = true;
        }
        // Pending timers too: the hero's typed text rebuilds its element every few hundred ms and the carousels autoplay. Timers set later
        // (by the interactions below) still run.
        const last = setTimeout(() => {}, 0);
        for (let id = 0; id <= last; id++) {
            clearTimeout(id);
            clearInterval(id);
        }
        document.getElementById('ftco-loader')?.remove();
        document.querySelectorAll('.ftco-animate').forEach(e => e.classList.add('ftco-animated', 'fadeInUp'));
        for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) {
            scrollTo(0, y);
            await new Promise(r => setTimeout(r, 40));
        }
        scrollTo(0, 0);
        document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
        await Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 5000); })));
        await document.fonts.ready;
    });
    await page.waitForTimeout(600);
}

// Decodes PNG shots in the page and compares them pixel by pixel with one of the measures below, named by `measure`
// (the measures are written here rather than passed as source, so nothing is ever evaluated from a string).
function comparePixels(page, shots, measure, extra) {
    return page.evaluate(async ({ b64s, measure, extra }) => {
        const read = async b64 => {
            const img = new Image();
            img.src = `data:image/png;base64,${b64}`;
            await img.decode();
            const c = document.createElement('canvas');
            c.width = img.width;
            c.height = img.height;
            const g = c.getContext('2d', { willReadFrequently: true });
            g.drawImage(img, 0, 0);
            return g.getImageData(0, 0, c.width, c.height);
        };
        const images = await Promise.all(b64s.map(read));
        const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        const rgb = colour => {
            probe.fillStyle = '#000';
            probe.fillStyle = colour;
            probe.fillRect(0, 0, 1, 1);
            return probe.getImageData(0, 0, 1, 1).data;
        };
        const lum = (r, g, b) => [r, g, b].map(v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
        const ratio = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const measures = {
            // Text over an image: the worst ratio between the text colour and what is behind its glyphs (shots: with text, without, with again).
            behindText() {
                const [withText, behind, again] = images.map(i => i.data);
                const fg = rgb(extra.colour), lf = lum(fg[0], fg[1], fg[2]);
                let worst = Infinity, glyphs = 0;
                for (let i = 0; i < behind.length; i += 4) {
                    const changed = Math.max(...[0, 1, 2].map(k => Math.abs(withText[i + k] - behind[i + k])));
                    const offColour = Math.max(...[0, 1, 2].map(k => Math.abs(withText[i + k] - fg[k])));
                    const moved = Math.max(...[0, 1, 2].map(k => Math.abs(withText[i + k] - again[i + k])));
                    if (changed < 40 || offColour > 48 || moved > 8) continue;
                    glyphs++;
                    worst = Math.min(worst, ratio(lf, lum(behind[i], behind[i + 1], behind[i + 2])));
                }
                return glyphs >= 5 ? worst : null;
            },
            // Focus indicator: how many pixels change on focus, and how many of them reach 3:1 against what they covered (shots: before, after).
            focusChange() {
                const [a, b] = images.map(i => i.data);
                let changed = 0, strong = 0;
                for (let i = 0; i < a.length; i += 4) {
                    if (Math.max(...[0, 1, 2].map(k => Math.abs(a[i + k] - b[i + k]))) < 24) continue;
                    changed++;
                    if (ratio(lum(a[i], a[i + 1], a[i + 2]), lum(b[i], b[i + 1], b[i + 2])) >= 3) strong++;
                }
                return { changed, strong };
            },
        };
        return measures[measure]();
    }, { b64s: shots.map(s => s.toString('base64')), measure, extra });
}

function clipFor(page, box, margin = 0) {
    const vp = page.viewportSize();
    const x = Math.max(0, box.x - margin), y = Math.max(0, box.y - margin);
    const width = Math.min(vp.width, box.x + box.width + margin) - x, height = Math.min(vp.height, box.y + box.height + margin) - y;
    return width >= 1 && height >= 1 ? { x, y, width, height } : null;
}

// Worst contrast between an element's colour and the pixels right behind its glyphs, for what axe can't decide (text over images, gradients,
// overlays) and for icons. Shots with the element shown, hidden, then shown again: glyph pixels change when it is hidden, are close to its colour
// and are the same in both shown shots (anything that moves in between, like typed text, doesn't count). Nothing visible: null.
async function measureBehind(page, target, { need } = {}) {
    const el = typeof target === 'string' ? page.locator(target).first() : target;
    if (!(await el.count()) || !(await el.isVisible())) {
        return null;
    }
    await centre(el);
    const box = await el.boundingBox();
    const clip = box && clipFor(page, box);
    if (!clip) {
        return null;
    }
    const info = await el.evaluate(e => {
        const s = getComputedStyle(e);
        const colour = e instanceof SVGElement && s.fill && s.fill !== 'none' && !s.fill.startsWith('url') ? s.fill : s.color;
        return { colour, size: Number.parseFloat(s.fontSize), weight: Number.parseInt(s.fontWeight, 10) || 400 };
    });
    // Transparent text rather than a hidden element: an element that paints its own background (a tooltip, a badge) keeps it.
    const shown = await page.screenshot({ clip });
    await el.evaluate(e => { e.dataset.contrastHide = ''; });
    const hidden = await page.screenshot({ clip });
    await el.evaluate(e => { delete e.dataset.contrastHide; });
    const shownAgain = await page.screenshot({ clip });
    const ratio = await comparePixels(page, [shown, hidden, shownAgain], 'behindText', { colour: info.colour });
    if (ratio === null) {
        return null;
    }
    const large = info.size >= 24 || (info.size >= 18.66 && info.weight >= 700);
    return { ratio, need: need ?? (large ? 3 : 4.5), colour: info.colour };
}

// axe color-contrast on a scope, plus the pixel measure of what it leaves undecided.
async function auditScope(page, scope, kind, where, failures) {
    const result = await page.evaluate(sel => axe.run(sel ? { include: [[sel]] } : document, { runOnly: ['color-contrast'], resultTypes: ['violations', 'incomplete'] }), scope);
    for (const node of result.violations.flatMap(v => v.nodes)) {
        const d = node.any[0]?.data ?? {};
        failures.push({ ...where, kind, target: node.target.join(' '), html: node.html, fg: d.fgColor, bg: d.bgColor, ratio: d.contrastRatio, need: Number.parseFloat(d.expectedContrastRatio) });
    }
    for (const node of result.incomplete.flatMap(v => v.nodes)) {
        const target = node.target.join(' ');
        const m = await measureBehind(page, target).catch(() => null);
        if (m && m.ratio < m.need) {
            failures.push({ ...where, kind: `${kind} (pixels)`, target, html: node.html, fg: m.colour, bg: 'image / overlay', ratio: +m.ratio.toFixed(2), need: m.need });
        }
    }
}

// Marks an element so axe can be scoped to it.
async function mark(el, id) {
    await el.evaluate((e, v) => { e.dataset.contrastProbe = v; }, id);
    return `[data-contrast-probe="${id}"]`;
}

// ---- Hover: every element the site's own stylesheets restyle on :hover ----
// Each selector of a rule with :hover gives its hover target (the part before :hover); up to 4 visible elements per target are hovered and
// checked with what is inside them, so a new hover style is covered without touching this script.
async function hoverTargets(page) {
    return page.evaluate(() => {
        const split = list => {
            const out = [];
            let depth = 0, start = 0;
            for (let i = 0; i < list.length; i++) {
                if (list[i] === '(') depth++;
                else if (list[i] === ')') depth--;
                else if (list[i] === ',' && depth === 0) {
                    out.push(list.slice(start, i));
                    start = i + 1;
                }
            }
            return [...out, list.slice(start)].map(s => s.trim());
        };
        // The element a :hover selector styles (what comes before :hover), or null when there is none to hover.
        const hoverHead = sel => {
            const at = sel.indexOf(':hover');
            if (at < 0) return null;
            let head = sel.slice(0, at);
            // :hover inside :is(...) / :where(...): keep what comes before that pseudo-class.
            // Parentheses still open before :hover (each ( counted, each ) taken off).
            let open = head.split('(').length - head.split(')').length;
            while (open > 0) {
                head = head.slice(0, head.lastIndexOf('(')).replace(/:[\w-]+$/, '');
                open--;
            }
            head = head.replace(/::?[\w-]+$/, '').trim();
            return head && !/[>+~]$/.test(head) ? head : null;
        };
        const targets = new Set();
        const walk = rules => {
            for (const rule of rules) {
                if (rule.cssRules && !rule.selectorText) {
                    walk(rule.cssRules);
                    continue;
                }
                for (const sel of split(rule.selectorText ?? '')) {
                    const head = hoverHead(sel);
                    if (head) targets.add(head);
                }
            }
        };
        for (const sheet of document.styleSheets) {
            try {
                walk(sheet.cssRules);
            } catch {
                // cross-origin stylesheet (fonts): not ours
            }
        }
        return [...targets];
    });
}

async function hoverPass(page, where, failures) {
    let n = 0;
    for (const selector of await hoverTargets(page)) {
        let els;
        try {
            els = await page.locator(selector).filter({ visible: true }).all();
        } catch {
            continue;
        }
        for (const el of els.slice(0, 4)) {
            await centre(el);
            if (!(await el.hover({ timeout: 2000 }).then(() => true).catch(() => false))) {
                continue;
            }
            await pause(page, 60);
            await auditScope(page, await mark(el, `h${n++}`), 'hover', where, failures);
            await page.mouse.move(0, 0);
        }
    }
}

// ---- Interactions: text that only shows after a click or a keystroke ----
// Each one runs only where its trigger exists and is visible, checks what it reveals, then puts the page back.
const INTERACTIONS = [
    {
        name: 'opened cards',
        trigger: '.accordion .card > input[type="checkbox"]',
        scope: '.accordion',
        open: page => page.evaluate(() => document.querySelectorAll('.accordion .card > input[type="checkbox"]').forEach(i => { i.checked = true; })),
        close: page => page.evaluate(() => document.querySelectorAll('.accordion .card > input[type="checkbox"]').forEach(i => { i.checked = false; })),
        anyVisibility: true
    },
    { name: 'mobile menu', trigger: '.navbar-toggler', scope: '#ftco-nav', open: page => page.click('.navbar-toggler'), close: page => page.click('.navbar-toggler') },
    { name: 'contact window', trigger: '#contact-icon', scope: '#contact-window', open: page => page.click('#contact-icon'), close: page => page.click('#contact-icon') },
    { name: 'filter panel', trigger: '#experience-filters-toggle', scope: '#experience-filters', open: page => page.click('#experience-filters-toggle'), close: page => page.click('#experience-filters-toggle') },
    {
        name: 'active filter',
        trigger: '#experience-filters-toggle',
        scope: '#experiences',
        open: async page => {
            await page.click('#experience-filters-toggle');
            await page.locator('.filter-chip').first().click();
        },
        close: async page => {
            await page.click('#experience-filters-reset');
            await page.click('#experience-filters-toggle');
        }
    },
    {
        name: 'search suggestions',
        trigger: 'input[name="search-input"]',
        scope: '#search-suggestions',
        open: page => page.fill('input[name="search-input"]', 'a'),
        close: page => page.fill('input[name="search-input"]', '')
    }
];

async function interactionPass(page, where, failures) {
    await openedComponentsPass(page, where, failures);
    await carouselPass(page, where, failures);
    await tooltipPass(page, where, failures);
}

// Each component of INTERACTIONS: open it, audit what it shows, close it.
async function openedComponentsPass(page, where, failures) {
    for (const it of INTERACTIONS) {
        const trigger = page.locator(it.trigger).first();
        if (!(await trigger.count()) || (!it.anyVisibility && !(await trigger.isVisible()))) {
            continue;
        }
        try {
            await it.open(page);
            await pause(page, 300);
            if (await page.locator(it.scope).first().isVisible()) {
                await auditScope(page, it.scope, `after: ${it.name}`, where, failures);
            }
            await it.close(page);
            await pause(page);
        } catch (error) {
            failures.push({ ...where, kind: 'error', target: it.name, html: String(error.message).split('\n')[0], ratio: 0, need: 0 });
        }
    }
}

// Every slide of every carousel (the carousel section switches between carousels with its .owl-menu tabs).
async function carouselPass(page, where, failures) {
    const menus = await page.locator('.owl-menu').filter({ visible: true }).all();
    for (const menu of menus.length ? menus : [null]) {
        if (menu) {
            await menu.click().catch(() => {});
            await pause(page, 300);
        }
        const dots = await page.locator('.owl-carousel .owl-dot').filter({ visible: true }).all();
        for (const dot of dots) {
            await dot.click().catch(() => {});
            await pause(page, 250);
            await auditScope(page, '.owl-carousel:not(.d-none)', 'after: carousel slide', where, failures);
        }
    }
}

// The first tooltips of the page, one hover each.
async function tooltipPass(page, where, failures) {
    for (const el of (await page.locator('[data-toggle="tooltip"], [data-original-title]').filter({ visible: true }).all()).slice(0, 6)) {
        await el.hover({ timeout: 2000 }).catch(() => {});
        await pause(page, 300);
        if (await page.locator('.tooltip').first().isVisible().catch(() => false)) {
            await auditScope(page, '.tooltip', 'after: tooltip', where, failures);
        }
        await page.mouse.move(0, 0);
    }
}

// ---- Keyboard focus: text under focus, and a visible focus indicator at 3:1 against what it covers ----
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [role="button"]';

async function focusPass(page, where, failures) {
    // One element per kind (tag, classes, type, parent classes): the same rule styles the others.
    const handles = await page.locator(FOCUSABLE).all();
    const seen = new Map();
    let n = 0;
    for (const el of handles) {
        const sig = await el.evaluate(e => [e.tagName, e.className?.baseVal ?? e.className, e.type, e.parentElement?.className].join('|')).catch(() => null);
        if (!sig || (seen.get(sig) ?? 0) >= 1 || n >= 60) {
            continue;
        }
        // Visually hidden controls (accordion checkboxes, sr-only inputs) show their focus on the label they drive.
        const shown = await el.evaluate(e => {
            const r = e.getBoundingClientRect(), s = getComputedStyle(e);
            const tiny = r.width < 4 || r.height < 4 || s.opacity === '0';
            const label = e.labels?.[0] ?? e.closest('label');
            const host = tiny && label ? label : e;
            const box = host.getBoundingClientRect();
            return s.visibility !== 'hidden' && s.display !== 'none' && box.width > 0 && box.height > 0 && (!tiny || !!label);
        }).catch(() => false);
        if (!shown) {
            continue;
        }
        seen.set(sig, (seen.get(sig) ?? 0) + 1);
        n++;
        await centre(el);
        const box = await el.evaluate(e => {
            const r = e.getBoundingClientRect(), s = getComputedStyle(e);
            const host = (r.width < 4 || r.height < 4 || s.opacity === '0') ? (e.labels?.[0] ?? e.closest('label') ?? e) : e;
            const b = host.getBoundingClientRect();
            return { x: b.x, y: b.y, width: b.width, height: b.height };
        });
        const clip = clipFor(page, box, 8);
        if (!clip) {
            continue;
        }
        await page.evaluate(() => document.activeElement?.blur());
        await page.mouse.move(0, 0);
        await pause(page, 60);
        const before = await page.screenshot({ clip });
        // A key press first, so the programmatic focus that follows counts as keyboard focus (:focus-visible).
        await page.keyboard.press('Shift');
        const focused = await el.evaluate(e => { e.focus({ preventScroll: true }); return document.activeElement === e; });
        if (!focused) {
            continue;
        }
        await pause(page, 80);
        const after = await page.screenshot({ clip });
        const label = (await el.evaluate(e => (e.innerText || e.getAttribute('aria-label') || e.value || e.id || e.tagName).trim().slice(0, 40))) || '?';
        const target = await mark(el, `f${n}`);
        await auditScope(page, target, 'focus', where, failures);
        await checkFocusIndicator(page, { clip, box, before, after, label, target }, where, failures);
        await page.evaluate(() => document.activeElement?.blur());
    }
}

// The indicator: pixels that change on focus. Enough of them must reach 3:1 against what they covered, about a 1px ring all around.
async function checkFocusIndicator(page, shots, where, failures) {
    const { clip, box, before, label, target } = shots;
    let { after } = shots;
    const indicator = () => comparePixels(page, [before, after], 'focusChange');
    let { changed, strong } = await indicator();
    // Under load the ring can be painted after the shot: one retry before calling it missing.
    if (!changed) {
        await pause(page, 300);
        after = await page.screenshot({ clip });
        ({ changed, strong } = await indicator());
    }
    // Only the part of the element on screen can show a ring.
    const vp = page.viewportSize();
    const visibleWidth = Math.min(vp.width, box.x + box.width) - Math.max(0, box.x), visibleHeight = Math.min(vp.height, box.y + box.height) - Math.max(0, box.y);
    const perimeter = 2 * (Math.max(0, visibleWidth) + Math.max(0, visibleHeight));
    const fails = !changed || strong < perimeter * 0.75;
    if (fails && args.shots) {
        const name = `${where.url}-${where.viewport}-${where.scheme}-${label}`.replace(/[^\w-]+/g, '_').slice(0, 120);
        fs.mkdirSync(args.shots, { recursive: true });
        fs.writeFileSync(path.join(args.shots, `${name}-before.png`), before);
        fs.writeFileSync(path.join(args.shots, `${name}-after.png`), after);
    }
    if (!changed) {
        failures.push({ ...where, kind: 'focus indicator', target, html: label, fg: 'none', bg: 'no visible change on focus', ratio: 1, need: 3 });
    } else if (strong < perimeter * 0.75) {
        failures.push({ ...where, kind: 'focus indicator', target, html: label, fg: `${strong} px at 3:1`, bg: `needs ~${Math.round(perimeter * 0.75)} px (a ring around)`, ratio: +(strong / perimeter).toFixed(2), need: 3 });
    }
}

// ---- Non-text contrast (3:1): icon-only controls, field borders ----
async function nonTextPass(page, where, failures) {
    // Links and buttons with no text: the icon is what identifies them.
    const controls = await page.locator('a, button, [role="button"]').filter({ visible: true }).all();
    let n = 0;
    for (const control of controls) {
        const icon = await control.evaluateHandle(e => {
            if ((e.innerText || '').trim()) return null;
            return e.querySelector('svg, i, [class*="icon"], [class*="flaticon"]');
        });
        const iconEl = icon.asElement();
        if (!iconEl) {
            continue;
        }
        const m = await measureBehind(page, page.locator(await mark(iconEl, `i${n++}`)), { need: 3 }).catch(() => null);
        if (m && m.ratio < 3) {
            const label = await control.evaluate(e => e.getAttribute('aria-label') || e.id || e.className || e.tagName);
            failures.push({ ...where, kind: 'icon', target: `icon of ${label}`, html: label, fg: m.colour, bg: 'behind the icon', ratio: +m.ratio.toFixed(2), need: 3 });
        }
    }
    // Text fields: their border or their fill must stand out at 3:1 from what surrounds them.
    const fields = await page.locator('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]), textarea, select').filter({ visible: true }).all();
    for (const field of fields) {
        const r = await field.evaluate(e => {
            const probe = document.createElement('canvas').getContext('2d');
            const rgba = c => {
                probe.clearRect(0, 0, 1, 1);
                probe.fillStyle = '#000';
                probe.fillStyle = c;
                probe.fillRect(0, 0, 1, 1);
                return probe.getImageData(0, 0, 1, 1).data;
            };
            const lum = d => [d[0], d[1], d[2]].map(v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
            const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
            let p = e.parentElement, outside = 'rgb(255, 255, 255)';
            while (p) {
                const bg = getComputedStyle(p).backgroundColor;
                if (bg && !/rgba\(.*,\s*0\)$/.test(bg) && bg !== 'transparent') {
                    outside = bg;
                    break;
                }
                p = p.parentElement;
            }
            const s = getComputedStyle(e);
            const width = Number.parseFloat(s.borderTopWidth) + Number.parseFloat(s.borderBottomWidth);
            const border = width > 0 ? ratio(rgba(s.borderTopColor), rgba(outside)) : 1;
            const fill = ratio(rgba(s.backgroundColor === 'rgba(0, 0, 0, 0)' ? outside : s.backgroundColor), rgba(outside));
            return { border, fill, borderColour: s.borderTopColor, fillColour: s.backgroundColor, outside, name: e.name || e.id || e.placeholder || e.tagName };
        });
        if (Math.max(r.border, r.fill) < 3) {
            failures.push({ ...where, kind: 'field boundary', target: `field ${r.name}`, html: r.name, fg: `border ${r.borderColour}, fill ${r.fillColour}`, bg: r.outside, ratio: +Math.max(r.border, r.fill).toFixed(2), need: 3 });
        }
    }
}

// ---- One page, one size, one theme ----
async function checkPage(browser, pageInfo, viewport, scheme) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: !!viewport.isMobile, hasTouch: !!viewport.hasTouch, colorScheme: scheme });
    const page = await context.newPage();
    const where = { url: pageInfo.url, viewport: viewport.name, scheme };
    const failures = [];
    const step = async (name, fn) => {
        try {
            await fn();
        } catch (error) {
            failures.push({ ...where, kind: 'error', target: name, html: String(error.message).split('\n')[0], ratio: 0, need: 0 });
        }
    };
    await step('load', async () => {
        await page.goto(BASE + pageInfo.url, { waitUntil: 'load', timeout: 60000 });
        await page.waitForTimeout(1200);
        if (pageInfo.article) {
            // The blog injects the article into #article-shape (or shows an error there).
            await page.waitForFunction(() => document.querySelector('#article-shape')?.childElementCount || document.body.classList.contains('article-error'), null, { timeout: 15000 });
            if (await page.evaluate(() => document.body.classList.contains('article-error'))) {
                throw new Error(`article ${pageInfo.article} failed to load`);
            }
            await page.waitForTimeout(800);
        }
        await prepare(page);
        await page.addScriptTag({ path: AXE });
    });
    if (!failures.length) {
        await step('on load', () => auditScope(page, null, 'on load', where, failures));
        await step('hover', () => hoverPass(page, where, failures));
        await step('interactions', () => interactionPass(page, where, failures));
        if (FOCUS_VIEWPORTS.has(viewport.name)) {
            await step('focus', () => focusPass(page, where, failures));
            await step('non-text', () => nonTextPass(page, where, failures));
        }
    }
    await context.close();
    return failures;
}

// ---- Run ----
const browser = await chromium.launch();
let targets = pages;
if (changed?.selectors) {
    // Keep the pages where a changed rule matches something; a selector that matches no page at all is unused CSS, reported but not checked.
    const results = new Map();
    const queue = [...pages];
    await Promise.all(Array.from({ length: CONCURRENCY + 1 }, async () => {
        while (queue.length) {
            const p = queue.shift();
            results.set(p, await matchSelectors(browser, p, changed.selectors));
        }
    }));
    const unused = changed.selectors.filter((_, i) => ![...results.values()].some(r => r[i]));
    targets = pages.filter(p => results.get(p).some(Boolean));
    const theme = changed.scheme ? `, ${changed.scheme} theme only` : '';
    console.log(`Changed rules: ${changed.selectors.length} selector(s), ${targets.length} of ${pages.length} pages use them${theme}`);
    if (unused.length) {
        console.log(`Matching no page: ${unused.join(' | ')}`);
    }
    if (!targets.length) {
        console.log('No page uses the changed rules: nothing to check.');
        await browser.close();
        server.close();
        process.exit(0);
    }
}
const schemes = changed?.scheme ? SCHEMES.filter(s => s === changed.scheme) : SCHEMES;
if (args.list) {
    console.log(`${targets.length} page(s) × ${VIEWPORTS.length} size(s) × ${schemes.length} theme(s): ${targets.map(p => p.url).join(' ')}`);
    await browser.close();
    server.close();
    process.exit(0);
}
const jobs = targets.flatMap(p => VIEWPORTS.flatMap(v => schemes.map(s => [p, v, s])));
const total = jobs.length;
const all = [];
let done = 0;
async function worker() {
    while (jobs.length) {
        const [p, v, s] = jobs.shift();
        all.push(...await checkPage(browser, p, v, s));
        done++;
        process.stderr.write(`\r${done} / ${total} checks`);
    }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
process.stderr.write('\n');
await browser.close();
server.close();

// ---- Report: one entry per distinct problem, with where it shows up ----
const groups = new Map();
for (const f of all) {
    const text = String(f.html).replace(/<[^<>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50) || String(f.html).slice(0, 50);
    const target = f.target.replace(/\[data-contrast-probe="[^"]+"\]/g, '').replace(/:nth-child\(\d+\)/g, '').trim() || text;
    const key = [f.kind, target, f.fg, f.bg, f.ratio, f.need].join('|');
    if (!groups.has(key)) {
        groups.set(key, { ...f, target, text, where: new Set() });
    }
    groups.get(key).where.add(`${f.url} ${f.viewport} ${f.scheme}`);
}
const sizes = VIEWPORTS.map(v => `${v.name} ${v.width}px`).join(', ');
console.log(`Pages: ${targets.length}  Sizes: ${sizes}  Modes: ${schemes.join(', ')}`);
console.log('Checked: text on load, on hover, after interactions; keyboard focus and non-text contrast (phone and desktop).');
if (!groups.size) {
    console.log('PASS: every check meets WCAG AA (text 4.5:1 or 3:1 when large; focus indicators, icons and field boundaries 3:1).');
} else {
    console.log(`FAIL: ${groups.size} distinct problem(s)`);
    for (const g of [...groups.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.ratio - b.ratio)) {
        const where = [...g.where];
        console.log(`\n[${g.kind}] ${g.ratio}:1 (needs ${g.need}:1)  ${g.fg} on ${g.bg}`);
        console.log(`  element: ${g.target}  "${g.text}"`);
        console.log(`  seen in ${where.length} check(s), e.g. ${where.slice(0, 3).join(' ; ')}`);
    }
}
if (args.json) {
    fs.writeFileSync(path.resolve(args.json), JSON.stringify(all, null, 1));
}
process.exit(groups.size ? 1 : 0);
