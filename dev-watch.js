// npm run dev:watch [-- <netlify dev args>]: rebuild .eleventy on every source change while netlify dev serves it.
// Unlike npm run dev this doesn't minify the js copy (a rebuild only re-copies the files that changed).
const { spawn } = require('node:child_process');

const netlifyArgs = process.argv.slice(2);
const children = [];

function run(command, args, env) {
    const child = spawn(command, args, {
        stdio: ['inherit', 'pipe', 'inherit'],
        shell: true,
        env: { ...process.env, ...env }
    });
    children.push(child);
    child.on('exit', () => shutdown());
    return child;
}

function shutdown() {
    for (const child of children) {
        if (child.exitCode === null) {
            // shell: true wraps the command, so kill the whole process tree.
            spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
        }
    }
    process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

let netlifyStarted = false;
// No --incremental: it would cut a rebuild from ~10s to ~1-2s, but Eleventy can miss a dependency and leave stale pages (an include, a _data/*.json or the package.json-fed globals in .eleventy.js changing without every page that uses them being rebuilt), which reads as a bug in the code. Restart this script after such edits if it is ever enabled.
const eleventy = run('npx', ['eleventy', '--watch'], { ELEVENTY_PREVIEW: '1' });
eleventy.stdout.on('data', chunk => {
    process.stdout.write(chunk);
    // Wait for the first build to land, otherwise netlify dev would serve an empty .eleventy.
    if (!netlifyStarted && chunk.toString().includes('Watching')) {
        netlifyStarted = true;
        const netlify = run('netlify', ['dev', ...netlifyArgs]);
        netlify.stdout.pipe(process.stdout);
    }
});
