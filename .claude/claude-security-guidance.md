# Portfolio security rules

Static Eleventy site deployed on Netlify (https://nicoboga.netlify.app). The only server-side code is `netlify/functions/*.mts`; there are no user accounts and no database of its own (visits go through a Supabase RPC).

## Netlify functions

- Every handler starts with `isTrustedRequest(req)` and answers `redirectTo404()` when it fails. That check is Referer-based: it stops hotlinking, it is NOT authentication. A new function that writes data, sends mail or spends a paid quota needs real protection (secret, captcha, rate limit), not only this check.
- Every query parameter is validated with an anchored allowlist regex before any use (`filename` in `article.mts`, `lang` in `env.mts`). Flag a parameter used without one, or a regex loosened (missing `^`/`$`, `.` or `/` allowed).
- `article.mts` keeps BOTH barriers: the filename regex and the `path.resolve` + `startsWith(articleDir + path.sep)` check. Removing either is a path traversal finding.
- Errors go through `internalError()`, which returns only `{ error, requestId }`. Never return `error.message`, a stack, an upstream response body or an environment variable to the client.
- Outbound URLs are fixed. User input may reach `api.github.com` or Supabase only through an allowlist (`cvLangs`); anything else is SSRF.

## Secrets and environment variables

- `GITHUB_API_TOKEN`, `SUPABASE_URL` and `SUPABASE_ANON_KEY` are server-side only. They must never be returned by a function, logged, or appear in `js/`, `_includes/`, `_data/` or any built HTML.
- `PUBLIC_ENV_VARS` in `env.mts` may only list values that are public by design (`ENV_CLIENT_ID`, the Google OAuth client id; `SITE_RECAPTCHA_KEY`, the reCAPTCHA site key). Adding anything else is a finding.
- `RECAPTCHA_TEST_KEY` in `env.mts` is Google's documented public test key, served only when `CONTEXT === "dev"`. It is intentional: do not report it. Report it if it can be served outside `dev`.
- No credential is ever committed, including in tests, Cypress/Playwright fixtures or `.github/` workflows (use GitHub/Netlify secrets).

## Client-side JavaScript (`js/app.js`, `js/common.js`, `js/standalone.js`, `js/botpress.js`)

- Fetched article HTML is parsed with `DOMParser`, sanitised (removes `script`, `iframe`, `object`, `embed`, `link`, `style`, `meta`, `on*` attributes, `srcdoc`, `javascript:`/`data:`/`vbscript:` URLs, non-`https` hrefs) and inserted as nodes. Weakening that sanitiser, or inserting the fetched HTML as a string, is an XSS finding.
- No new `.html()`, `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval` or `new Function` fed by `location` (hash, search, pathname), a fetch response, `sessionStorage`/`localStorage` or form input. Visitor-facing messages use `.text()`.
- `location.hash` and the page language end up in the article URL: they must stay constrained by the server-side filename regex.
- Contact form (`sendEmail`): CR/LF are stripped from `Subject` and the sender name to prevent header injection; the recipient is hard-coded. Keep both. The Google token uses the `gmail.send` scope only and lives in `sessionStorage`: do not widen the scope or move it to `localStorage`.
- `localStorage` only stores the theme choice (`theme`); that is not sensitive.

## Headers and third parties (`_headers`)

- The CSP already contains `'unsafe-inline'` and `'unsafe-eval'` in `script-src`: known, do not report them as new. Report any change that widens the CSP further: a wildcard source, `http:`, a new third-party origin without a matching feature, or removing `frame-ancestors 'none'`, `base-uri 'self'` or `form-action 'self'`.
- Keep `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` and `Referrer-Policy`.
- Vendored libraries live in `js/*.min.js`. A new third-party script is either self-hosted there or loaded from an origin already in the CSP.

## Out of scope / low priority

- Content and PDFs under `docs/public/` are public on purpose.
- `.claude/skills/` scripts are local developer tooling (e.g. the contrast checker serves `.eleventy/` on `localhost` only); they are not deployed.
