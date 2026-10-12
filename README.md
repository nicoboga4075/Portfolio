# Portfolio&nbsp;[![Netlify Status](https://api.netlify.com/api/v1/badges/3ca3f0ca-21e5-4549-a46e-a8dc9a87131c/deploy-status)](https://app.netlify.com/sites/nicoboga/deploys)&nbsp;[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=nicoboga4075_Portfolio&metric=alert_status&token=f7fc3565e07a56df5e54ce88e0c6292896b4b4ef)](https://sonarcloud.io/summary/new_code?id=nicoboga4075_Portfolio)&nbsp;[![Coverage](https://gitlab.com/nicoboga4075/Portfolio/badges/main/coverage.svg)](https://gitlab.com/nicoboga4075/Portfolio/-/pipelines?ref=main)

### 🚀  Live Site
This project is deployed on **Netlify** : https://nicoboga.netlify.app

### 🗂️ Project Structure
The site is built with [Eleventy](https://www.11ty.dev): the pages are HTML files with a front matter, laid out by `_includes/base.njk` and filled from `_data/`. `npm run build` compiles them in place, and the repository root is the folder Netlify publishes.

```
Portfolio/
├── index_en.html, index_fr.html   Home page, one file per language (as are all the pages below)
├── blog_*.html                    Blog
├── policy_*.html, terms_*.html    Privacy policy and terms of use
├── 404.html                       Not found page
├── articles/                      Blog articles (+ articles.11tydata.js, their shared data)
├── projects/                      Project pages (+ projects.11tydata.js, their shared data)
├── _includes/                     base.njk layout and the partials of the pages and articles
├── _data/                         Texts of the site in every language (nav, hero, about, resume, projects, blog...)
├── js/                            Site scripts (app.js, common.js, botpress.js, analytics.js...), vendored *.min.js, Jest tests
├── css/                           Site styles (common.css, app.css, standalone.css) and vendored styles
├── fonts/, images/, videos/       Icon fonts, pictures, background video and its subtitles
├── docs/public/                   CVs, certificates and project videos offered for download
├── netlify/functions/             Netlify functions in TypeScript (article, env, visit) and their shared HTTP helpers
├── service-worker.js              Offline cache (network first for pages, scripts and styles)
├── tests/, cypress/               Playwright and Cypress end-to-end tests
├── .github/                       GitHub Actions workflows, Dependabot, vendored versions check
├── .claude/                       Claude Code settings, hooks, skills, agents and the portfolio-dev plugin
├── .eleventy.js                   Eleventy configuration (also writes sitemap.xml, feed_*.xml and api/*.json)
├── gen-redirects.js               Writes _redirects from the routes of package.json
├── uglify-code.js                 Minifies the site scripts after the build
├── _headers, _redirects           Netlify headers (CSP, cache) and redirects
├── netlify.toml                   Netlify build settings and plugins
├── .gitlab-ci.yml                 GitLab CI pipeline (self-hosted Windows runner, see CI_CD.md)
└── *.md                           CHANGELOG, CI_CD, CONTRIBUTING, COVERAGE, ROBOT_FRAMEWORK, SECURITY
```

Generated and not committed: `.eleventy/` (output of `npm run dev`), `api/`, `sitemap.xml`, `feed_*.xml`, `reports/` (test reports) and `logs/`.

### 📦 Vendored Libraries
The third-party libraries in `js/` and `css/` are downloaded manually (not npm dependencies), so [Dependabot](.github/dependabot.yml) can't track them. Their versions are recorded in [`.github/vendor-versions.json`](.github/vendor-versions.json) and checked weekly by the [`vendor-versions`](.github/workflows/vendor-versions.yml) workflow, which opens a GitHub issue when a newer release is available. See also [SECURITY.md](SECURITY.md#utilities).

| Library | Version | Source | Purpose |
|---|---|---|---|
| jQuery | 3.7.1 | [npm](https://www.npmjs.com/package/jquery) | DOM manipulation and events used across the site's JS |
| jQuery Migrate | 3.6.0 | [npm](https://www.npmjs.com/package/jquery-migrate) | Restores legacy jQuery APIs some vendored plugins still call |
| jQuery Easing | 1.4.1 | [npm](https://www.npmjs.com/package/jquery.easing) | Extra easing functions for the smooth-scroll nav links |
| Bootstrap | 4.6.2 | [npm](https://www.npmjs.com/package/bootstrap) | CSS grid/layout and UI components on the index and blog pages |
| Popper.js | 1.16.1 | [npm](https://www.npmjs.com/package/popper.js) | Positions Bootstrap's dropdowns and tooltips |
| Chart.js | 4.5.1 | [npm](https://www.npmjs.com/package/chart.js) | Renders the skills/career doughnut charts |
| Stellar.js | 0.6.2 | [npm](https://www.npmjs.com/package/jquery.stellar) | Parallax scrolling on background images |
| Waypoints | 4.0.1 | [npm](https://www.npmjs.com/package/waypoints) | Triggers scroll-based animations when sections enter the viewport |
| Owl Carousel | 2.3.4 | [npm](https://www.npmjs.com/package/owl.carousel) | Powers the testimonial/project carousels |
| Scrollax | 1.0.0 | [npm](https://www.npmjs.com/package/scrollax) | Waypoints wrapper driving the scroll-in animations |
| Animate.css | 3.7.2 | [npm](https://www.npmjs.com/package/animate.css) | CSS animation classes applied on scroll-in |
| i18next | 26.4.3 | [npm](https://www.npmjs.com/package/i18next) | Client-side translations for the multi-language pages |
| chartjs-plugin-doughnutlabel-v3 | 1.2.0 | [npm](https://www.npmjs.com/package/chartjs-plugin-doughnutlabel-v3) | Draws the centered label inside Chart.js doughnut charts |

jQuery, jQuery Migrate, Bootstrap and Animate.css are intentionally kept below their latest major release - see [SECURITY.md](SECURITY.md#major-versions-held-back-on-purpose) for why each one is pinned.

### 📄 License
This project is licensed under [MIT License](LICENSE).
