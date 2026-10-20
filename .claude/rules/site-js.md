---
paths:
  - "js/**/*.js"
  - "service-worker.js"
---

# Site JavaScript

- The scripts of `js/` are classic browser scripts, not ES modules: no `import` or `export`. `js/common.js` loads first, then `js/app.js` (home and blog) or `js/standalone.js` (policy, terms, 404, articles, projects).
- A helper used by both `app.js` and `standalone.js` goes in `common.js`, and its name goes in the `globals` block of `js/standalone.js` and `js/app.js` in `eslint.config.mjs`; a name only `app.js` uses goes in the `js/app.js` block.
- A function called from inline HTML or an external callback is listed in the `varsIgnorePattern` of `no-unused-vars` in `eslint.config.mjs`.
- Declare the functions and constants a test needs at the top level of the script: `tests/jest/transform.cjs` exports only the top-level `function`, `const`, `let` and `class` declarations to the Jest tests.
- No text shown to visitors in the scripts: use `getMessage('key')` with the key in `_data/messages.json` in every language.
- Syntax ES2022 at least (see the comment on `ecmaVersion` in `eslint.config.mjs`); no API newer than ES2023 (`Object.groupBy`, `Promise.withResolvers`...), which Node 20 of the CI lacks.
- Each `fetch` to a new origin, and each new third-party script, needs its entry in the CSP of `_headers` and an update of SECURITY.md (`update-docs` skill).
- Never edit, lint or reformat the vendored `*.min.js`: a new version is downloaded by hand and recorded in `.github/vendor-versions.json`, then README.md is updated (`update-docs` skill).
- `js/analytics.js` is only added by the production build on Netlify: never add Google Analytics elsewhere.
- `service-worker.js` is network first for pages, scripts and styles: a change of its cached list or strategy needs its test `js/service-worker.test.js` updated.
- Each change of a script comes with its Jest test next to it (`js/app.js` → `js/app.test.js`), and the coverage stays at 100 %.
