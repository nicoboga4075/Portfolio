---
name: check-links
description: Checks that every external link of the portfolio (pages, _includes, articles, projects, _data/*.json) has no trailing slash, answers 200 after its redirects and that its page is not a soft 404 - a 200 whose title or h1 / h2 says 404, not found, page introuvable, n'existe plus. Use it when the user asks to check, test or audit the external links, the dead links or the 404s, after adding or editing links in an article, a project or a data file, or before a release.
---

# Check links

```
npm run check:links
```

That is `node .claude/skills/check-links/check-links.mjs`. It exits with code 1 and lists each broken link with the files that hold it, 0 when every link is alive. It takes about a minute (8 requests at a time).

Options, after `--`:

- `--only=<text>` checks only the URLs that contain this text, e.g. `npm run check:links -- --only=linkedin.com` or `--only=soft-concept`.
- `--timeout=<ms>` changes the timeout per link (20000 by default).

## What it checks

| Result | Meaning |
|---|---|
| `✖ 404`, `✖ 500`, `✖ 400`... (exit 1) | The final status after the redirects is not 200 |
| `✖ 200 but its page says "..."` (exit 1) | A soft 404: the server answers 200 but the title or a h1 / h2 of the page says 404 or not found, in English or French |
| `✖ ENOTFOUND`, `CERT_HAS_EXPIRED`, `ECONNRESET`, `timeout` (exit 1) | The domain no longer exists, its certificate expired, or the server does not answer |
| `✖ ... ending with a slash` (exit 1) | The portfolio writes its links without a trailing `/` (`https://galadrim.fr/en`, not `https://galadrim.fr/en/`). Only a whole link counts (an `href` or a JSON value): a Nunjucks prefix such as `urlPrefix = "https://www.soft-concept.com/"` is completed later and is not one |
| `? 403`, `? 999`, `? 202`... (no failure) | An anti-bot (LinkedIn 999, Cloudflare 403, Amazon 202) refuses a script: check these by hand |

It skips the code samples (`example.com`, `exemple.com`), the Google Fonts preconnects, the site itself and the templated URLs (`{{ ... }}`).

## After a run

- For the blocked links (`?`), open them in Chrome with the claude-in-chrome tools if they are connected, otherwise list them for the user: only a browser tells if they are alive.
- Before calling a link broken on a network error (`ECONNRESET`, `timeout`), run it again with `--only=<host>`: a slow server can fail once.
- For a link really broken, propose a fix to the user rather than deleting it: the new URL of the page (search the site for it), an archive (`https://web.archive.org/web/<url>`), or the home page of the site. Write the new URL without a trailing `/`. Fix it in every file listed under `in`, in both languages, then run `npm run check:links -- --only=<host>` again.
- A soft 404 can be a false positive (a page that talks about 404s): open it before changing anything.
