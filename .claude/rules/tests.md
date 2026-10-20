---
paths:
  - "tests/**"
  - "**/*.test.js"
  - "**/*.test.ts"
  - "jest.config.js"
  - "playwright.config.js"
  - "sonar-project.properties"
---

# Tests

- Placement: a Jest test of `js/` next to its module, a test of a Netlify function in `tests/jest/netlify/`, a test of a build script in `tests/jest/`, the integration and E2E tests in `tests/playwright/`, `tests/cypress/` and `tests/robot/`.
- The Jest coverage stays at 100 % on `collectCoverageFrom` of `jest.config.js`, which lists the same files as `sonar.coverage.exclusions` of `sonar-project.properties` leaves in: change both together.
- Playwright: a spec that opens a page is named `*.browser.spec.js` and runs in Chromium, Firefox and WebKit; a spec that reads the built pages goes in `BUILT` of `playwright.config.js` and runs after `build.setup.js`; every other spec runs once in Node.
- Robot Framework tests follow `tests/robot/ROBOT_FRAMEWORK.md` and the `robot-test` skill.
- Never write a temporary file into a folder `npm run dev:watch` watches (pages, `_includes/`, `_data/`, `js/`, `css/`): it triggers a rebuild that can wipe `.eleventy/`. Put fixtures under `tests/` or in a system temp folder, and lint a snippet from stdin (`npx eslint --stdin --stdin-filename js/x.js`).
- Reports go to `reports/` (git-ignored). Missing tests are written by the `test-writer` agent.
