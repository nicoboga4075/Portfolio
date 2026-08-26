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
| 0.0.14  | jQuery AnimateNumber  |
| 1.4.1   | jQuery Easing         |
| 1.1.0   | jQuery Magnific Popup |
| 0.6.2   | jQuery Stellar        |
| 4.0.0   | jQuery Waypoints      |
| 2.3.0   | Owl Carousel          |
| > 2.0.0 | Aos                   |
| 1.13.0  | Popper                |
| 1.0.0   | Scrollax              |
| 4.4.9   | Chart.js              |
| 3.4.0   | Animate.css           | 

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
