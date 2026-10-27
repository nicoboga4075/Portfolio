# Security Policy

## Scope

This security policy applies to:

- The code and content in this portfolio repository
- The live site hosted at [https://nicoboga.netlify.app](https://nicoboga.netlify.app)

## Not in Scope:

- Third-party services or libraries integrated into the site (e.g. contact form providers, analytics tools)

If you discover an issue with a third-party service, please report it directly.

## Fonts

- **Poppins**: loaded online from *Google Fonts* (a third-party request to Google)
- **Local fallbacks**, never downloaded, with metrics adjusted to Poppins: *Arial* (Windows), *Helvetica Neue* / *Helvetica* (macOS, iOS), *Liberation Sans* (Linux), *Roboto* (Android)

## Icons

- **Flaticon** (average)
- **Icomoon** (small)

## Utilities

Versions are tracked in [`.github/vendor-versions.json`](.github/vendor-versions.json) and checked weekly by the [`vendor-versions`](.github/workflows/vendor-versions.yml) workflow, which opens a GitHub issue when an update is available. See [README.md](README.md#-vendored-libraries) for the full list of vendored libraries and what each one is used for.

### Major versions held back on purpose

These libraries and tools are intentionally kept below their latest major release. None of this is a security risk on its own (unlike the CVEs below) - it's a stability/compatibility trade-off that needs dedicated testing before it can be lifted:

| Component | Pinned | Latest | Why it's held back | Status | Acknowledgement |
|---|---|---|---|---|---|
| **jQuery** | 3.7.1 | 4.0.0 | jQuery 4 drops legacy event API methods (`.bind()`/`.unbind()`/`.delegate()`/`.undelegate()`) and other old helpers (`$.isFunction`, `$.trim`, ...) that some vendored plugins here (Stellar.js, Owl Carousel, jQuery Easing - all written 2013-2017) may still call internally. jQuery Migrate exists to bridge exactly this gap, but Migrate 3.6.0 (pinned to jQuery 3.x) covers more of these than Migrate 4.x does, so jumping both to 4.x doesn't fully remove the risk. | Held back, tracked in [#462](https://github.com/nicoboga4075/Portfolio/issues/462) | :hourglass: |
| **jQuery Migrate** | 3.6.0 | 4.0.2 | Follows jQuery's version, not an independent choice - it only makes sense to bump once jQuery itself moves to 4.x. | Held back, tracked in [#463](https://github.com/nicoboga4075/Portfolio/issues/463) | :hourglass: |
| **Bootstrap** | 4.6.2 | 5.3.8 | Bootstrap 5 drops jQuery entirely and replaces Popper.js v1 (`js/popper.min.js`, used here) with the incompatible `@popperjs/core` v2 API, breaking every dropdown/tooltip/popover. It also renames utility classes (`.ml-*`/`.mr-*` → `.ms-*`/`.me-*`, `.text-left`/`.text-right` → `.text-start`/`.text-end`) and namespaces data attributes (`data-toggle` → `data-bs-toggle`) used throughout the site's HTML, not just in the vendored JS - this would require rewriting markup across every page, not just swapping a file. | Held back, tracked in [#464](https://github.com/nicoboga4075/Portfolio/issues/464) | :hourglass: |
| **Animate.css** | 3.7.2 | 4.1.1 | v4 prefixes every class with `animate__` (`.fadeInUp` → `.animate__fadeInUp`), while `app.js` adds unprefixed classes like `fadeInUp`/`ftco-animated` dynamically on scroll. The break would be silent - no JS error, animations just stop firing. | Held back, tracked in [#465](https://github.com/nicoboga4075/Portfolio/issues/465) | :hourglass: |
| **TypeScript** | 6.0.3 | 7.0.2 | TypeScript 7 (the native compiler) no longer ships the JavaScript compiler API, and the `typescript` peer ranges of `typescript-eslint` (`<6.1.0`) and `ts-jest` (`<7`) exclude it: `npm install` fails, and ESLint can't lint `netlify/functions/**/*.mts`. | Held back, tracked in [#434](https://github.com/nicoboga4075/Portfolio/issues/434) | :hourglass: |
| **Node.js** | 22.23.4 (LTS "Jod") | 24.22.1 (Active LTS "Krypton") | Node 22 is still a supported LTS. Moving to 24 means reinstalling the global tools of nvm-windows (with a hand patch of `netlify-cli`), meeting npm 12's Node requirement and aligning the CI jobs and the GitLab runner. The CI build already runs on the LTS releases of 20 (`lts/iron`), 22 (`lts/jod`) and 24 (`lts/krypton`), 20 being kept for backward compatibility. | Held back, tracked in [#435](https://github.com/nicoboga4075/Portfolio/issues/435) | :hourglass: |

## npm overrides

`overrides` in `package.json` force a version of a transitive dev dependency that a package still asks for in an older, vulnerable or unmaintained version. All of them are dev only: nothing here is shipped with the site. `npm run check:overrides` (the `check-overrides` skill) tells after each dependency update which ones are still needed.

| Override | Forces | Comes through | Why | Added in |
|---|---|---|---|---|
| `nwsapi` | 2.2.27 | `netlify-plugin-inline-critical-css` → `critical` → `inline-critical` → `jsdom` 16 | Pinned below 2.2.28, which broke the Netlify deploy: 2.2.28 lost the helper of its media pseudo-class resolvers ([dperini/nwsapi#218](https://github.com/dperini/nwsapi/issues/218)), fixed by [dperini/nwsapi#219](https://github.com/dperini/nwsapi/pull/219) but not released yet. Remove the override once a release after 2.2.28 ships the fix | 42cd9ee |
| `@tootallnate/once` | ^2.0.1 | … `jsdom` 16 → `http-proxy-agent` 4 | Low advisory GHSA-vpq2-c234-7xj6 in 1.1.2; version 2 exports the same function | 9da9e45 |
| `js-yaml@^3 > argparse` | ^2.0.1 | `@11ty/eleventy` → `gray-matter` → `js-yaml` 3 | Drops the vulnerable `sprintf-js` of `argparse` 1 (GHSA-hp3w-g68c-fv3c) | 7e4c8c2 |
| `inline-critical > css` | `npm:@adobe/css-tools@^4.5.0` | `critical` → `inline-critical` 8 | `css` is unmaintained and pulled `decode-uri-component` 0.2.2 (4 moderate advisories); only its CLI used it | d9f2468 |
| `critical > oust` | ^2.0.4 | `critical` 4 | `oust` 2 uses `cheerio` 1, dropping `nth-check` 1 and `lodash.pick` (high advisories); same stylesheets found | 4e6ae6b |
| `critical > postcss-image-inliner` | ^7.0.1 | `critical` 4 | Version 7 uses `svgo` 3, dropping `nth-check` 1 (high advisory); only loaded, `inlineImages` is off | 4e6ae6b |
| `@capacitor/cli > xcode > uuid` | ^11.1.1 | `@capacitor/cli` → `xcode` 3 | Medium advisory GHSA-w5hq-g745-h8pq in `uuid` 7 | 1b49b05 |

## Vulnerability Disclosure Log

| Date             | Description                   | Criticity | Status                             | Acknowledgement    |
|------------------|-------------------------------|-----------|-------------------------------------|--------------------|
| 2020-04-29       | **CVE-2020-11022** : *jQuery* | Medium    | Patched, jQuery upgraded to 3.7.1  | :white_check_mark: |
| 2020-04-29       | **CVE-2020-11023** : *jQuery* | Medium    | Patched, jQuery upgraded to 3.7.1  | :white_check_mark: |
| 2023-06-26       | **CVE-2020-23064** : *jQuery* | Medium    | Patched, jQuery upgraded to 3.7.1  | :white_check_mark: |
| 2026-09-25       | **CVE-2026-19693** (GHSA-7pqw-9j4j-h8q3) : *extract-zip* (via Puppeteer 2.1.1 of `netlify-plugin-inline-critical-css`, dev only) | High | Accepted risk, no patched release; goes away with [#436](https://github.com/nicoboga4075/Portfolio/issues/436). Not exploitable: Puppeteer only extracts the Chromium archive it downloads at install | :hourglass: |
| 2026-09-25       | **CVE-2026-56876** (GHSA-jmr9-qjv8-65gv) : *extract-zip* (same path) | High | Accepted risk, no patched release; goes away with [#436](https://github.com/nicoboga4075/Portfolio/issues/436). Not exploitable, for the same reason | :hourglass: |
| 2026-10-03       | **CVE-2026-93687** (GHSA-vfj7-8cjw-p6xm) : *braces* (via Eleventy's chokidar and browser-sync's micromatch, dev only) | High | Closed, advisory withdrawn by GitHub on 2026-10-23 ([#433](https://github.com/nicoboga4075/Portfolio/issues/433)); `npm audit` no longer reports it. It was not exploitable: braces only expands the project's own build and watch globs, never untrusted input | :white_check_mark: |
| 2026-10-10       | **CodeQL** *actions/missing-workflow-permissions* : the 3 jobs of `.github/workflows/node.js.yml` | Medium | Patched, each job declares `permissions: contents: read` | :white_check_mark: |
| 2026-10-11       | **CodeQL** *js/incomplete-multi-character-sanitization* : `plainText` in `.eleventy.js` | Low | Patched, tags are stripped until none is left, then any lone `<` or `>`. Not exploitable: it only reads `_data` and its output is escaped | :white_check_mark: |
| 2026-10-11       | **GHSA-86w9-cpqp-85rv** : *node-forge* (via `@sonar/scan`, dev only) | High | Accepted risk (Dependabot alert dismissed as tolerable risk), no patched release yet ([#461](https://github.com/nicoboga4075/Portfolio/issues/461)). Not exploitable: `@sonar/scan` only reads PKCS#12 truststores and never verifies RSA signatures | :hourglass: |
| 2026-10-24       | **GHSA-4qv8-2p9j-2685**, **GHSA-f72v-6w45-q472**, **GHSA-xjj6-f33q-929c** : *undici* (via cheerio of `netlify-plugin-inline-critical-css`, dev only) | High | Patched, undici upgraded to 7.30.1 (`npm audit fix`) | :white_check_mark: |
| 2026-10-24       | **GHSA-w74x-v6f9-j3xg**, **GHSA-xhq7-xmqj-769h**, **GHSA-wjr9-j795-jxcr**, **GHSA-333x-w4r6-6crp** : *fast-uri* (via ajv of html-validate and Stylelint, dev only) | Medium | Patched, fast-uri upgraded to 3.1.9 (`npm audit fix`) | :white_check_mark: |
| 2026-10-21       | **CVE-2026-111497** (Brotli out-of-bounds write, remote code execution), **CVE-2026-106069**, **CVE-2026-105483** (TLS hostname check bypass), **CVE-2026-105482** (`dns.resolve` NUL truncation) and 6 others : *Node.js* 22.23.3 (`.nvmrc`, Netlify build and CI) | High | Patched, Node.js upgraded to 22.23.4 in `.nvmrc`; `lts/iron` (Node 20, end of life) gets no fix and stays in the build matrix only. Low exposure: the functions only `fetch` the GitHub API and Supabase, never a URL from the request | :white_check_mark: |
| 2026-10-13       | **Snyk Code** *javascript/HttpToHttps* : the static server of `.claude/skills/wcag-contrast/check-contrast.mjs` (dev only) | Medium | False positive, ignored in Snyk as not vulnerable. Not exploitable: the server listens on `localhost` only and serves the local build to the contrast check | :white_check_mark: |
| 2026-10-20       | **Snyk Code** *javascript/Ssrf* : `serveDocsPublic` in `dev-watch.js` (dev only) | High | False positive, ignored in Snyk as not vulnerable. Not exploitable: the host and port are fixed (netlify dev's static server on `localhost`) and only a `/docs/public/` path normalised by `new URL` comes from the request, so no other host can be reached | :white_check_mark: |
| 2026-10-20       | **Snyk Code** *javascript/HttpToHttps* : `dev-watch.js` (proxy, port probe, start-up poll), `.claude/hooks/translation-hook-server.mjs` and the server of `.claude/marketplace/plugins/portfolio-dev/mcp/portfolio-mcp.mjs` (dev only) | Medium | False positive, the 5 findings ignored in Snyk as not vulnerable. Not exploitable: each server or request stays on `localhost`, nothing crosses the network | :white_check_mark: |
| 2026-10-20       | **Snyk Code** *javascript/HttpToHttps/test* : `tests/serve-build.mjs` (tests only, then in `.claude/skills/robot-test/`) | Low | False positive, ignored in Snyk as not vulnerable. Not exploitable: the test server listens on `localhost` only | :white_check_mark: |
| 2026-10-20       | **Snyk Code** *javascript/HardcodedNonCryptoSecret/test* : `tests/jest/netlify/visit.test.ts` (tests only) | Low | False positive, ignored in Snyk as not vulnerable: `anon-key` is a fake key set by the test itself, not a real secret | :white_check_mark: |
| 2026-10-20       | **CodeQL** *js/clear-text-storage-of-sensitive-data* : the Gmail OAuth token of the contact form in `sessionStorage` (`sendEmail` of `js/app.js`) | High | Patched, the token stays in memory (`appGmailToken`) for the next messages of the page, never in a storage, and is forgotten after a failed send | :white_check_mark: |
| 2026-10-20       | **CodeQL** *js/incomplete-multi-character-sanitization* : the card title of `tests/playwright/project-cards.browser.spec.js` (tests only) | Low | Patched, the spec reads the title the page shows instead of stripping the tags of `_data` with a regex. Not exploitable: it only compared a title in a test | :white_check_mark: |
| 2026-10-21       | **CVE-2026-111758** (GHSA-gfr2-rv44-r23c) : *markdown-it* (via Eleventy, dev only) | High | Patched, markdown-it 14.3.3 in `package-lock.json`. Not exploitable: markdown-it only renders the repository's own content at build time, never visitor input | :white_check_mark: |
| 2026-10-21       | **CVE-2026-111766** (GHSA-vfgh-jcmw-g37q) : *markdown-it* (same path) | Low | Patched, markdown-it 14.3.3 in `package-lock.json`. Not exploitable, for the same reason | :white_check_mark: |

Dependabot alerts on dev dependencies that a version update fixes are not listed one by one: Dependabot closes them with its pull requests (see the repository's Security tab).

*This section will be updated if and when vulnerabilities are responsibly disclosed.*
 
## Security Best Practices

To maintain the security of this portfolio, I follow these practices:

- **HTTPS enforced** :white_check_mark:: All traffic is served over HTTPS to prevent data interception.
- **Content Security Policy (CSP)**: CSP headers are configured to mitigate cross-site scripting (XSS) and data injection attacks. `script-src` still allows `'unsafe-inline'` and `'unsafe-eval'`; removing them is tracked in [#399](https://github.com/nicoboga4075/Portfolio/issues/399).
- **Service worker**: `service-worker.js` only handles same-origin `GET` requests, never caches the Netlify functions (`/.netlify/functions/`), and fetches scripts and stylesheets from the network first, so a security fix in a library reaches visitors with the next deploy instead of waiting for a cached copy to expire.
- **Public data files**: `/api/articles.json` and `/api/projects.json` are static files written by the build for the Botpress chatbot. They only hold what the pages already show (titles, dates, tags, excerpts, project contexts and links), never anything read from git, the environment or a secret, and are served with `noindex`.
- **No inline third-party snippet**: Google Analytics is loaded from the site's own `js/analytics.js`, added by the build to the production pages only (not to deploy previews nor local builds), instead of a script injected by Netlify. It loads `gtag.js` from Google after the page has finished loading.
- **Secure hosting**: The site is hosted on *Netlify* with built-in security measures.
- **Protected `main` branch**: A repository ruleset blocks force pushes and deletion of `main`; only the repository admin can bypass it.
- **Interaction limits**: Opening issues and pull requests and commenting are limited to collaborators (renewed every six months).
- **Netlify functions for the site only**: `isTrustedRequest` (`netlify/functions/shared/http.mts`) answers only the requests whose `Referer` is the site (`homepage` of `package.json`), a `*.netlify.live` tunnel or the local site on `http://localhost` (any port), the last two only under `netlify dev` (`CONTEXT` is `dev`), never in production; any other request is sent to `/404`.
- **Install scripts allowed one by one**: npm 12 runs the install scripts of a dependency only when `allowScripts` of `package.json` lists it, pinned to the reviewed version (`<name>@<version>`). The CI installs with `npm ci --ignore-scripts`, so no install script runs there.
- **Least-privilege CI**: The default `GITHUB_TOKEN` is read-only, and every GitHub Actions job declares its own `permissions` (`contents: read` unless more is needed).
- **Automated scanning**: *Dependabot* (dependency alerts, npm updates every day and GitHub Actions updates every week), *CodeQL* and *SonarCloud* analyse every change; *Snyk* (Snyk Code and Snyk Open Source, run locally with the Snyk CLI, no Snyk token stored in the GitHub or GitLab CI) checks the code and the dependencies too, its false positives ignored one finding at a time as not vulnerable, with their reason.
- **AI automation boundaries**: The Claude Code workflows only review pull requests of the owner and Dependabot, only answer `@claude` from people with write access (never from bots, so they can't trigger themselves), and cannot modify `.github/workflows/`. The review of a Dependabot update installs the updated lockfile with `npm ci --ignore-scripts` and lets Claude run only `gh pr view`, `gh pr diff`, `gh pr comment`, `gh issue list`, `gh issue view`, `npm run check:overrides` and `npm audit`: it reports the overrides, `allowScripts` pins and issues to change in its comment, never pushes nor edits an issue. On the owner's pull requests, a second step after the review reads the issues the same way (`gh pr view`, `gh pr diff`, `gh issue list`, `gh issue view`) and comments which to close, update or open, without editing any. The `@claude` job can push a branch and open a pull request (`contents: write`, `pull-requests: write`, and `gh pr create` as its only `gh` command), but not merge it, and the ruleset of `main` still applies. The weekly Claude Code routine (see "Claude Code routine" in README.md) only reads the repository, the owner's Gmail, the public SonarCloud API and the npm audit of the lock file, treats what it reads as data, never as instructions, and sends one email to the owner's own address and nobody else; it holds the expiry dates of the tokens, never their values, and never edits, commits or pushes.

## Reporting a Vulnerability

If you discover a security vulnerability in this portfolio, I kindly ask you to report it responsibly.

**Please do not publicly disclose the issue until it has been addressed.**

To report a vulnerability:

1. Send an email at [nicolas.bogalheiro@gmail.com](mailto:nicolas.bogalheiro@gmail.com).
2. Provide a detailed description of the vulnerability.
3. Include steps to reproduce the issue (if possible).
4. Share any relevant logs, screenshots, or proof-of-concept code.

I aim to respond to all reports within **24 hours** and will provide an estimated timeline for remediation.
