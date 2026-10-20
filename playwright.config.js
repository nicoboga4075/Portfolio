const { defineConfig, devices } = require('@playwright/test');

// The specs that read the pages of the preview build: the head metas, the links of the config, and the contrast checker and the MCP server, which serve or read .eleventy/
const BUILT = ['**/seo-meta.spec.js', '**/config-links.spec.js', '**/check-contrast.spec.js', '**/portfolio-mcp.spec.js'];

module.exports = defineConfig({
    // Only the Playwright tests: tests/jest, tests/cypress and tests/robot belong to the other runners
    testDir: './tests/playwright',
    fullyParallel: true,
    retries: 1,
    reporter: [
        ['list'],
        ['junit', {
            outputFile: './reports/playwright/junit.xml'
        }],
        ['html', {
            outputFolder: './reports/playwright/html',
            open: 'never'
        }]
    ],
    outputDir: './reports/playwright/test-results',
    use: {
        headless: true,
        screenshot: 'only-on-failure',
        video: 'off'
    },
    projects: [
        // The preview build of the site, once, before the specs that read the built pages
        { name: 'Build', testMatch: '**/build.setup.js' },
        // The specs that read the built pages of .eleventy/, after the build
        { name: 'Built', testMatch: BUILT, dependencies: ['Build'] },
        // The other tests without a browser (scripts, templates rendered alone), run once: every spec but the built and *.browser.spec.js ones
        { name: 'Node', testIgnore: ['**/*.browser.spec.js', ...BUILT] },
        // The tests that open a page of the preview build (served by site.js), named *.browser.spec.js, run in each browser after the build, the service worker blocked so every page comes from the build
        { name: 'Chromium', testMatch: '**/*.browser.spec.js', dependencies: ['Build'], use: { ...devices['Desktop Chrome'], serviceWorkers: 'block' } },
        { name: 'Firefox', testMatch: '**/*.browser.spec.js', dependencies: ['Build'], use: { ...devices['Desktop Firefox'], serviceWorkers: 'block' } },
        { name: 'WebKit', testMatch: '**/*.browser.spec.js', dependencies: ['Build'], use: { ...devices['Desktop Safari'], serviceWorkers: 'block' } }
    ]
});