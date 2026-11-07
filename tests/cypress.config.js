// Cypress runs on the preview build of the site (npm run cypress, --project tests): it builds it into reports/cypress/site/, serves it on a free port with serve-build.mjs, and points baseUrl at it.
const { defineConfig } = require('cypress');
const { execFileSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..');
// Its own build folder (ELEVENTY_OUTPUT, read by .eleventy.js and serve-build.mjs), not .eleventy/: a rebuild of npm run dev:watch there can empty js/ under a running test, and the page then fails with "initPage is not defined"
const env = { ...process.env, ELEVENTY_PREVIEW: '1', ELEVENTY_OUTPUT: 'reports/cypress/site' };

// Builds the preview of the site, as build.setup.js does for Playwright: ELEVENTY_PREVIEW leaves the page sources alone
function build() {
    execFileSync(process.execPath, [path.join(root, 'node_modules', '@11ty', 'eleventy', 'cmd.cjs')], { cwd: root, env, stdio: 'inherit' });
}

// Starts serve-build.mjs, stopped with the Cypress process, and resolves with its address once it has written the port it got
function serve() {
    const portFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-serve-')), 'port');
    const child = spawn(process.execPath, [path.join(root, 'tests', 'serve-build.mjs'), '--port-file', portFile], { cwd: root, env, stdio: 'ignore' });
    process.on('exit', () => child.kill());
    return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
            if (fs.existsSync(portFile) && fs.readFileSync(portFile, 'utf8')) {
                clearInterval(timer);
                resolve(`http://localhost:${fs.readFileSync(portFile, 'utf8')}`);
            }
        }, 100);
        child.on('exit', code => {
            clearInterval(timer);
            reject(new Error(`serve-build.mjs exited with code ${code}`));
        });
    });
}

module.exports = defineConfig({
    // Screenshots of the failed tests in reports/cypress/screenshots/ (git-ignored), the only folder the CI jobs keep, not the build next to it; no video
    screenshotsFolder: '../reports/cypress/screenshots',
    video: false,
    // The specs read the site data from _data/ and package.json, not from fixtures
    fixturesFolder: false,
    e2e: {
        specPattern: 'cypress/e2e/**/*.cy.js',
        supportFile: 'cypress/support/e2e.js',
        async setupNodeEvents(_on, config) {
            build();
            config.baseUrl = await serve();
            return config;
        }
    }
});
