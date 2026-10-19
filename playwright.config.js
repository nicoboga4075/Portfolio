const { defineConfig, devices } = require('@playwright/test');

// The specs that read the pages of the preview build
const BUILT = ['**/seo-meta.spec.js', '**/config-links.spec.js'];

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
        // The tests that open a page, named *.browser.spec.js, run in each browser
        { name: 'Chromium', testMatch: '**/*.browser.spec.js', use: { ...devices['Desktop Chrome'] } },
        { name: 'Firefox', testMatch: '**/*.browser.spec.js', use: { ...devices['Desktop Firefox'] } },
        { name: 'WebKit', testMatch: '**/*.browser.spec.js', use: { ...devices['Desktop Safari'] } }
    ]
});