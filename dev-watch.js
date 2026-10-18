// npm run dev:watch [-- <netlify dev args>]: rebuild .eleventy on every source change while netlify dev serves it, and reload the browser when the output changes.
// This doesn't minify the js copy (a rebuild only re-copies the files that changed).
// npm run dev (--once): build .eleventy a single time, minify its js copy, then serve it the same way, without watching.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const toml = require('toml');

// Every executable is an absolute path: node itself, the project's Eleventy, the global netlify-cli installed next to node, and taskkill in System32. Nothing is looked up through PATH, and no shell wraps the commands.
const eleventyCli = path.join(__dirname, 'node_modules', '@11ty', 'eleventy', 'cmd.cjs');
const netlifyCli = path.join(path.dirname(process.execPath), 'node_modules', 'netlify-cli', 'bin', 'run.js');
const uglifyScript = path.join(__dirname, 'uglify-code.js');
const taskkill = path.join(process.env.SystemRoot ?? String.raw`C:\Windows`, 'System32', 'taskkill.exe');

// Visitors browse browser-sync on the port of [dev] in netlify.toml (the only localhost origin isTrustedRequest lets call the functions), which proxies netlify dev on a free port the system picks.
const { port: sitePort, staticServerPort } = toml.parse(fs.readFileSync(path.join(__dirname, 'netlify.toml'), 'utf8')).dev;

// netlify dev (27.9.0) answers 403 on Windows for any static file that a _redirects rule matches: its getStatic() builds the path with path.relative, so it hands its own static server /docs\public\CV_en.pdf, which that server refuses. /docs/public/* is matched by such a rule, so the CV and the other public documents never load through the site port. Serve them straight from netlify dev's static server instead (production isn't affected: Netlify runs on Linux), with the headers _headers gives them, which that static server leaves out.
function serveDocsPublic(req, res, next) {
    // new URL resolves any "../" before the prefix is checked.
    const { pathname, search } = new URL(req.url, 'http://localhost');
    if (!['GET', 'HEAD'].includes(req.method) || !pathname.toLowerCase().startsWith('/docs/public/')) {
        return next();
    }
    const upstream = http.request({ host: 'localhost', port: staticServerPort, method: req.method, path: pathname + search }, response => {
        res.writeHead(response.statusCode, { ...response.headers, ...headersFor(pathname) });
        response.pipe(res);
    });
    upstream.on('error', next);
    upstream.end();
}

// The headers _headers sets on a path, as Netlify reads it: a path pattern at the start of a line (* for any rest, :name for one segment), its "Name: value" lines indented below, # for comments. The file is read on every call so an edit applies without a restart; for a header two matching rules both set, the longer pattern wins, as the /docs/public/* rule of _headers expects.
function headersFor(pathname, headersFile = path.join(__dirname, '_headers')) {
    const rules = [];
    for (const raw of fs.readFileSync(headersFile, 'utf8').split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const colon = line.indexOf(':');
        // An indented line is a header of the rule above it.
        if (/^\s/.test(raw)) {
            if (rules.length && colon > 0) rules.at(-1).headers.push([line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim()]);
        } else {
            // Any other line starts a rule.
            const source = line.replaceAll(/[.+?^${}()|[\]\\]/g, String.raw`\$&`).replaceAll('*', '.*').replaceAll(/:\w+/g, '[^/]+');
            rules.push({ pattern: line, match: new RegExp(`^${source}$`), headers: [] });
        }
    }
    const matching = rules.filter(rule => rule.match.test(pathname)).sort((a, b) => a.pattern.length - b.pattern.length);
    return Object.fromEntries(matching.flatMap(rule => rule.headers));
}

// browser-sync watches only this file, which is rewritten at the end of every Eleventy build. Letting it watch .eleventy itself made its process grow past 2 GB in a few rebuilds (each rebuild rewrites every page and, when full, re-copies ~300 MB of static files) until Node ran out of memory. It lives in the temp folder, outside the repo, so it never shows up in git.
const reloadTrigger = path.join(os.tmpdir(), 'portfolio-dev-reload').replaceAll(path.sep, '/');
// The free port netlify dev got, written while it runs so the status line can show it (.netlify is git-ignored)
const proxyPortFile = path.join(__dirname, '.netlify', 'dev-proxy-port');

const once = process.argv.includes('--once');
const netlifyArgs = process.argv.slice(2).filter(arg => arg !== '--once');
const children = [];

// Only Eleventy's output is captured (to spot the end of its first build); netlify dev keeps the real terminal, otherwise it takes stdout for a non-interactive shell and can sit there without ever starting.
function run(script, args, env, stdout) {
    const child = spawn(process.execPath, [script, ...args], {
        stdio: ['inherit', stdout, 'inherit'],
        env: { ...process.env, ...env }
    });
    children.push(child);
    child.on('exit', () => shutdown());
    return child;
}

// A build step of --once: runs to completion instead of shutting everything down when it exits, and aborts the script if it fails.
function runStep(script, args, env) {
    return new Promise(resolve => {
        const child = spawn(process.execPath, [script, ...args], {
            stdio: 'inherit',
            env: { ...process.env, ...env }
        });
        children.push(child);
        child.on('exit', code => (code === 0 ? resolve() : process.exit(code ?? 1)));
    });
}

function shutdown() {
    fs.rmSync(proxyPortFile, { force: true });
    for (const child of children) {
        if (child.exitCode === null) {
            // netlify dev starts its own child processes, so kill the whole process tree.
            spawn(taskkill, ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
        }
    }
    process.exit();
}


// Calls back with a port no program listens on, the one the system gives to a server on port 0, closed right away for netlify dev to take.
function freePort(callback) {
    const probe = http.createServer().listen(0, 'localhost', () => {
        const { port } = probe.address();
        probe.close(() => callback(port));
    });
}

// Calls back once netlify dev answers on its port (any status): it takes about a minute to start.
function whenNetlifyAnswers(netlifyPort, callback) {
    const request = http.get({ host: 'localhost', port: netlifyPort, path: '/' }, response => {
        response.resume();
        callback();
    });
    request.on('error', () => setTimeout(() => whenNetlifyAnswers(netlifyPort, callback), 1000));
}

function startServing() {
    freePort(netlifyPort => serveThrough(netlifyPort));
}

function serveThrough(netlifyPort) {
    fs.mkdirSync(path.dirname(proxyPortFile), { recursive: true });
    fs.writeFileSync(proxyPortFile, String(netlifyPort));
    run(netlifyCli, ['dev', '--port', String(netlifyPort), ...netlifyArgs], {}, 'inherit');
    // browser-sync starts, and opens the site port in the browser, only once netlify dev answers: earlier, the tab would open on a proxy error (netlify dev itself no longer opens its own port, see autoLaunch in netlify.toml).
    // Required here rather than at the top, so a test that requires this file for headersFor doesn't load browser-sync.
    whenNetlifyAnswers(netlifyPort, () => require('browser-sync').create().init({
        proxy: `http://localhost:${netlifyPort}`,
        port: sitePort,
        // One full reload per build (css included), triggered by the file above.
        files: once ? [] : reloadTrigger,
        middleware: [serveDocsPublic],
        open: 'local',
        notify: false,
        ui: false,
        ghostMode: false
    }));
}

async function buildOnce() {
    await runStep(eleventyCli, [], { ELEVENTY_PREVIEW: '1' });
    await runStep(uglifyScript, ['.eleventy/js'], {});
    startServing();
}

function watch() {
    let servingStarted = false;
    // --incremental keeps a rebuild to ~0.3s for a css/js edit and ~2-3s for an include, layout or _data edit (each of those rebuilt the pages that use it in a test), against a full rebuild of all 36 pages plus a re-copy of every static file otherwise. Not tested: edits to .eleventy.js or package.json (the source of the routes/linkedin/siteLanguages globals) - restart this script after those if a page looks stale.
    const eleventy = run(eleventyCli, ['--watch', '--incremental'], { ELEVENTY_PREVIEW: '1' }, 'pipe');
    eleventy.stdout.on('data', chunk => {
        process.stdout.write(chunk);
        const output = chunk.toString();
        // Eleventy ends every build with a "Copied N Wrote M files" line.
        if (servingStarted && output.includes('Wrote')) {
            fs.writeFileSync(reloadTrigger, String(Date.now()));
        }
        // Wait for the first build to land, otherwise netlify dev would serve an empty .eleventy.
        if (!servingStarted && output.includes('Watching')) {
            servingStarted = true;
            startServing();
        }
    });
}

module.exports = { headersFor };

// The servers start only when the file runs as a script (npm run dev), not when a test requires it for headersFor.
if (require.main === module) {
    fs.writeFileSync(reloadTrigger, '');
    if (!fs.existsSync(netlifyCli)) {
        console.error(`netlify-cli not found at ${netlifyCli}: install it globally with npm install -g netlify-cli.`);
        process.exit(1);
    }
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    if (once) {
        buildOnce().catch(error => {
            console.error(error);
            // shutdown()'s bare process.exit() picks this up.
            process.exitCode = 1;
            shutdown();
        });
    } else {
        watch();
    }
}
