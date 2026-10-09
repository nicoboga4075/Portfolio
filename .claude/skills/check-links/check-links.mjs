#!/usr/bin/env node
// Checks that every external link of the site answers 200 after its redirects and that its page is not a "soft 404" (a 200 whose DOM says 404 / not found).
// Usage: npm run check:links [-- --only=<text>] [--timeout=<ms>] (exit 1 on a broken link; links blocked by an anti-bot are printed but don't fail)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const only = arg('only');
const timeout = Number(arg('timeout') ?? 20000);
const CONCURRENCY = 8;
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).routes.site;

// Hosts that are not pages to visit: code samples, font preconnects and the site itself.
const SKIPPED_HOSTS = [/(^|\.)example\.com$/, /(^|\.)exemple\.com$/, /^fonts\.(googleapis|gstatic)\.com$/, /^localhost$/, /^127\.0\.0\.1$/];
const siteHost = site ? new URL(site).host : 'nicoboga.netlify.app';
// Status codes an anti-bot answers (202 is the Amazon challenge page) to a script while a browser gets the page: a warning to check by hand, not an error.
const BLOCKED = new Set([202, 401, 403, 429, 503, 999]);
// What a "page not found" says in its title or its headings, in English and French.
const NOT_FOUND = /\b404\b|not found|page (?:introuvable|non trouv[ée]e)|n['’]existe (?:pas|plus)|doesn['’]t exist|does not exist|no longer (?:exists|available)|cette page est introuvable/i;

// The source files whose links reach the built site: pages, includes, articles, projects and data.
function sourceFiles() {
    const files = [];
    const add = (dir, ext) => {
        for (const name of fs.readdirSync(path.join(ROOT, dir))) {
            if (ext.some(e => name.endsWith(e))) files.push(path.posix.join(dir, name));
        }
    };
    add('.', ['.html']);
    for (const dir of ['_includes', 'articles', 'projects']) add(dir, ['.html', '.njk']);
    add('_data', ['.json']);
    return files.map(f => f.replace(/^\.\//, ''));
}

// Every external URL with the files that hold it.
function collectLinks() {
    const links = new Map();
    for (const file of sourceFiles()) {
        const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
        for (const [raw] of text.matchAll(/https?:\/\/[^\s"'<>`\\)]+/g)) {
            // Templated URLs ({{ ... }}) are built at compile time: they are not real links.
            if (raw.includes('{{') || raw.includes('{%')) continue;
            const url = raw.replace(/&amp;/g, '&').replace(/[.,;:!?]+$/, '');
            let host;
            try {
                host = new URL(url).hostname;
            } catch {
                continue;
            }
            if (host === siteHost || SKIPPED_HOSTS.some(re => re.test(host))) continue;
            if (only && !url.includes(only)) continue;
            if (!links.has(url)) links.set(url, new Set());
            links.get(url).add(file);
        }
    }
    return links;
}

// The visible text of the title and the h1 / h2 headings, where a "not found" page says so.
function notFoundSignal(html) {
    const clean = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, '');
    const parts = [...clean.matchAll(/<(title|h1|h2)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    return parts.find(p => p && NOT_FOUND.test(p));
}

async function check(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, {
            redirect: 'follow',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none'
            }
        });
        const final = res.url !== url ? ` → ${res.url}` : '';
        if (BLOCKED.has(res.status)) return { level: 'blocked', message: `${res.status}${final} (anti-bot, check it in a browser)` };
        if (res.status !== 200) return { level: 'error', message: `${res.status}${final}` };
        // Only an HTML page has a DOM to read: a PDF or an image answering 200 is fine.
        if (!(res.headers.get('content-type') ?? '').includes('html')) return { level: 'ok' };
        const signal = notFoundSignal(await res.text());
        if (signal) return { level: 'error', message: `200${final} but its page says "${signal.slice(0, 80)}"` };
        return { level: 'ok' };
    } catch (err) {
        const reason = err.name === 'AbortError' ? `timeout after ${timeout} ms` : (err.cause?.code ?? err.message);
        return { level: 'error', message: reason };
    } finally {
        clearTimeout(timer);
    }
}

const links = collectLinks();
const urls = [...links.keys()];
const results = new Map();
let next = 0;
// A small pool of workers so that a slow host doesn't hold the others back.
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, async () => {
    while (next < urls.length) {
        const url = urls[next++];
        results.set(url, await check(url));
    }
}));

const byLevel = level => urls.filter(u => results.get(u).level === level);
const print = (out, mark, url) => out(`  ${mark} ${url}\n      ${results.get(url).message}\n      in ${[...links.get(url)].join(', ')}`);
const blocked = byLevel('blocked');
const errors = byLevel('error');
if (blocked.length) {
    console.log(`\n${blocked.length} link(s) blocked by an anti-bot:`);
    for (const url of blocked) print(console.log, '?', url);
}
if (errors.length) {
    console.error(`\n${errors.length} broken link(s):`);
    for (const url of errors) print(console.error, '✖', url);
    process.exit(1);
}
console.log(`\nExternal links are alive: ${urls.length - blocked.length} answer 200 with no 404 in their page, ${blocked.length} to check by hand.`);
