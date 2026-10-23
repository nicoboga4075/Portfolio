---
name: third-party-apis
description: Reference of the third-party services the portfolio calls - Google API client, Google Identity Services and the Gmail API (contact form), reCAPTCHA v2, Calendly, Botpress, Google Analytics, Google Fonts, and on the server side the GitHub API and Supabase - with where each one is loaded, its settings and environment variables, its Content-Security-Policy origins in _headers, its pitfalls and its official docs. Use it before changing, upgrading, adding or removing a call to one of these services or a new third-party script, endpoint or embed, when the contact form, the captcha, the booking button, the chatbot, the analytics, the visit counter or the CV date break, or when a CSP violation names one of their hosts, even if the user doesn't say "API".
metadata:
  category: Library & API Reference
---

# Third-party APIs

These services are web APIs and hosted scripts, not npm packages: context7 knows little of them, so read their official docs (linked below) for the version the site uses.

## Rules for every service

- **CSP**: every origin a service loads a script, style, font, image, frame or request from has its entry in the `Content-Security-Policy` of `_headers`, in the right directive. `tests/playwright/csp.browser.spec.js` opens every page with that policy and fails on a violation: run it after a change (`npx playwright test tests/playwright/csp.browser.spec.js`).
- **SECURITY.md**: a new service, origin or endpoint, or a removed one, goes in SECURITY.md (`update-docs` skill).
- **Secrets**: a key that must stay secret is read by a Netlify function only, never sent to the browser; `env` hands out only the variables of its `PUBLIC_ENV_VARS`. A new environment variable is set in Netlify and listed in "Environment and setup" of CLAUDE.md.
- **Loading**: a service the visitor may not use is loaded on demand (the contact scripts when the contact section is reached, Calendly on the first click, Botpress on the first click of its stand-in button), with a fallback when it fails to load.
- **Tests**: the browser specs and Cypress run offline from the third parties; only CSP violations fail on them, a failed third-party request doesn't.

## Contact form: Google API client, Google Identity Services, Gmail API

- **Code**: `loadContactScripts`, `gapiLoaded`, `gisLoaded` and `sendEmail` of `js/app.js`.
- **How it works**: `gapi` (`https://apis.google.com/js/api.js`) inits the Gmail discovery document; Google Identity Services (`https://accounts.google.com/gsi/client`) makes a token client (`initTokenClient`) with the `ENV_CLIENT_ID` from the `env` function and the scope `https://www.googleapis.com/auth/gmail.send`; on submit, `requestAccessToken({ prompt: 'consent' })` asks the visitor's consent, then a `POST https://www.googleapis.com/gmail/v1/users/me/messages/send` sends the message as `raw`, base64url (`+` to `-`, `/` to `_`, no `=`).
- **Pitfalls**: the token stays in memory (`appGmailToken`), never in `sessionStorage` or `localStorage` (CodeQL alert fixed in the security log of SECURITY.md); CR and LF are stripped from the header fields (subject, sender name) against header injection; the consent is polled every 3 s for 30 s.
- **CSP**: `script-src` `https://apis.google.com` `https://accounts.google.com`; `connect-src` `https://www.googleapis.com` `https://apis.google.com`; `frame-src` `https://accounts.google.com` `https://content.googleapis.com`.
- **Docs**: [token model of Google Identity Services](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [Google API client for JavaScript](https://github.com/google/google-api-javascript-client), [users.messages.send](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/send).

## reCAPTCHA v2

- **Code**: `initCaptcha` and `enableSubmitForm` of `js/app.js`, loaded by `loadContactScripts` (`https://www.google.com/recaptcha/api.js?hl=<lang>&onload=initCaptcha&render=explicit`).
- **How it works**: an explicit `grecaptcha.render('captcha-check', ...)` with `SITE_RECAPTCHA_KEY` from the `env` function; the submit button stays disabled until `grecaptcha.getResponse()` is not empty.
- **Pitfalls**: the real key's domain allowlist excludes localhost, so under `netlify dev` (`CONTEXT === "dev"`) `env` hands back Google's public test key; the widget language follows the page (`hl`).
- **CSP**: `script-src` `https://www.google.com` `https://www.gstatic.com`; `frame-src` `https://www.google.com`; `style-src` and `img-src` `https://www.gstatic.com`.
- **Docs**: [reCAPTCHA v2](https://developers.google.com/recaptcha/docs/display), [test key](https://developers.google.com/recaptcha/docs/faq).

## Calendly

- **Code**: the `#calendly-cta` click handler and `CALENDLY_WIDGET` of `js/app.js`; the booking URL is `config.calendly` of `package.json`.
- **How it works**: the widget's CSS and script are fetched on the first click only, then `Calendly.initPopupWidget({ url, color })` with the site's `--primary`; if the script fails, the booking page opens in a new tab.
- **CSP**: `script-src` and `style-src` `https://assets.calendly.com`; `frame-src` `https://calendly.com`; `connect-src` `https://calendly.com` `https://api.calendly.com`; `img-src` `https://calendly.com` `https://assets.calendly.com`.
- **Docs**: [Calendly developer docs](https://developer.calendly.com/).

## Botpress chatbot

- **Code**: `js/botpress.js`; the script addresses are `config.botpress` of `package.json`, written into the `botpress` meta by `_includes/base.njk`; the bot reads `api/articles.json` and `api/projects.json`, written by the build.
- **How it works**: `inject.js` is pinned to a version (`webchat/v3.x`) with its SRI hash (`config.botpress.inject.integrity`); the bot script (`config.botpress.bot`) has no hash, since Botpress regenerates it when the dashboard settings change, and is appended only once `inject.js` has run. The bubble is restyled inside Botpress's open shadow root, re-applied by an observer.
- **Upgrading `inject.js`**: change `config.botpress.inject.src`, then its `integrity` (`curl -s <src> | openssl dgst -sha384 -binary | openssl base64 -A`, prefixed with `sha384-`), then check the bubble override still matches Botpress's class names (`.bpFabWrapper`, `.bpFabContainer`, `.bpFabIcon`).
- **CSP**: `script-src` `https://cdn.botpress.cloud` `https://files.bpcontent.cloud`; `connect-src` `https://cdn.botpress.cloud` `https://api.botpress.cloud` `https://webchat.botpress.cloud`; `img-src` `https://files.bpcontent.cloud`.
- **Docs**: [Botpress docs](https://botpress.com/docs).

## Google Analytics

- **Code**: `js/analytics.js`, added by the production build on Netlify only (`analytics` global of `.eleventy.js`: `CONTEXT === "production"`), with `config.analyticsId`; never add it elsewhere, and remove the snippet injection of the Netlify UI if any, or every visit counts twice.
- **CSP**: `script-src` and `img-src` `https://www.googletagmanager.com`; `connect-src` `https://region1.google-analytics.com` `https://www.google-analytics.com`.
- **Docs**: [gtag.js](https://developers.google.com/tag-platform/gtagjs). The GA4 data is read with the analytics MCP server (property of `nicoboga.netlify.app`).

## Google Fonts and SVG Repo

- **Code**: the Poppins stylesheet in `_includes/base.njk`; SVG Repo is referenced by the vendored `css/icomoon.css` only.
- **CSP**: `style-src` `https://fonts.googleapis.com` `https://www.svgrepo.com`; `font-src` `https://fonts.gstatic.com`; `img-src` `https://www.svgrepo.com`. The fonts are listed in SECURITY.md ("Fonts").
- **Docs**: [Google Fonts CSS API](https://developers.google.com/fonts/docs/css2).

## Server side: GitHub API and Supabase

Called by the Netlify functions, never by the browser, so they need no CSP entry for the call itself (`connect-src` still lists `https://api.github.com`, although no script of `js/` calls it: check nothing else does before removing it).

- **GitHub API** (`env?lang=xx` of `netlify/functions/env.mts`): `GET /repos/<owner>/<repo>/commits?path=docs/public/CV_<lang>.pdf&per_page=1` with `GITHUB_API_TOKEN`, the date of the last CV commit; the repository comes from `repository.url` of `package.json`. Docs: [list commits](https://docs.github.com/en/rest/commits/commits#list-commits).
- **Supabase** (`netlify/functions/visit.mts`): `POST <SUPABASE_URL>/rest/v1/rpc/increment_visits` with `SUPABASE_ANON_KEY`, called by `initIndexPage` on the live site only (`https:`). The Supabase MCP server reads the project, read only. Docs: [database functions](https://supabase.com/docs/guides/database/functions).
- **Both**: the function starts with `isTrustedRequest`, answers with `jsonResponse` and sends every error through `internalError` (rule `netlify-functions.md`); their tests mock `fetch` in `tests/jest/netlify/`.
