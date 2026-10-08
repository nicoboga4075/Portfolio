#!/usr/bin/env node
// HTTP hook server (PostToolUse on Edit / Write / MultiEdit): when Claude edits a _data/*.json file, checks that it is valid JSON and that every text has every language of routes.locales with the same shape, and answers {"decision":"block","reason":...} so Claude sees the problem next to its edit.
// Started by start-translation-hook-server.mjs (SessionStart hook); listens on localhost only and stops after 2 hours without a request.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.TRANSLATION_HOOK_PORT) || 4799;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DATA = path.join(ROOT, '_data');
const IDLE_MS = 2 * 60 * 60 * 1000;
const MAX_ISSUES = 20;

const languages = () => Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).routes.locales);
const kind = value => (Array.isArray(value) ? 'array' : typeof value);

// Two versions of a text compared all the way down: same type, same keys, same list lengths, both empty or both filled.
function compare(a, b, [langA, langB], where, issues) {
    if (kind(a) !== kind(b)) {
        issues.push(`${where}: "${langA}" is a ${kind(a)}, "${langB}" is a ${kind(b)}`);
    } else if (Array.isArray(a)) {
        if (a.length !== b.length) issues.push(`${where}: ${a.length} items in "${langA}", ${b.length} in "${langB}"`);
        a.slice(0, b.length).forEach((item, i) => compare(item, b[i], [langA, langB], `${where}[${i}]`, issues));
    } else if (a && typeof a === 'object') {
        const missing = [...Object.keys(a).filter(k => !(k in b)).map(k => `${k} (missing in "${langB}")`), ...Object.keys(b).filter(k => !(k in a)).map(k => `${k} (missing in "${langA}")`)];
        if (missing.length) issues.push(`${where}: keys differ: ${missing.join(', ')}`);
        for (const key of Object.keys(a).filter(k => k in b)) compare(a[key], b[key], [langA, langB], `${where}.${key}`, issues);
    } else if (typeof a === 'string' && Boolean(a.trim()) !== Boolean(b.trim())) {
        issues.push(`${where}: empty in "${a.trim() ? langB : langA}" only`);
    }
}

// Every object with a language key ({ en, fr }) must have all of them, with the same shape.
function walk(node, where, langs, issues) {
    if (Array.isArray(node)) {
        node.forEach((item, i) => walk(item, `${where}[${i}]`, langs, issues));
        return;
    }
    if (!node || typeof node !== 'object') return;
    const present = langs.filter(lang => lang in node);
    if (present.length && present.length < langs.length) {
        issues.push(`${where}: has "${present.join('", "')}" but not "${langs.filter(l => !present.includes(l)).join('", "')}"`);
    } else if (present.length) {
        const [first, ...others] = langs;
        for (const lang of others) compare(node[first], node[lang], [first, lang], where, issues);
    }
    for (const [key, value] of Object.entries(node)) walk(value, `${where}.${key}`, langs, issues);
}

// The hook answer for an edited file: null when there is nothing to say (not a _data file, or a complete one).
function review(filePath) {
    const file = path.resolve(String(filePath ?? ''));
    if (path.dirname(file) !== DATA || path.extname(file) !== '.json' || !fs.existsSync(file)) return null;
    const name = `_data/${path.basename(file)}`;
    let data;
    try {
        data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        return { decision: 'block', reason: `${name} is no longer valid JSON: ${error.message}. The site build reads it: fix it before anything else.` };
    }
    const issues = [];
    walk(data, path.basename(file, '.json'), languages(), issues);
    if (!issues.length) return null;
    const listed = issues.slice(0, MAX_ISSUES).map(issue => `- ${issue}`).join('\n');
    const more = issues.length > MAX_ISSUES ? `\n- ... and ${issues.length - MAX_ISSUES} more` : '';
    return { decision: 'block', reason: `${name} after this edit: ${issues.length} translation problem(s), the other language would show nothing or the wrong item:\n${listed}${more}\nGive every language the same keys and list items (npm run check:translation checks the whole site).` };
}

let idle;
const keepAlive = server => {
    clearTimeout(idle);
    idle = setTimeout(() => server.close(() => process.exit(0)), IDLE_MS);
};

const server = http.createServer((req, res) => {
    keepAlive(server);
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ root: ROOT }));
        return;
    }
    if (req.method !== 'POST' || req.url !== '/post-edit') {
        res.writeHead(404).end();
        return;
    }
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
        body += chunk;
        if (body.length > 1_000_000) req.destroy();
    });
    req.on('end', () => {
        let answer = null;
        try {
            answer = review(JSON.parse(body).tool_input?.file_path);
        } catch {
            answer = null;
        }
        // An empty 2xx is a success with nothing to add; a JSON body is read as the hook's decision.
        if (answer) res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(answer));
        else res.writeHead(200).end();
    });
});

server.listen(PORT, 'localhost', () => keepAlive(server));
