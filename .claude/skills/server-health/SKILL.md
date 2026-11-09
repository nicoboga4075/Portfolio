---
name: server-health
description: Checks the production health of the server side of the portfolio, read-only - the Netlify functions article, env and visit (live probes, invocations, 5xx with their logged error, redirects to /404 by isTrustedRequest or the filename and lang checks, latency and cold starts) through Netlify observability, and Supabase behind the visit counter (increment_visits calls, visits per day, Postgres errors, security and performance advisors) - then says what is broken, why, and what to fix. Use it whenever the user asks whether the site works in production, why the visit counter, the CV date, a blog article or the contact form settings do not load, about 500 / 502 / 302 / timeouts of /.netlify/functions/*, slow functions, the Netlify function logs, Supabase logs, errors or advisors, or after changing netlify/functions/, _headers, an environment variable, a token or the domain, even if they don't say "health" or "functions".
metadata:
  category: Data Fetching & Analysis
---

# Check the health of the server side

The pages of the live site are already checked by the site health line (session start, before each commit), but the functions are not: a function can fail while every page answers 200 and the CI stays green, because the tests serve the build without any Netlify function. This skill looks at the live functions and at Supabase, and only reads: it never deploys, never changes an environment variable, never runs DDL or a write in Supabase. A fix is proposed to the user, then done through the code, `netlify-ops` or a Supabase migration once they agree.

| Function | Called by | Depends on | A failure shows as |
|---|---|---|---|
| `article?filename=<slug>_<lang>.html` | the blog (`js/app.js`), Lighthouse audits of `netlify.toml` | the compiled `articles/*.html` of the deploy | an empty article on `/blog#<slug>` |
| `env` | the contact form | `ENV_CLIENT_ID`, `SITE_RECAPTCHA_KEY` | no Google sign-in, no captcha |
| `env?lang=<lang>` | the CV download date | `GITHUB_API_TOKEN`, the GitHub API | no "updated on" date next to the CV |
| `visit` | every page load on https | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, RPC `increment_visits` | the visit counter `#ftco-visitor` stays empty |

All of them share `netlify/functions/shared/http.mts`: an untrusted request (Referer not from `homepage` of `package.json`, nor Lighthouse) or an invalid parameter gets a **302 to `/404`**, and an exception gets a **500** with `{ error, requestId }`, logged by `internalError` with `console.error("[<requestId>] Referer: ...", error)`.

## Identifiers

- Netlify site id: `siteId` of `.netlify/state.json`; site URL: `homepage` of `package.json`.
- Supabase: the project of the `supabase` MCP server (the host in `SUPABASE_URL`); table `public.visits` holds one row per visit (`id`, `created_at`), so it is also the history of every successful `visit` call.

## Steps

Run the independent calls of a step in parallel. Each step still gives a useful answer if another source is unreachable: say which source was missing rather than stopping.

### 1. Probe the live functions

With the site as Referer, as the browser sends it, and timed:

```bash
SITE=https://nicoboga.netlify.app   # homepage of package.json
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" -H "Referer: $SITE/en" "$SITE/.netlify/functions/env"
curl -s -w "  %{http_code} %{time_total}s\n" -H "Referer: $SITE/en" "$SITE/.netlify/functions/env?lang=en"
curl -s -o /dev/null -w "%{http_code} %{content_type} %{time_total}s\n" -H "Referer: $SITE/en" "$SITE/.netlify/functions/article?filename=mcs_en.html"
curl -s -o /dev/null -w "%{http_code}\n" "$SITE/.netlify/functions/env"                       # no Referer: must be 302
curl -s -o /dev/null -w "%{http_code}\n" -H "Referer: $SITE/en" "$SITE/.netlify/functions/env?lang=EN"   # invalid lang: must be 302
```

Expected: 200, 200 with `{"date":"<ISO date>"}`, 200 `text/html`, 302, 302. Print only the status of `env` without `?lang`: its body holds the client id and the site key, public but not worth pasting in a report.

**Never call `visit`**: each call adds a row to `public.visits` and raises the counter visitors see. Its health comes from steps 2 and 3. Take the article slug from `_data/articles.json` if `mcs` no longer exists.

A first call over about 2 s and the next ones fast is a cold start, not a fault.

### 2. Read Netlify observability

Tool `netlify-observability-services-reader`, timestamps in **milliseconds**. The window Netlify keeps depends on the plan and is clamped silently: on this site it was about **1 hour** (checked in October 2026). Always read `meta.responses[].from` of the answer and state the real window in the report, never the one asked for; an empty answer over that window means no traffic, not an outage.

- `get-topk`, `query_name: "functions"`: per function `count`, `error_count`, `p50` ... `p99`. Durations are in **nanoseconds** (`783078044` is 0.78 s), the same unit as `duration_ns` of the logs.
- `get-counts`, `query_name: "status_codes"`, with a filter `FunctionName = <name>`: the share of 200, 302 and 5xx per function.
- `get-request-logs` with `StatusCode >= 500`: the failing requests with their `logs` (the `console.error` of `internalError`, which names the cause), then `get-request-detail` on one `request_id` if more is needed (its window must bracket the request, a minute either side).
- For the 302: `get-topk` `referrers` and `user_agents` filtered on the function URL. Bots, scanners and visitors who open the URL by hand get 302 by design; 302 whose referrer **is** the site mean the guard rejects real visitors.

### 3. Read Supabase

- `execute_sql` (a `select` only): visits per day over the last 14 days, `select date_trunc('day', created_at) as day, count(*) from public.visits where created_at > now() - interval '14 days' group by 1 order by 1;`. A day at 0 after days with visits is the strongest sign that `visit` broke on that day; it reaches further back than the Netlify window.
- `query_logs` (24 h at most per query, pass `iso_timestamp_start` / `iso_timestamp_end`): source `edge_logs`, rows whose `log_attributes['request.path']` is `/rest/v1/rpc/increment_visits`, grouped by `log_attributes['response.status_code']`, with the mean of `log_attributes['response.origin_time']` (ms). The calls of the function have the user agent `node`; any other user agent calls the RPC directly with the public anon key, from outside the site.
- `query_logs` on `postgres_logs`: leave out the routine `checkpoint ...` lines and keep errors (`ERROR`, `FATAL`, `PANIC`, `permission denied`, `function ... does not exist`). A lone `could not receive data from client: Connection reset by peer` is a client that went away, not a fault.
- `get_advisors` with `security` then `performance`. Report each with its level and its remediation link. Weigh them against how the counter works: `increment_visits` is called by the function with the anon key, so `anon` being able to execute it is expected (it is why the counter can be inflated by anyone holding the public key, worth saying, not an outage); a `SECURITY DEFINER` function that the site does not use but `anon` can execute, a mutable `search_path` or a Postgres version with security patches are real findings to propose fixing.

## Reading the symptoms

| What you see | Likely cause | Fix to propose |
|---|---|---|
| `env?lang` 500, log `Webhook fetch failed: Unauthorized` (or `Forbidden`) | `GITHUB_API_TOKEN` expired or revoked, or rate limit | New token in the Netlify environment variables, then a new deploy (`netlify-ops` `build`) |
| `env?lang` 200 but `date` missing | No commit of `docs/public/CV_<lang>.pdf` found | Check `config.cvLangs` / `cvDefaultLang` and the file name |
| `visit` 500, log `RPC error: ...` | Supabase project paused (free plan, after a week without traffic), key rotated, `SUPABASE_URL` wrong, RPC renamed or its grant revoked | Restore the project in the Supabase dashboard, or fix the variable or the RPC |
| Visits per day drop to 0, no 5xx | `visit` no longer called: front-end (`js/`), CSP of `_headers`, or the page is not on https | `run-portfolio` to see the console, `third-party-apis` for the CSP |
| Many 302 with the site as referrer | `isTrustedRequest` rejects real visitors: domain or `homepage` changed, `www.` or a custom domain not covered | Fix `homepage` or the guard, with its test in `tests/jest/netlify/` |
| `article` 302 for a slug that exists | The article is missing from the deploy or its file name changed | `check-content`, then look at the last deploy with `netlify-ops` |
| p99 of several seconds on every call, not only the first | Slow dependency (GitHub API, Supabase `origin_time`) | Compare with the Supabase `origin_time` before touching the code |
| Every source empty | No traffic in the window, or the wrong site or project | Check the ids above; widen only the Supabase window |

## Report

Answer in a few lines first: **healthy**, **degraded** or **broken**, and the one cause if there is one. Then:

```
Window: Netlify <from> -> <to> (<real duration>), Supabase <from> -> <to>
| Function | Live probe | Calls | 5xx | 302 | p50 / p99 |
Supabase: <visits today / yesterday / 14-day mean>, RPC <statuses>, Postgres errors <n>
Advisors: <level> <title> - <why it matters here> - <link>
Proposed fixes: <numbered by priority, none applied>
```

Keep the security findings of the advisors apart from the outage: they never make the site "broken", but list them so the user can decide.
