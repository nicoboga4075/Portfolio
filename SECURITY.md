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
| **Node.js** | 22.23.3 (LTS "Jod") | 24.21.0 (Active LTS "Krypton") | Node 22 is still a supported LTS. Moving to 24 means reinstalling the global tools of nvm-windows (with a hand patch of `netlify-cli`), meeting npm 12's Node requirement and aligning the CI jobs and the GitLab runner. The CI build already runs on 20.x, 22.x and 24.x, 20.x being kept for backward compatibility. | Held back, tracked in [#435](https://github.com/nicoboga4075/Portfolio/issues/435) | :hourglass: |

## npm overrides

`overrides` in `package.json` force a version of a transitive dev dependency that a package still asks for in an older, vulnerable or unmaintained version. All of them are dev only: nothing here is shipped with the site. `npm run check:overrides` (the `check-overrides` skill) tells after each dependency update which ones are still needed.

| Override | Forces | Comes through | Why | Added in |
|---|---|---|---|---|
| `nwsapi` | 2.2.27 | `netlify-plugin-inline-critical-css` → `critical` → `inline-critical` → `jsdom` 16 | Pinned below 2.2.28, which `jsdom` would get otherwise; no reason recorded | 42cd9ee |
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
| 2026-10-03       | **CVE-2026-93687** (GHSA-vfj7-8cjw-p6xm) : *braces* (via Eleventy's chokidar and browser-sync's micromatch, dev only) | High | Open, no patched release yet ([#433](https://github.com/nicoboga4075/Portfolio/issues/433)). Not exploitable: braces only expands the project's own build and watch globs, never untrusted input | :hourglass: |
| 2026-10-10       | **CodeQL** *actions/missing-workflow-permissions* : the 3 jobs of `.github/workflows/node.js.yml` | Medium | Patched, each job declares `permissions: contents: read` | :white_check_mark: |
| 2026-10-11       | **CodeQL** *js/incomplete-multi-character-sanitization* : `plainText` in `.eleventy.js` | Low | Patched, tags are stripped until none is left, then any lone `<` or `>`. Not exploitable: it only reads `_data` and its output is escaped | :white_check_mark: |
| 2026-10-11       | **GHSA-86w9-cpqp-85rv** : *node-forge* (via `@sonar/scan`, dev only) | High | Accepted risk (Dependabot alert dismissed as tolerable risk), no patched release yet ([#461](https://github.com/nicoboga4075/Portfolio/issues/461)). Not exploitable: `@sonar/scan` only reads PKCS#12 truststores and never verifies RSA signatures | :hourglass: |

Dependabot alerts on dev dependencies that a version update fixes are not listed one by one: Dependabot closes them with its pull requests (see the repository's Security tab).

*This section will be updated if and when vulnerabilities are responsibly disclosed.*
 
## Security Best Practices

To maintain the security of this portfolio, I follow these practices:

- **HTTPS enforced** :white_check_mark:: All traffic is served over HTTPS to prevent data interception.
- **Content Security Policy (CSP)**: CSP headers are configured to mitigate cross-site scripting (XSS) and data injection attacks.
- **Secure hosting**: The site is hosted on *Netlify* with built-in security measures.
- **Protected `main` branch**: A repository ruleset blocks force pushes and deletion of `main`; only the repository admin can bypass it.
- **Interaction limits**: Opening issues and pull requests and commenting are limited to collaborators (renewed every six months).
- **Least-privilege CI**: The default `GITHUB_TOKEN` is read-only, and every GitHub Actions job declares its own `permissions` (`contents: read` unless more is needed).
- **Automated scanning**: *Dependabot* (dependency alerts, npm updates every day and GitHub Actions updates every week), *CodeQL* and *SonarCloud* analyse every change.
- **AI automation boundaries**: The Claude Code workflows only review pull requests of the owner and Dependabot, only answer `@claude` from people with write access (never from bots, so they can't trigger themselves), and cannot modify `.github/workflows/`.

## Reporting a Vulnerability

If you discover a security vulnerability in this portfolio, I kindly ask you to report it responsibly.

**Please do not publicly disclose the issue until it has been addressed.**

To report a vulnerability:

1. Send an email at [nicolas.bogalheiro@gmail.com](mailto:nicolas.bogalheiro@gmail.com).
2. Provide a detailed description of the vulnerability.
3. Include steps to reproduce the issue (if possible).
4. Share any relevant logs, screenshots, or proof-of-concept code.

I aim to respond to all reports within **24 hours** and will provide an estimated timeline for remediation.
