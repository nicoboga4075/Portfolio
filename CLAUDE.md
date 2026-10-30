# CLAUDE.md

## Project

Bilingual portfolio (English and French) of Nicolas BOGALHEIRO, software engineer: profile, experiences, projects, certifications and blog articles.
It is a static site built with Eleventy and Nunjucks and deployed on Netlify, with Netlify functions in TypeScript, a Botpress chatbot and an offline service worker.
An Android app wraps it with Capacitor. CI runs on GitHub Actions and GitLab CI, with SonarCloud for quality and coverage.

## Stack

| Area | Tools (major version) |
|---|---|
| Runtime | Node.js 22.23.4 (`.nvmrc`, read by Netlify and the GitHub workflows; CI build matrix `lts/iron` (20), `lts/jod` (22) and `lts/krypton` (24)), npm >= 10 |
| Site | Eleventy 3, Nunjucks 3, HTML 5, CSS 3, Vanilla JS (ES2022 minimum), Terser 5 |
| Functions | Netlify Functions 6, TypeScript 6 |
| Mobile | Capacitor 8 (Android) |
| Tests | Jest 30, Playwright 1, Cypress 16, Robot Framework (SeleniumLibrary) |
| Lint | ESLint 10, typescript-eslint 8, Stylelint 17, html-validate 11, Prettier 3 |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local site on http://localhost:8888 (`npm run dev:watch` rebuilds on change) |
| `npm run build` | Netlify build: redirects, Eleventy, minified JS. It writes over the source pages, so for a local preview use `npm run dev` or `ELEVENTY_PREVIEW=1 npx eleventy` (output in `.eleventy/`) |
| `npm test` | Every test suite: Jest, Cypress, Playwright, Robot Framework |
| `npm run jest` | Unit tests with coverage (`reports/jest/coverage`) |
| `npm run playwright` / `npm run cypress` / `npm run robot` | One end-to-end suite |
| `npm run lint` | html-validate, Stylelint and ESLint (`lint:html`, `lint:css`, `lint:js` one by one) |

## Environment and setup

- Node.js of `.nvmrc` (22.23.4; 20 or later works) and npm 10 or later, then `npm ci` (the `postinstall` hides the generated folders).
- Always use an LTS version of Node.js for the builds and the tests (`.nvmrc`, Netlify, the GitHub workflows, the GitLab runner), never a Current (odd) release; Node 20, past its end of life, stays in the CI build matrix as `lts/iron` (its last LTS release, 20.20.2) for backward compatibility only.
- Netlify CLI installed globally (`npm install -g netlify-cli`), logged in and linked to the site: `dev-watch.js` runs it from next to `node`, and `netlify dev` brings the environment variables and the functions.
- Environment variables, set in Netlify, never in the repository: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (visit counter), `GITHUB_API_TOKEN` (date of the last CV commit), `ENV_CLIENT_ID` (Google OAuth client of the contact form, Gmail send), `SITE_RECAPTCHA_KEY` (under `netlify dev` the `env` function hands back Google's test key). CI secrets: `SONAR_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN`.
- Robot Framework: Python with `pip install --require-hashes -r tests/robot/requirements.txt` (the lock of `requirements.in`: change a version in `requirements.in`, then lock again with the pip-compile command at its top). Cypress: its binary with `npm run cypress:install`; Playwright: its browsers with `npm run playwright:install`. Android: Android Studio and `adb` (`npm run adb:reverse` forwards port 8888).
- Main dev machine on Windows (PowerShell and Git Bash); Netlify builds on Linux; the GitLab runner is a self-hosted Windows runner (`windows-local`), only up while that computer is on.
- Local ports (8888, 3999, the free proxy port, 4799 for the translation hook): see "Local Ports" in README.md.

## Architecture

- **Pages**: HTML files with a front matter, one per language (`index_en.html`, `index_fr.html`, `blog_*`, `policy_*`, `terms_*`, `404.html`), laid out by `_includes/base.njk` with the partials of `_includes/`. Articles in `articles/<slug>_<lang>.html`, project pages in `projects/<id>_<lang>.html`, each folder with its `*.11tydata.js` and `resolve-*.js`.
- **Data**: `_data/*.json` holds every text of the site, each value keyed by language (`{ "en": ..., "fr": ... }`), read in templates as `x[lang]`. `package.json` `config` holds the site settings: locales, routes (`appRoutes`), profile figures, Botpress, socials, CV languages.
- **Build**: `.eleventy.js` compiles the pages in place for Netlify (into `.eleventy/` with `ELEVENTY_PREVIEW`) and writes `sitemap.xml`, `feed_*.xml` and `api/articles.json`, `api/projects.json` (for the chatbot). `gen-redirects.js` writes `_redirects` from `package.json` (pretty URLs `/en`, `/fr/blog`, `/en/<project>`), never edit it by hand. `uglify-code.js` minifies the site scripts.
- **Front-end**: `js/common.js` (shared helpers) loads before `js/app.js` (home and blog: sections, blog, contact form, chart, translations with i18next) or `js/standalone.js` (light pages: policy, terms, 404, articles, projects). `js/botpress.js` (chatbot), `js/analytics.js` (Google Analytics, production build only, loaded after consent in the banner of `_includes/footer.html`), `service-worker.js` (offline, network first). The `*.min.js` files of `js/` and `css/` are vendored, tracked in `.github/vendor-versions.json`, never edited or linted.
- **Netlify functions** (`netlify/functions/*.mts`, called by the front-end with `fetch('/.netlify/functions/<name>')`): `article?filename=<slug>_<lang>.html` returns a compiled article for the blog, `env` returns the public environment variables (or `env?lang=xx` the date of the last CV commit, from the GitHub API), `visit` increments the visit counter (Supabase RPC `increment_visits`). They share `shared/http.mts`: `isTrustedRequest` (same-origin Referer, localhost under `netlify dev`, Lighthouse), `redirectTo404`, `jsonResponse`, `internalError`; every untrusted or invalid request is redirected to `/404`.
- **Netlify config**: `netlify.toml` (build, dev ports, production plugins: HTML minify, inline critical CSS, Lighthouse audits of every page), `_headers` (CSP, cache), `_redirects`.
- **External services**: Netlify (hosting, functions), Supabase (counter), GitHub API, Google (OAuth Gmail, reCAPTCHA, Analytics), Botpress (chatbot), Calendly, SonarCloud.
- **Tooling for Claude Code**: `.claude/` holds the settings, hooks (lint before commit, test reminder, site health, translation check after each `_data` edit, skills table sync), skills, the `test-writer` and `code-janitor` agents, the default `/loop` instructions (`loop.md`) and the `portfolio-dev` plugin (MCP server: articles, projects, preview, site health, translation gaps). Outside the repository, the cloud routine "Portfolio weekly services report" emails a report every Monday (README.md, "Claude Code routine"); when `GITHUB_API_TOKEN`, `SONAR_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN` or the local `GITHUB_PERSONAL_ACCESS_TOKEN` is renewed, update its expiry date in the routine's prompt (`/schedule`).

## Code conventions

- JS of `js/` is classic browser scripts (`sourceType: "script"`, globals shared through `common.js`, declared in `eslint.config.mjs`), with jQuery; semicolons required, `const`/`let` rather than `var`, no `console.log` (only `console.warn` and `console.error`).
- Netlify functions in TypeScript (`.mts`, ES modules): explicit return types, `type` rather than `interface`, no floating promises, imports of `./shared/http.mjs` (the compiled name).
- Every user-visible text goes to `_data/*.json` in every language, never hard-coded in one language; a `getMessage('key')` of `js/` must exist in `_data/messages.json`. Adding a page means adding it in every language.
- CSS sizes in px, not rem or em; a heading level is changed with its tag, never with a `.h5`-style class or a CSS font-size, and the `.h1` to `.h6` classes are never used, not even on a non-heading element.
- Files in LF (`.gitattributes`). Lint must pass with no error and no warning.
- Comments: see "Comments" below.
- A boolean parameter that only picks between two behaviours (flagged by SonarCloud): keep one function, never split it into one function per value. If every caller passes the same value, remove the parameter and the dead branch; if the other variant is used in one place only, write it inline there (e.g. `new Date().toLocaleDateString()`) with a comment in the function naming it; otherwise replace the boolean by a string value (`'date'` or `'datetime'`), since an options object such as `{ complete: true }` is still flagged.
- A backslash-u escape (backslash then `u003c`) typed in an Edit, Write or Bash input lands decoded (`<`) in the file: when a file must hold one (as the JSON-LD escape of `.eleventy.js`), write it from a script that builds the backslash as `chr(92)`, then check the bytes (`od -c`) before committing.

## Git workflow

- One branch, `main`. Commit to `main` only when asked, proposing the gitmoji title first, and never push until asked: every push starts the CI, SonarCloud, the GitLab runner and the Claude review.
- A commit title names what changed ("Refresh the security guidance and the skills"), never a time-relative phrase ("today's changes").
- `origin` fetches from GitHub and pushes to both GitHub and GitLab; `github` and `gitlab` remotes exist for one side only. Never `git pull gitlab` or merge `gitlab/main`: rebase on it and push to GitHub (see CONTRIBUTING.md).
- The two mirrors can drift (a push accepted by one host and rejected by the other): before a push, `git fetch github gitlab` and compare both `main` with the local one. To force one, push each single-host remote with a pinned lease (`git push github main --force-with-lease=main:$(git rev-parse github/main)`, same for `gitlab`): `--force-with-lease` on `origin` fails, its two push URLs confuse the lease.
- Issue labels: `gh label create` always with `--color` and `--description`; every label of the repository has one.
- The GitHub ruleset "Protect main" blocks force pushes and deletion; GitLab `main` is protected.
- Each push to `main` runs GitHub Actions (`node.js.yml`: build on Node 20/22/24, Jest, Playwright, SonarCloud) and GitLab CI, and Netlify builds and publishes unless builds are stopped or auto publishing is locked (`netlify-ops` skill).
- Before each commit the hooks run `npm run lint` (blocking), remind of missing tests, show the site health and sync the skills table.
- Releases: `npm run release -- [patch|minor|major]` bumps the version, writes CHANGELOG.md and tags.

## Reviews

- A review of a Dependabot pull request says which entries of `overrides` in `package.json` must be added, changed or removed (`npm run check:overrides`, `npm audit`), with their row in SECURITY.md, and whether an `allowScripts` pin still names the old version (`npm approve-scripts <name>`): Dependabot updates neither.
- Every review (a pull request or a set of changes) ends with the open issues (`gh issue list --state open`) the change closes, those that need an update (a task done, a description that no longer matches) and the new ones it calls for, proposed to the user rather than edited unasked; or says that none has to change.

## Tests

- Jest unit tests of `js/` sit next to their module (`js/app.js` → `js/app.test.js`); those of the Netlify functions go in `tests/jest/netlify/` (`visit.mts` → `visit.test.ts`), since Netlify deploys every file of `netlify/functions/` as a function; those of the build scripts in `tests/jest/`.
- Coverage is 100 % on the files of `collectCoverageFrom` in `jest.config.js`, which matches `sonar.coverage.exclusions` in `sonar-project.properties`: keep both in step and keep the coverage at 100 % (the SonarCloud quality gate checks the new code).
- Playwright in `tests/playwright/`: `*.browser.spec.js` open a page of the preview build, served by `tests/playwright/site.js`, and run in Chromium, Firefox and WebKit; the specs of `BUILT` in `playwright.config.js` read the preview build made by `build.setup.js`; the others run once in Node.
- Cypress in `tests/cypress/` (`tests/cypress.config.js` builds the preview and serves it) and Robot Framework in `tests/robot/` (follow `tests/robot/ROBOT_FRAMEWORK.md`), run on the built site; the three serve it with `tests/serve-build.mjs`, which has no Netlify function (a Playwright spec answers the `article` function itself).
- Every new or changed behaviour comes with its test (the `test-writer` agent writes the missing ones). Reports go to `reports/` (git-ignored).

## Sensitive areas

- `docs/private/` and `docs/protected/` hold personal documents (ID, diplomas, lease, certificates, bank details): git-ignored, never commit, read, copy or publish them.
- `docs/public/` is served publicly: only what is meant for visitors (CVs, certificates, videos); keep each file well under 50 MB (see "File size").
- Secrets stay in Netlify, GitHub and GitLab settings: never write a key or token in the repository; `env` only returns the variables of its `PUBLIC_ENV_VARS` list.
- `netlify/functions/shared/http.mts` (`isTrustedRequest`) and the filename and lang checks of the functions guard the public endpoints; `_headers` holds the CSP: any new third-party script or endpoint needs its CSP entry and an update of SECURITY.md (`update-docs` skill).
- `npm run build` overwrites the source pages: never run it (nor plain `npx eleventy`) locally to preview; if it happens, `git checkout` the pages.
- The live site: any Netlify change (builds, lock, restore, publish) goes through the `netlify-ops` or `netlify-prod` skill and asks first.
- Never edit the generated files: `_redirects`, `sitemap.xml`, `feed_*.xml`, `api/`, `.eleventy/`, `reports/`, the vendored `*.min.js`.

## Glossary

| Term | Meaning |
|---|---|
| lang, locale | `en` or `fr` (`config.locales` of `package.json`), the `_<lang>` suffix of every page and the key of every text in `_data` |
| slug | The name of an article, its file name without `_<lang>.html` and its `#hash` on the blog page (`blog#mcs`) |
| card | A project of `_data/projects.json` or an article of `_data/blog.json`, shown in the Projects or Blog section |
| explore | The target of a project card's Explore button: an external URL, a project page (`crm_elphicom`) or a blog article (`blog#mcs`) |
| light page, standalone | A page run by `js/standalone.js` (policy, terms, 404, articles, projects) as opposed to the home and blog run by `js/app.js` |
| preview build | `ELEVENTY_PREVIEW=1`, the build into `.eleventy/` used by `npm run dev` and the tests, as opposed to the in-place Netlify build |
| Bien / Pas Bien | The "Good / Not Good" article of good and bad coding practices (SOLID, DRY, KISS, ACID...), one partial `_includes/bien-pasbien-*.html` per principle |
| hire me | Home page section of the job search status (`config.profile.openToWork`: `2` for an active search, `1` when listening to opportunities, `0` to hide it; also shown as the availability badge of the hero) and its contact button |
| counter | Home page section of the profile figures of `config.profile` (certifications, projects, experiences, countries) |
| visit counter | The number of visits shown in `#ftco-visitor`, incremented by the `visit` function (Supabase) on the live site only (https) |

## Commits

Start every commit message with the emoji from [gitmoji.dev](https://gitmoji.dev) that matches the change, as the character itself (not the `:code:`), followed by a space and the subject line. For example:

- `🐛 Fix ...` for a bug fix
- `✨ Add ...` for a new feature
- `💄 Update ...` for UI and style changes
- `♿️ Improve ...` for accessibility
- `♻️ Refactor ...` for a refactor
- `📝 Document ...` for documentation
- `🔧 Configure ...` for configuration files

One emoji per commit: pick the one for the main intent of the change.

Pull request titles follow the same rule: the gitmoji of the main change, then the title. Dependabot gets `⬆️` from the `commit-message` prefix of `.github/dependabot.yml`.

## Comments

Prefer single-line comments, even long ones, in every language (CSS, JS, HTML, Nunjucks): no comment wrapped over several lines, and no numbered lists (`1.`, `2.`) inside a comment. When a comment explains several cases or branches, put one single-line comment on each branch instead of a block above them.

## File size

**Never commit a file of 100 MB or more, whatever the reason.** GitHub refuses any file over 100 MiB and GitLab any new file of 100 MiB or more, and `origin` pushes to both, so one such file blocks every push. Git warns from 50 MiB: keep each file well under that, and compress or host elsewhere (YouTube, Vimeo) a video that would get close, such as `docs/public/Bien_PasBien.mp4` at 95 MB already.

## Rules

The rules of each area live in `.claude/rules/`, loaded only when Claude works on the matching files (`paths:` of their front matter): `site-js.md` (`js/`, `service-worker.js`), `netlify-functions.md`, `data-translations.md` (`_data/`), `pages-templates.md` (pages, `_includes/`, articles, projects), `css.md`, `tests.md` and `ci.md` (`.github/`, `.gitlab/`, `netlify.toml`, `.nvmrc`).

## Skills

The project skills live in `.claude/skills/<name>/SKILL.md`. Use the one that fits before doing the task by hand. The table is kept in step by `.claude/hooks/sync-skills-table.mjs` (after a SKILL.md is written, and before each commit): edit the "Use it to" text freely, the rows and scripts follow the skill folders, and the category comes from `metadata.category` of each SKILL.md frontmatter (`metadata:` then an indented `category:`), which must be one of the nine below: the hook blocks the edit of a SKILL.md and the commit otherwise. Categories: Library & API Reference, Product Verification, Data Fetching & Analysis, Business Process & Team Automation, Code Scaffolding & Templates, Code Quality & Review, CI/CD & Deployment, Runbooks & Troubleshooting, Infrastructure Operations.

<!-- skills:start -->
| Skill | Category | Use it to | Script |
|---|---|---|---|
| `new-article` | Code Scaffolding & Templates | Add a blog article in English and French (pages, data, route, images) | - |
| `new-project` | Code Scaffolding & Templates | Add a project (card, Explore target, pages, redirects, audits) | - |
| `new-language` | Code Scaffolding & Templates | Add or remove a language of the site | - |
| `check-content` | Product Verification | Check that articles and projects are wired everywhere, in the same order | `npm run check:content` |
| `i18n-l10n` | Product Verification | Check the translations and the built pages in every language | `npm run check:translation` |
| `check-links` | Product Verification | Check the external links (status, trailing slash, soft 404) | `npm run check:links` |
| `wcag-contrast` | Product Verification | Check and fix WCAG AA contrast after a colour or style change, only when asked | `npm run contrast`, `npm run contrast:quick` |
| `update-docs` | Business Process & Team Automation | Keep README.md and SECURITY.md in step (vendored libraries, held-back versions, overrides, security log and practices) | `npm run check:docs` |
| `check-overrides` | Code Quality & Review | Tell which npm overrides are still needed after a dependency update | `npm run check:overrides` |
| `netlify-ops` | Infrastructure Operations | Check and operate the live Netlify site (builds, lock, build without cache, restore), asking before any change | `npm run netlify:ops` |
| `netlify-prod` | CI/CD & Deployment | Publish the latest commit of main in one go (`/netlify-prod` only): start the builds, unlock auto publishing, build, publish | - |
| `run-portfolio` | Product Verification | Runs the portfolio locally and drives it in a headless browser | - |
| `fix-ci` | Runbooks & Troubleshooting | Find why the CI of a commit failed on GitHub Actions or GitLab CI (runner off, failed test, quality gate) and fix the cause | `npm run ci:status` |
| `new-experience` | Code Scaffolding & Templates | Add a work or personal experience, an education, a certification or a trip (resume, profile figures, CVs) | - |
| `third-party-apis` | Library & API Reference | Know how each third-party service is used (contact form, captcha, Calendly, Botpress, analytics, GitHub, Supabase), its settings and its CSP origins | - |
<!-- skills:end -->
