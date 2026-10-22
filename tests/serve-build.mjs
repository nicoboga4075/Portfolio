#!/usr/bin/env node
// Serves the last build (.eleventy) like Netlify, with the 200 rewrites of _redirects, so the Playwright, Cypress and Robot Framework tests and the run-portfolio skill can run without netlify dev.
// Usage: node tests/serve-build.mjs [port] [--port-file <file>] (a free port the system picks by default, printed at start-up and written to the file when given, for a CI job that starts it in the background; build first with ELEVENTY_PREVIEW=1 npx eleventy)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.eleventy');
const args = process.argv.slice(2);
const PORT = Number(args.find(arg => /^\d+$/.test(arg)) ?? 0);
// Where to write the port it got, the argument after --port-file
const portFile = args.includes('--port-file') ? args[args.indexOf('--port-file') + 1] : null;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.vtt': 'text/vtt', '.pdf': 'application/pdf' };

if (!fs.existsSync(path.join(OUT, 'index_en.html'))) {
    console.error('No build in .eleventy: run ELEVENTY_PREVIEW=1 npx eleventy first');
    process.exit(1);
}

const rewrites = new Map(fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split(/\r?\n/).map(line => line.trim().split(/\s+/)).filter(([from, to, status]) => from?.startsWith('/') && to && status === '200').map(([from, to]) => [from, to.slice(1)]));

const server = http.createServer((req, res) => {
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
}).listen(PORT, 'localhost', () => {
    const { port } = server.address();
    if (portFile) {
        fs.mkdirSync(path.dirname(path.resolve(portFile)), { recursive: true });
        fs.writeFileSync(portFile, String(port));
    }
    console.log(`Serving .eleventy on http://localhost:${port} (the Netlify functions are not served: use npm run dev for the pages that need them)`);
});
