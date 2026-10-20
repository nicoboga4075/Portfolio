---
paths:
  - "netlify/functions/**"
  - "tests/jest/netlify/**"
---

# Netlify functions

- Netlify deploys every file of `netlify/functions/` as a function, but `shared/`: no test, fixture or helper elsewhere in that folder. Tests go in `tests/jest/netlify/<name>.test.ts`.
- TypeScript ES modules (`.mts`), with an explicit return type, `type` rather than `interface` and no floating promise. Import the shared helpers as `./shared/http.mjs`, the compiled name.
- Every handler starts with `isTrustedRequest(req)` and returns `redirectTo404()` when it fails, then validates each query parameter with a strict regex (as `article` does for `filename` and `env` for `lang`) and returns `redirectTo404()` on anything else.
- JSON answers go through `jsonResponse`, and every caught error through `internalError(context, error)`: never send an error message or a stack trace to the visitor.
- `env` only returns the variables of `PUBLIC_ENV_VARS`: a secret never goes in that list nor in any response. A new environment variable is set in Netlify and listed in "Environment and setup" of CLAUDE.md.
- Only use the APIs of the TypeScript `target` of `tsconfig.json` (ES2022): the functions also run on Node 20 under `netlify dev`.
- A new function needs its Lighthouse audit in `netlify.toml` when visitors see its output (as `article`), its test with 100 % coverage, and an update of SECURITY.md (`update-docs` skill).
