---
name: client-health
description: Checks the production health of the client side of the portfolio, read-only - every live page in every language opened in a real browser with the headers Netlify sends (status, Content-Security-Policy violations, console errors, uncaught exceptions, failed or 4xx / 5xx requests of the site and of third parties, TTFB, LCP, CLS), then the pieces a visitor opens (contact form scripts and reCAPTCHA, Calendly popup, Botpress chatbot), the service worker, the Poppins font, the CV date, and that Google Analytics loads nothing before consent - then says what is broken, why, and what to fix. Use it whenever the user asks whether the live site works in the browser, about a blank or broken page, a JavaScript error, a CSP violation, a widget, the captcha, the booking button, the chatbot, the analytics consent, slow pages or Core Web Vitals in production, whether the last deploy is live, or after changing js/, css/, _headers, a third-party script or the consent banner, even if they don't say "health" or "client".
metadata:
  category: Product Verification
---

# Check the health of the client side

The tests check the preview build on localhost, and `server-health` checks the Netlify functions and Supabase: neither opens the live pages in a browser. This skill does, as a first-time visitor (no cache, no stored consent), and only reads: it never sends the contact form, never writes to the chatbot, never books, never accepts the consent banner, and never calls the `visit` function (the script answers it itself, since each call adds a visit to the counter).

## Run it

```
node .claude/skills/client-health/client-health.mjs
```

About a minute and a half for every page. Options:

| Option | What it does |
|---|---|
| `--only <text>` | only the pages whose path holds the text (`--only en/blog`, without a leading slash under Git Bash) |
| `--mobile` | opens the pages at 390 x 844 instead of 1440 x 900 (the chatbot check is skipped: its bubble shows from 1024px) |
| `--no-widgets` | the pages only, not the widgets of the home page |
| `--base <url>` | another site than `homepage` of `package.json`, e.g. a deploy preview |
| `--json <file>` | also saves every result |

It needs the Chromium of Playwright: after a Playwright update, `npm run playwright:install -- chromium` once.

## What it checks

| Check | Fails when |
|---|---|
| Every page of `config.appRoutes`, every article (`/<lang>/blog#<slug>`), every project page, a missing page | the status is not 200 (404 for the missing page), a CSP violation, a console error, an uncaught exception, a request of the site that fails or answers 4xx / 5xx |
| Google Analytics | anything from `googletagmanager.com` or `google-analytics.com` loads before consent (the banner is never answered): `js/analytics.js` must load nothing until the visitor accepts |
| Third-party requests that fail | never fail the run, listed as `third party (not counted)` |
| TTFB, LCP, CLS | never fail the run, read them against the thresholds below |
| Service worker, Poppins | not registered, not loaded |
| CV date | `env?lang=<lang>` answers without a `date` |
| Contact form | scrolled into view, the Google API, Identity Services and reCAPTCHA do not load or the captcha is not drawn |
| Booking | the Calendly popup does not open |
| Chatbot (desktop) | no bubble, or Botpress does not mount `#fab-root` |

Core Web Vitals, for one load in a lab browser (a single run is noisy: rerun a page before calling it slow): LCP good up to 2.5 s, poor over 4 s; CLS good up to 0.1, poor over 0.25.

## Reading the results

| What you see | Likely cause | Fix to propose |
|---|---|---|
| A change already pushed is missing from the live pages (`curl -s <homepage>/en \| grep <new markup>`), files of `js/` older than the source | Netlify builds stopped or the published deploy locked, or a failed build | `netlify-ops` (`status`, then start the builds or unlock, asking first) |
| `analytics before consent` on every page | The live `js/analytics.js` is not the consent version (stale deploy) or a regression of `js/analytics.js` / `base.njk` | Compare `curl <homepage>/js/analytics.js` with the source; redeploy or fix with its test |
| `site request: 500 .../env?lang=` and `Error: GitHub fetch failed` | `GITHUB_API_TOKEN` expired, or renewed in Netlify without a new deploy (functions read the variables of their deploy) | New token if needed, then a new production deploy (`netlify-ops build`); `server-health` for the logs |
| `CSP: <directive> blocked <url>` | A new third-party host or inline script not in `_headers` | Add the origin to the right directive of `_headers` and SECURITY.md (`third-party-apis`, `update-docs`) |
| `third party (not counted): net::ERR_BLOCKED_BY_ORB <url>` | An image hot-linked from a site that does not serve it cross-origin | Host the image in `images/` |
| An exception or console error on one page only | A script of that page (`js/standalone.js` for the light pages, `js/app.js` for home and blog) | Reproduce locally with `run-portfolio`, fix with its Jest test |
| Contact form, booking or chatbot failing alone | The service changed its script, is down, or its origin left the CSP | `third-party-apis`; check its status page before touching the code |
| LCP poor on a project page | A large image above the fold | Compress it, give it `width` / `height` and `fetchpriority="high"` |

## Report

Answer first in a few lines: **healthy**, **degraded** or **broken**, and the one cause if there is one. Then:

```
Site: <homepage>, <n> pages, desktop or phone, <date>
Pages failing: <n> - <page>: <first problem> (grouped when one cause explains several)
Widgets: service worker, font, CV date, contact form, booking, chatbot: OK or what failed
Slow pages: <page> LCP <s> / CLS <n> (poor only)
Third parties failing (not counted): <host>: <why>
Proposed fixes: <numbered by priority, none applied>
```

Say when the cause is outside the code (a stale deploy, an expired token, a third party down), and hand over to `netlify-ops` or `server-health` rather than changing anything live.
