#!/usr/bin/env node
// Serves the last build (.eleventy) like Netlify, with the 200 rewrites of _redirects, so the Robot Framework tests can run without netlify dev.
// Usage: node .claude/skills/robot-test/serve-build.mjs [port] (8899 by default; build first with ELEVENTY_PREVIEW=1 npx eleventy)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(ROOT, '.eleventy');
const PORT = Number(process.argv[2] ?? 8899);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.vtt': 'text/vtt', '.pdf': 'application/pdf' };

if (!fs.existsSync(path.join(OUT, 'index_en.html'))) {
    console.error('No build in .eleventy: run ELEVENTY_PREVIEW=1 npx eleventy first');
    process.exit(1);
}

const rewrites = new Map(fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split(/\r?\n/).map(line => line.trim().split(/\s+/)).filter(([from, to, status]) => from?.startsWith('/') && to && status === '200').map(([from, to]) => [from, to.slice(1)]));

http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/\/$/, '') || '/';
    const file = rewrites.get(pathname) ?? pathname.slice(1);
    const full = path.join(OUT, file);
    // Never serve a file outside the build
    if (!file || !full.startsWith(OUT + path.sep)) {
        res.writeHead(404).end();
        return;
    }
    fs.readFile(full, (err, data) => {
        if (err) res.writeHead(404).end();
        else res.writeHead(200, { 'Content-Type': TYPES[path.extname(full).toLowerCase()] ?? 'application/octet-stream' }).end(data);
    });
}).listen(PORT, 'localhost', () => console.log(`Serving .eleventy on http://localhost:${PORT} (the Netlify functions are not served: use npm run dev on 8888 for the pages that need them)`));
