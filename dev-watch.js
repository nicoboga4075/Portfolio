// npm run dev:watch [-- <netlify dev args>]: rebuild .eleventy on every source change while netlify dev serves it, and reload the browser when the output changes.
// Unlike npm run dev this doesn't minify the js copy (a rebuild only re-copies the files that changed).
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Every executable is an absolute path: node itself, the project's Eleventy and browser-sync, the global netlify-cli installed next to node, and taskkill in System32. Nothing is looked up through PATH, and no shell wraps the commands.
const eleventyCli = path.join(__dirname, 'node_modules', '@11ty', 'eleventy', 'cmd.cjs');
const browserSyncCli = path.join(__dirname, 'node_modules', 'browser-sync', 'dist', 'bin.js');
const netlifyCli = path.join(path.dirname(process.execPath), 'node_modules', 'netlify-cli', 'bin', 'run.js');
const taskkill = path.join(process.env.SystemRoot ?? String.raw`C:\Windows`, 'System32', 'taskkill.exe');

// Visitors browse browser-sync on 8888 (the only localhost origin isTrustedRequest lets call the functions), which proxies netlify dev on 8889.
const sitePort = 8888;
const netlifyPort = 8889;

// browser-sync watches only this file, which is rewritten at the end of every Eleventy build. Letting it watch .eleventy itself made its process grow past 2 GB in a few rebuilds (each rebuild rewrites every page and, when full, re-copies ~300 MB of static files) until Node ran out of memory. It lives in the temp folder, outside the repo, so it never shows up in git.
const reloadTrigger = path.join(os.tmpdir(), 'portfolio-dev-reload').replaceAll(path.sep, '/');
fs.writeFileSync(reloadTrigger, '');

if (!fs.existsSync(netlifyCli)) {
    console.error(`netlify-cli not found at ${netlifyCli}: install it globally with npm install -g netlify-cli.`);
    process.exit(1);
}

const netlifyArgs = process.argv.slice(2);
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

function shutdown() {
    for (const child of children) {
        if (child.exitCode === null) {
            // netlify dev starts its own child processes, so kill the whole process tree.
            spawn(taskkill, ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
        }
    }
    process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

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
        run(netlifyCli, ['dev', '--port', String(netlifyPort), ...netlifyArgs], {}, 'inherit');
        // One full reload per build (css included), triggered by the file above.
        run(browserSyncCli, [
            'start', '--proxy', `http://localhost:${netlifyPort}`, '--port', String(sitePort),
            '--files', reloadTrigger,
            '--no-open', '--no-notify', '--no-ui', '--no-ghost-mode'
        ], {}, 'inherit');
    }
});
