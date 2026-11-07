// serve-build.mjs serves the folder ELEVENTY_OUTPUT names when it is a folder of reports/ (the Cypress build), and .eleventy otherwise, as .eleventy.js builds it.
const { test, expect } = require('@playwright/test');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const server = path.join(root, 'tests', 'serve-build.mjs');

// Starts serve-build.mjs with that ELEVENTY_OUTPUT and resolves with what it printed first (its address, or why it stopped)
function start(output) {
    const portFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'serve-build-output-')), 'port');
    const child = spawn(process.execPath, [server, '--port-file', portFile], { cwd: root, env: { ...process.env, ELEVENTY_OUTPUT: output } });
    return new Promise(resolve => {
        let text = '';
        child.stdout.on('data', chunk => { text += chunk; if (text.includes('\n')) resolve({ child, text, port: fs.existsSync(portFile) ? fs.readFileSync(portFile, 'utf8') : null }); });
        child.stderr.on('data', chunk => { text += chunk; });
        child.on('exit', () => resolve({ child, text, port: null }));
    });
}

test.describe('serve-build output folder', () => {
    const folder = `reports/serve-build-output-${process.pid}`;
    const full = path.join(root, folder);

    test.beforeAll(() => {
        fs.mkdirSync(full, { recursive: true });
        fs.writeFileSync(path.join(full, 'index_en.html'), '<p>moved build</p>');
        fs.writeFileSync(path.join(full, 'probe.txt'), 'from the moved build');
    });

    test.afterAll(() => fs.rmSync(full, { recursive: true, force: true }));

    test('a folder of reports/ is served instead of .eleventy', async () => {
        const { child, text, port } = await start(folder);
        try {
            expect(text).toContain(`Serving ${folder} on`);
            const response = await fetch(`http://localhost:${port}/probe.txt`);
            expect(await response.text()).toBe('from the moved build');
        } finally {
            child.kill();
        }
    });

    for (const output of ['../outside', 'reports/../..', '.']) {
        test(`ELEVENTY_OUTPUT=${output} is ignored for .eleventy`, async () => {
            const { child, text } = await start(output);
            child.kill();
            expect(text).toMatch(/Serving \.eleventy on|No build in \.eleventy/);
        });
    }
});
