// npm run dev:watch [-- <netlify dev args>]: rebuild .eleventy on every source change while netlify dev serves it.
// Unlike npm run dev this doesn't minify the js copy (a rebuild only re-copies the files that changed).
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Every executable is an absolute path: node itself, the project's Eleventy, the global netlify-cli installed next to node, and taskkill in System32. Nothing is looked up through PATH, and no shell wraps the commands.
const eleventyCli = path.join(__dirname, 'node_modules', '@11ty', 'eleventy', 'cmd.cjs');
const netlifyCli = path.join(path.dirname(process.execPath), 'node_modules', 'netlify-cli', 'bin', 'run.js');
const taskkill = path.join(process.env.SystemRoot ?? String.raw`C:\Windows`, 'System32', 'taskkill.exe');

if (!fs.existsSync(netlifyCli)) {
    console.error(`netlify-cli not found at ${netlifyCli}: install it globally with npm install -g netlify-cli.`);
    process.exit(1);
}

const netlifyArgs = process.argv.slice(2);
const children = [];

function run(script, args, env) {
    const child = spawn(process.execPath, [script, ...args], {
        stdio: ['inherit', 'pipe', 'inherit'],
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

let netlifyStarted = false;
// No --incremental: it would cut a rebuild from ~10s to ~1-2s, but Eleventy can miss a dependency and leave stale pages (an include, a _data/*.json or the package.json-fed globals in .eleventy.js changing without every page that uses them being rebuilt), which reads as a bug in the code. Restart this script after such edits if it is ever enabled.
const eleventy = run(eleventyCli, ['--watch'], { ELEVENTY_PREVIEW: '1' });
eleventy.stdout.on('data', chunk => {
    process.stdout.write(chunk);
    // Wait for the first build to land, otherwise netlify dev would serve an empty .eleventy.
    if (!netlifyStarted && chunk.toString().includes('Watching')) {
        netlifyStarted = true;
        const netlify = run(netlifyCli, ['dev', ...netlifyArgs]);
        netlify.stdout.pipe(process.stdout);
    }
});
