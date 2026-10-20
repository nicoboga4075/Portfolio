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
- Playwright: a spec that opens a page is named `*.browser.spec.js`, takes `test` from `./site` (the preview build served on a free port as `baseURL`, the service worker blocked, the `article` function answered with the built article) and runs in Chromium, Firefox and WebKit after the build; a spec that reads the built pages goes in `BUILT` of `playwright.config.js` and runs after `build.setup.js`; every other spec runs once in Node.
- Cypress: specs in `tests/cypress/e2e/*.cy.js`, run with `npm run cypress` (`tests/cypress.config.js` builds and serves the site and sets `baseUrl`); they read the site data from `_data/` and `package.json`, and their screenshots go to `reports/cypress/`.
- Robot Framework tests follow `tests/robot/ROBOT_FRAMEWORK.md` and the `robot-test` skill.
- Never write a temporary file into a folder `npm run dev:watch` watches (pages, `_includes/`, `_data/`, `js/`, `css/`): it triggers a rebuild that can wipe `.eleventy/`. Put fixtures under `tests/` or in a system temp folder, and lint a snippet from stdin (`npx eslint --stdin --stdin-filename js/x.js`).
- If every stylesheet suddenly fails with a MIME type `text/html` error, `dev:watch` has emptied `.eleventy/css/`: copy `css/*.css` back or restart `npm run dev:watch`.
- Before a browser check on the local site, make sure the served file holds the new code (`curl localhost:8888/css/app.css`, or grep `.eleventy/`): Eleventy `--watch` sometimes skips a copy or stops watching, and `netlify dev` can hang at start-up. Restart only the `dev:watch` process tree, never someone else's node process.
- A Playwright check that swaps a CSS or JS file with `page.route` (a "without this rule" test) creates its context with `serviceWorkers: 'block'`: the service worker otherwise serves the cached file and the route never fires.
- A blank screenshot of a long page (blog with an article, contact section) can be a browser rendering timeout: confirm with `getComputedStyle` or `getBoundingClientRect` before calling it a bug.
- Reports go to `reports/` (git-ignored). Missing tests are written by the `test-writer` agent.
