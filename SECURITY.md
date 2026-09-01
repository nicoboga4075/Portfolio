# Security Policy

## Scope

This security policy applies to:

- The code and content in this portfolio repository
- The live site hosted at [https://nicoboga.netlify.app](https://nicoboga.netlify.app)

## Not in Scope:

- Third-party services or libraries integrated into the site (e.g. contact form providers, analytics tools)

If you discover an issue with a third-party service, please report it directly.

## Fonts

- **Poppins** (on-line)
- **Arial** (off-line)

## Icons

- **Flaticon** (average)
- **Icomoon** (small)

## Utilities

Versions are tracked in [`.github/vendor-versions.json`](.github/vendor-versions.json) and checked weekly by the [`vendor-versions`](.github/workflows/vendor-versions.yml) workflow, which opens a GitHub issue when an update is available.

| Version |                       |
| ------- | --------------------  |
| 4.3.1   | Bootstrap             |
| 3.7.1   | jQuery                |            
| 3.6.0   | jQuery Migrate        |
| 1.4.1   | jQuery Easing         |
| 1.2.0   | jQuery Magnific Popup |
| 0.6.2   | jQuery Stellar        |
| 4.0.1   | jQuery Waypoints      |
| 2.3.4   | Owl Carousel          |
| 1.16.1  | Popper                |
| 1.0.0   | Scrollax              |
| 4.5.1   | Chart.js              |
| 3.4.0   | Animate.css           | 

### Major versions held back on purpose

jQuery, jQuery Migrate, Bootstrap and Animate.css are intentionally pinned below their latest major release. None of this is a security risk on its own (unlike the CVEs below, which are fixed) - it's a stability/compatibility trade-off that needs dedicated testing before it can be lifted:

- **jQuery 3.7.1 → 4.0.0**: jQuery 4 drops legacy event API methods (`.bind()`/`.unbind()`/`.delegate()`/`.undelegate()`) and other old helpers (`$.isFunction`, `$.trim`, ...) that some vendored plugins here (Stellar.js, Magnific Popup, Owl Carousel, jQuery Easing - all written 2013-2017) may still call internally. jQuery Migrate exists to bridge exactly this gap, but Migrate 3.6.0 (pinned to jQuery 3.x) covers more of these than Migrate 4.x does, so jumping both to 4.x doesn't fully remove the risk.
- **jQuery Migrate 3.6.0 → 4.0.2**: follows jQuery's version, not an independent choice - it only makes sense to bump once jQuery itself moves to 4.x.
- **Bootstrap 4.3.1 → 5.3.8**: Bootstrap 5 drops jQuery entirely and replaces Popper.js v1 (`js/popper.min.js`, used here) with the incompatible `@popperjs/core` v2 API, breaking every dropdown/tooltip/popover. It also renames utility classes (`.ml-*`/`.mr-*` → `.ms-*`/`.me-*`, `.text-left`/`.text-right` → `.text-start`/`.text-end`) and namespaces data attributes (`data-toggle` → `data-bs-toggle`) used throughout the site's HTML, not just in the vendored JS - this would require rewriting markup across every page, not just swapping a file.
- **Animate.css 3.4.0 → 4.1.1**: v4 prefixes every class with `animate__` (`.fadeInUp` → `.animate__fadeInUp`), while `main.js` adds unprefixed classes like `fadeInUp`/`ftco-animated` dynamically on scroll. The break would be silent - no JS error, animations just stop firing.

## Vulnerability Disclosure Log

| Date             | Description                   | Criticity | Status                             | Acknowledgement    |
|------------------|-------------------------------|-----------|-------------------------------------|--------------------|
| 2020-04-29       | **CVE-2020-11022** : *jQuery* | Medium    | Patched, jQuery upgraded to 3.7.1  | :white_check_mark: |
| 2020-04-29       | **CVE-2020-11023** : *jQuery* | Medium    | Patched, jQuery upgraded to 3.7.1  | :white_check_mark: |
| 2023-06-26       | **CVE-2020-23064** : *jQuery* | Medium    | Patched, jQuery upgraded to 3.7.1  | :white_check_mark: |

*This section will be updated if and when vulnerabilities are responsibly disclosed.*
 
## Security Best Practices

To maintain the security of this portfolio, I follow these practices:

- **HTTPS enforced** :white_check_mark:: All traffic is served over HTTPS to prevent data interception.
- **Content Security Policy (CSP)**: CSP headers are configured to mitigate cross-site scripting (XSS) and data injection attacks.
- **Secure hosting**: The site is hosted on *Netlify* with built-in security measures.

## Reporting a Vulnerability

If you discover a security vulnerability in this portfolio, I kindly ask you to report it responsibly.

**Please do not publicly disclose the issue until it has been addressed.**

To report a vulnerability:

1. Send an email at [nicolas.bogalheiro@gmail.com](mailto:nicolas.bogalheiro@gmail.com).
2. Provide a detailed description of the vulnerability.
3. Include steps to reproduce the issue (if possible).
4. Share any relevant logs, screenshots, or proof-of-concept code.

I aim to respond to all reports within **24 hours** and will provide an estimated timeline for remediation.
