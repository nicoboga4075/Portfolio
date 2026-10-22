// Cypress runs on the preview build of the site (npm run cypress, --project tests): it builds it into .eleventy/, serves it on a free port with serve-build.mjs, and points baseUrl at it.
const { defineConfig } = require('cypress');
const { execFileSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..');

// Builds the preview of the site, as build.setup.js does for Playwright: ELEVENTY_PREVIEW leaves the page sources alone
function build() {
    execFileSync(process.execPath, [path.join(root, 'node_modules', '@11ty', 'eleventy', 'cmd.cjs')], { cwd: root, env: { ...process.env, ELEVENTY_PREVIEW: '1' }, stdio: 'inherit' });
}

// Starts serve-build.mjs, stopped with the Cypress process, and resolves with its address once it has written the port it got
function serve() {
    const portFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-serve-')), 'port');
    const child = spawn(process.execPath, [path.join(root, 'tests', 'serve-build.mjs'), '--port-file', portFile], { cwd: root, stdio: 'ignore' });
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
    // Screenshots of the failed tests in reports/cypress/ (git-ignored), kept by the CI jobs; no video
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
