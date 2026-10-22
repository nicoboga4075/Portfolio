// The test of the *.browser.spec.js specs: the preview build served on a free port by serve-build.mjs, once per worker, as the baseURL of page.goto, with the site data the specs check the pages against.
const base = require('@playwright/test');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const data = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

// Starts serve-build.mjs and resolves with its address once it has written the port it got
function serve() {
    const portFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-serve-')), 'port');
    const child = spawn(process.execPath, [path.join(root, 'tests', 'serve-build.mjs'), '--port-file', portFile], { cwd: root, stdio: 'ignore' });
    return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
            if (fs.existsSync(portFile) && fs.readFileSync(portFile, 'utf8')) {
                clearInterval(timer);
                resolve({ url: `http://localhost:${fs.readFileSync(portFile, 'utf8')}`, child });
            }
        }, 100);
        child.on('exit', code => {
            clearInterval(timer);
            reject(new Error(`serve-build.mjs exited with code ${code}`));
        });
    });
}

exports.test = base.test.extend({
    // Playwright reads the fixtures a fixture needs from its first parameter, which must be a destructuring pattern even when it needs none
    // eslint-disable-next-line no-empty-pattern
    siteUrl: [async ({}, use) => {
        const { url, child } = await serve();
        await use(url);
        child.removeAllListeners('exit');
        child.kill();
    }, { scope: 'worker' }],
    baseURL: async ({ siteUrl }, use) => {
        await use(siteUrl);
    },
    // The blog page loads its article from the article function, which serve-build.mjs doesn't serve: answer it with the built article, as the function does
    page: async ({ page }, use) => {
        await page.route('**/.netlify/functions/article?*', route => {
            const filename = new URL(route.request().url()).searchParams.get('filename');
            route.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(root, '.eleventy', 'articles', filename), 'utf8') });
        });
        await use(page);
    }
});
exports.expect = base.expect;
exports.data = data;
exports.langs = Object.keys(data('package.json').config.locales);
