#!/usr/bin/env node
// MCP server (stdio, no dependency) exposing the portfolio as tools: its articles and projects, where a text lives, the translation gaps, a screenshot of a built page, and the health of the live site.
// Started by Claude Code from the plugin's .mcp.json, in the project directory (CLAUDE_PROJECT_DIR, or the working directory).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import readline from 'node:readline';

const ROOT = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const OUT = path.join(ROOT, '.eleventy');
const SERVER = { name: 'portfolio', version: '1.2.0' };
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const json = file => JSON.parse(read(file));
const exists = file => fs.existsSync(path.join(ROOT, file));
const plain = html => String(html).replaceAll(/<[^<>]*>/g, '').replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&nbsp;', ' ').replaceAll(/\s+/g, ' ').trim();

// The project's languages and routes, or an error when the server runs outside the portfolio.
function routes() {
    if (!exists('package.json')) throw new Error(`No package.json in ${ROOT}: start Claude Code from the portfolio repository`);
    const found = json('package.json').routes;
    if (!found?.locales) throw new Error(`${ROOT}/package.json has no routes.locales: this is not the portfolio`);
    return found;
}

// A text in one language when it is a translation ({ en, fr }), as is otherwise.
function inLang(value, lang) {
    if (value && typeof value === 'object' && !Array.isArray(value) && lang in value) return value[lang];
    return value;
}

// ---- list_articles ----
function listArticles({ lang } = {}) {
    const { locales, defaultLang } = routes();
    const pick = lang && lang in locales ? lang : defaultLang;
    const cards = json('_data/blog.json').entries;
    return json('_data/articles.json').map((article, i) => ({
        slug: article.slug,
        title: inLang(article.title, pick),
        date: article.date,
        readTime: cards[i]?.readTime,
        excerpt: plain(inLang(cards[i]?.excerpt, pick) ?? ''),
        tags: article.tags.map(tag => (typeof tag === 'string' ? tag : inLang(tag.name ?? tag, pick))).map(tag => (typeof tag === 'object' ? Object.keys(tag)[0] : tag)),
        url: `/${pick}/blog#${article.slug}`,
        pages: Object.keys(locales).map(code => `articles/${article.slug}_${code}.html`).filter(exists),
    }));
}

// ---- list_projects ----
function listProjects({ lang } = {}) {
    const { locales, defaultLang, projects } = routes();
    const pick = lang && lang in locales ? lang : defaultLang;
    const block = read('js/app.js').match(/const appProjects = \[([^\]]*)\];/);
    const targets = block ? [...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
    return json('_data/projects.json').cards.map((card, i) => {
        const target = targets[i] ?? null;
        const page = target && projects.includes(target);
        return {
            id: card.id,
            title: plain(inLang(card.title, pick)),
            description: plain(inLang(card.description, pick) ?? ''),
            context: plain(inLang(card.context, pick) ?? ''),
            technologies: inLang(card.technologies, pick),
            explore: target,
            url: page ? `/${pick}/${target}` : target,
            pages: page ? Object.keys(locales).map(code => `projects/${target}_${code}.html`).filter(exists) : [],
        };
    });
}

// ---- find_text ----
function findInData(node, where, needle, lang, results) {
    if (results.length >= 50) return;
    if (Array.isArray(node)) {
        node.forEach((item, i) => findInData(item, `${where}[${i}]`, needle, lang, results));
    } else if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) findInData(value, `${where}.${key}`, needle, lang, results);
    } else if (typeof node === 'string' && plain(node).toLowerCase().includes(needle)) {
        const segment = where.split('.').find(part => /^[a-z]{2}$/.test(part.replace(/\[\d+\]$/, '')));
        if (!lang || !segment || segment.startsWith(lang)) results.push({ where: `_data/${where.replace(/ → \.?/, ' → ')}`, text: plain(node).slice(0, 200) });
    }
}

function findText({ query, lang } = {}) {
    if (!query || String(query).trim().length < 2) throw new Error('query: give at least 2 characters');
    const needle = String(query).trim().toLowerCase();
    const results = [];
    for (const file of fs.readdirSync(path.join(ROOT, '_data')).filter(f => f.endsWith('.json'))) {
        findInData(json(`_data/${file}`), `${file} → `, needle, lang, results);
    }
    const sources = ['.', 'articles', 'projects', '_includes'].flatMap(dir => fs.readdirSync(path.join(ROOT, dir)).filter(f => /\.(html|njk)$/.test(f)).map(f => (dir === '.' ? f : `${dir}/${f}`)));
    for (const file of sources.filter(f => !lang || !/_[a-z]{2}\.html$/.test(f) || f.endsWith(`_${lang}.html`))) {
        read(file).split(/\r?\n/).forEach((line, i) => {
            if (results.length < 50 && plain(line).toLowerCase().includes(needle)) results.push({ where: `${file}:${i + 1}`, text: plain(line).slice(0, 200) });
        });
    }
    return { query, count: results.length, truncated: results.length >= 50, results };
}

// ---- translation_gaps ----
function translationGaps({ build = false } = {}) {
    routes();
    const script = path.join(ROOT, '.claude', 'skills', 'i18n-l10n', 'check-translation.mjs');
    if (!fs.existsSync(script)) throw new Error('.claude/skills/i18n-l10n/check-translation.mjs not found');
    const run = spawnSync(process.execPath, [script, ...(build ? [] : ['--no-build'])], { cwd: ROOT, encoding: 'utf8', timeout: 300000 });
    const lines = `${run.stdout ?? ''}${run.stderr ?? ''}`.split(/\r?\n/);
    const pick = prefix => lines.filter(l => l.startsWith(`${prefix}: `)).map(l => l.slice(prefix.length + 2));
    return {
        complete: run.status === 0,
        summary: lines.findLast(Boolean) ?? '',
        errors: pick('error'),
        warnings: pick('warning'),
        notes: pick('note'),
        built: build ? 'rebuilt with Eleventy' : 'read the last build in .eleventy (pass build: true after a change)',
    };
}

// ---- preview ----
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf' };

// Serves .eleventy the way Netlify does: the 200 rewrites of _redirects and the article function.
function startServer() {
    const rewrites = new Map(read('_redirects').split(/\r?\n/).map(line => line.trim().split(/\s+/)).filter(([from, to, status]) => from?.startsWith('/') && to && status === '200').map(([from, to]) => [from, to.slice(1)]));
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://localhost');
        const pathname = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/';
        let file = rewrites.get(pathname) ?? pathname.slice(1);
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
            if (err) res.writeHead(404).end();
            else res.writeHead(200, { 'Content-Type': TYPES[path.extname(full).toLowerCase()] ?? 'application/octet-stream' }).end(data);
        });
    });
    return new Promise(resolve => server.listen(0, 'localhost', () => resolve(server)));
}

async function preview({ url = '/en', theme = 'light', width = 1280, height = 800, full_page = false } = {}) {
    routes();
    if (!fs.existsSync(path.join(OUT, 'index_en.html'))) throw new Error('No build in .eleventy: run translation_gaps with build: true, or npm run build');
    if (!/^\/[\w\-/#]*$/.test(url)) throw new Error('url: a site path such as /en, /fr/blog, /en/blog#mcs or /en/panel_mnt');
    const { chromium } = createRequire(path.join(ROOT, 'package.json'))('playwright');
    const server = await startServer();
    const browser = await chromium.launch();
    try {
        const size = { width: Math.min(Math.max(Number(width) || 1280, 320), 1920), height: Math.min(Math.max(Number(height) || 800, 480), 1600) };
        const page = await browser.newPage({ viewport: size, colorScheme: theme === 'dark' ? 'dark' : 'light' });
        await page.goto(`http://localhost:${server.address().port}${url}`, { waitUntil: 'load', timeout: 60000 });
        // An article is loaded into the blog after the page: wait for it.
        if (url.includes('#')) await page.waitForFunction(() => document.querySelector('#article-shape')?.childElementCount, null, { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1200);
        const shot = await page.screenshot({ fullPage: Boolean(full_page), type: 'png' });
        return { image: shot.toString('base64'), caption: `${url} · ${theme} · ${size.width}×${size.height}${full_page ? ' · full page' : ''} (last build in .eleventy)` };
    } finally {
        await browser.close();
        server.close();
    }
}

// ---- site_health ----
async function timed(url) {
    const start = Date.now();
    try {
        const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
        return { url, status: res.status, ms: Date.now() - start };
    } catch (error) {
        return { url, status: null, error: error.message };
    }
}

function git(args) {
    const run = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
    return run.status === 0 ? run.stdout.trimEnd() : null;
}

async function ciChecks(sha) {
    try {
        const res = await fetch(`https://api.github.com/repos/nicoboga4075/Portfolio/commits/${sha}/check-runs`, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(15000) });
        if (!res.ok) return { error: `GitHub API ${res.status}` };
        return (await res.json()).check_runs.map(run => ({ name: run.name, status: run.status, conclusion: run.conclusion }));
    } catch (error) {
        return { error: error.message };
    }
}

function qualityGate() {
    const run = spawnSync('sonar', ['quality-gate', 'status', '--format', 'json'], { cwd: ROOT, encoding: 'utf8', timeout: 60000, shell: process.platform === 'win32' });
    try {
        const gate = JSON.parse(run.stdout).qualityGate;
        return { status: gate.status, failing: gate.conditions.filter(c => c.status !== 'OK').map(c => `${c.metricName ?? c.metric}: ${c.formattedActualValue ?? c.actualValue} (needs ${c.comparator === 'LT' ? '≥' : '≤'} ${c.formattedThreshold ?? c.threshold})`) };
    } catch {
        return { error: 'sonar CLI unavailable or not logged in (sonar auth login)' };
    }
}

// The health in one line, as the output of a PreToolUse hook: shown to the developer and passed to Claude, never blocking.
function healthForHook(health) {
    const parts = [livePart(health.live), `CI of ${health.ci.commit}: ${ciPart(health.ci.checks)}`, `SonarCloud: ${gatePart(health.sonarcloud)}`, `${health.repository.unpushed} unpushed commit(s)`];
    const message = `Site health before the commit: ${parts.join(' · ')}`;
    return { systemMessage: message, hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: message } };
}

function livePart(pages) {
    const down = pages.filter(p => !p.status || p.status >= 400).map(p => `${p.url} ${p.status ?? p.error}`);
    return down.length ? `live pages down: ${down.join(', ')}` : `live pages OK (${pages.length})`;
}

function ciPart(checks) {
    if (!Array.isArray(checks)) return checks.error;
    const failed = [...new Set(checks.filter(c => c.conclusion && !['success', 'skipped', 'neutral'].includes(c.conclusion)).map(c => c.name))];
    if (failed.length) return `failed ${failed.join(', ')}`;
    const running = checks.filter(c => c.status !== 'completed').length;
    return running ? `${running} running` : 'green';
}

function gatePart(gate) {
    if (gate.error) return gate.error;
    return gate.failing.length ? `${gate.status}, ${gate.failing.join('; ')}` : gate.status;
}

async function siteHealth({ hook = false } = {}) {
    const health = await fullHealth();
    return hook ? healthForHook(health) : health;
}

async function fullHealth() {
    const { site, locales } = routes();
    const head = git(['rev-parse', 'HEAD']);
    const remote = git(['rev-parse', 'origin/main']);
    const [pages, ci] = await Promise.all([
        Promise.all(['', ...Object.keys(locales).flatMap(code => [`/${code}`, `/${code}/blog`])].map(p => timed(site + p))),
        remote ? ciChecks(remote) : Promise.resolve({ error: 'no origin/main' }),
    ]);
    return {
        live: pages,
        repository: {
            branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
            head: head?.slice(0, 7),
            pushed: remote?.slice(0, 7),
            unpushed: Number(git(['rev-list', '--count', 'origin/main..HEAD']) ?? 0),
            uncommitted: (git(['status', '--porcelain']) ?? '').split('\n').filter(Boolean),
        },
        ci: { commit: remote?.slice(0, 7), checks: ci },
        sonarcloud: qualityGate(),
    };
}

// ---- MCP ----
const LANG = { type: 'string', description: 'Language code of routes.locales (en, fr). Default: routes.defaultLang' };
const TOOLS = [
    { name: 'list_articles', description: 'The blog articles, newest first: slug, title, date, read time, excerpt, tags, blog URL and source pages, in one language.', inputSchema: { type: 'object', properties: { lang: LANG } }, run: listArticles },
    { name: 'list_projects', description: 'The project cards in their order on the home page: title, description, context, technologies, what the Explore button opens (appProjects) and the project pages.', inputSchema: { type: 'object', properties: { lang: LANG } }, run: listProjects },
    { name: 'find_text', description: 'Where a visible text lives: the _data/*.json path (file → key path) or the page / include and line. HTML tags are ignored. Use it before editing a text seen on the site.', inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Text to look for (case-insensitive, at least 2 characters)' }, lang: { type: 'string', description: 'Only this language (en, fr)' } }, required: ['query'] }, run: findText },
    { name: 'translation_gaps', description: 'Runs the translation check (check-translation.mjs): missing languages in _data, missing pages, templates locked to one language, unknown getMessage keys, wrong html lang, broken language switcher, text left in another language.', inputSchema: { type: 'object', properties: { build: { type: 'boolean', description: 'Rebuild with Eleventy first (about 10 s). Default false: reads the last build' } } }, run: translationGaps },
    { name: 'preview', description: 'A PNG screenshot of a page of the last build (.eleventy), served like Netlify: /en, /fr/blog, /en/blog#<article slug>, /fr/<project>, /en/policy. Light or dark theme, any width from 320 to 1920.', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Site path, default /en' }, theme: { type: 'string', enum: ['light', 'dark'] }, width: { type: 'number', description: '320 to 1920, default 1280' }, height: { type: 'number', description: '480 to 1600, default 800' }, full_page: { type: 'boolean', description: 'The whole page instead of the first screen' } } }, run: preview },
    { name: 'site_health', description: 'The state of the site in one call: the live pages (HTTP status and time), the repository (branch, unpushed commits, uncommitted files), the CI checks of origin/main on GitHub, and the SonarCloud quality gate.', inputSchema: { type: 'object', properties: { hook: { type: 'boolean', description: 'Return a one-line summary as PreToolUse hook output (systemMessage and additionalContext) instead of the full report. Default false' } } }, run: siteHealth },
];

const send = message => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', ...message })}\n`);

async function callTool({ name, arguments: input }) {
    const tool = TOOLS.find(t => t.name === name);
    if (!tool) return { content: [{ type: 'text', text: `Unknown tool ${name}` }], isError: true };
    try {
        const result = await tool.run(input ?? {});
        if (result?.image) return { content: [{ type: 'image', data: result.image, mimeType: 'image/png' }, { type: 'text', text: result.caption }] };
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
    }
}

async function handle(message) {
    const { id, method, params } = message;
    // Notifications (no id) need no answer.
    if (id === undefined) return;
    if (method === 'initialize') send({ id, result: { protocolVersion: params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: SERVER } });
    else if (method === 'ping') send({ id, result: {} });
    else if (method === 'tools/list') send({ id, result: { tools: TOOLS.map(({ run, ...tool }) => tool) } });
    else if (method === 'tools/call') send({ id, result: await callTool(params ?? {}) });
    else send({ id, error: { code: -32601, message: `Method not found: ${method}` } });
}

readline.createInterface({ input: process.stdin }).on('line', line => {
    if (!line.trim()) return;
    let message;
    try {
        message = JSON.parse(line);
    } catch {
        send({ id: null, error: { code: -32700, message: 'Parse error' } });
        return;
    }
    handle(message).catch(error => send({ id: message.id ?? null, error: { code: -32603, message: error.message } }));
});
