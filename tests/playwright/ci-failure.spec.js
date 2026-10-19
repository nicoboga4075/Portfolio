// A test that fails on purpose, on the ci-failure-check branch only, to check that a failed Playwright test turns both pipelines red (#479); never merged.
const { test, expect } = require('@playwright/test');

test('fails on purpose', () => {
    expect(1).toBe(2);
});
