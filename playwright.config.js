const { defineConfig, devices } = require('@playwright/test');

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
        { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'Firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'WebKit', use: { ...devices['Desktop Safari'] } }
    ]
});