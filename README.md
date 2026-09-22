# Portfolio&nbsp;[![Netlify Status](https://api.netlify.com/api/v1/badges/3ca3f0ca-21e5-4549-a46e-a8dc9a87131c/deploy-status)](https://app.netlify.com/sites/nicoboga/deploys)&nbsp;[![Security Policy](https://img.shields.io/badge/Security-Policy-blue.svg)](https://github.com/nicoboga4075/Portfolio/blob/main/SECURITY.md)&nbsp;[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=nicoboga4075_Portfolio&metric=alert_status&token=f7fc3565e07a56df5e54ce88e0c6292896b4b4ef)](https://sonarcloud.io/summary/new_code?id=nicoboga4075_Portfolio)

### 🚀  Live Site
This project is deployed on **Netlify** : https://nicoboga.netlify.app

### 📦 Vendored Libraries
The third-party libraries in `js/` and `css/` are downloaded manually (not npm dependencies), so [Dependabot](.github/dependabot.yml) can't track them. Their versions are recorded in [`.github/vendor-versions.json`](.github/vendor-versions.json) and checked weekly by the [`vendor-versions`](.github/workflows/vendor-versions.yml) workflow, which opens a GitHub issue when a newer release is available. See also [SECURITY.md](SECURITY.md#utilities).

| Library | Version | Source | Purpose |
|---|---|---|---|
| jQuery | 3.7.1 | [npm](https://www.npmjs.com/package/jquery) | DOM manipulation and events used across the site's JS |
| jQuery Migrate | 3.6.0 | [npm](https://www.npmjs.com/package/jquery-migrate) | Restores legacy jQuery APIs some vendored plugins still call |
| jQuery Easing | 1.4.1 | [npm](https://www.npmjs.com/package/jquery.easing) | Extra easing functions for the smooth-scroll nav links |
| Bootstrap | 4.3.1 | [npm](https://www.npmjs.com/package/bootstrap) | CSS grid/layout and UI components on the index and blog pages |
| Popper.js | 1.16.1 | [npm](https://www.npmjs.com/package/popper.js) | Positions Bootstrap's dropdowns and tooltips |
| Chart.js | 4.5.1 | [npm](https://www.npmjs.com/package/chart.js) | Renders the skills/career doughnut charts |
| Stellar.js | 0.6.2 | [npm](https://www.npmjs.com/package/jquery.stellar) | Parallax scrolling on background images |
| Waypoints | 4.0.1 | [npm](https://www.npmjs.com/package/waypoints) | Triggers scroll-based animations when sections enter the viewport |
| Owl Carousel | 2.3.4 | [npm](https://www.npmjs.com/package/owl.carousel) | Powers the testimonial/project carousels |
| Scrollax | 1.0.0 | [npm](https://www.npmjs.com/package/scrollax) | Waypoints wrapper driving the scroll-in animations |
| Animate.css | 3.4.0 | [npm](https://www.npmjs.com/package/animate.css) | CSS animation classes applied on scroll-in |
| i18next | 26.4.2 | [npm](https://www.npmjs.com/package/i18next) | Client-side translations for the multi-language pages |
| chartjs-plugin-doughnutlabel-v3 | 1.2.0 | [npm](https://www.npmjs.com/package/chartjs-plugin-doughnutlabel-v3) | Draws the centered label inside Chart.js doughnut charts |

jQuery, jQuery Migrate, Bootstrap and Animate.css are intentionally kept below their latest major release - see [SECURITY.md](SECURITY.md#major-versions-held-back-on-purpose) for why each one is pinned.

### 📄 License
This project is licensed under [MIT License](LICENSE).
