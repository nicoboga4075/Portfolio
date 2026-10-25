---
name: update-docs
description: Keeps README.md and SECURITY.md in step with the repository - the vendored libraries table, the fonts and icons, the major versions held back on purpose, the Vulnerability Disclosure Log (Dependabot, CodeQL, SonarCloud, npm audit) and the security practices (CSP, rulesets, interaction limits, workflow permissions, Claude Code workflows) - then checks them with npm run check:docs. Use it whenever a change touches one of these - a file of js/ or css/ or .github/vendor-versions.json, typescript or the Node version, a font or icon set, _headers, a GitHub Actions workflow, a ruleset or repository setting, a new public file or endpoint (a file the build writes such as the feeds or /api/*.json, a Netlify function, a third-party script) - when a security alert is opened, dismissed or fixed, when an upgrade issue is closed, or when the user asks to update, check or sync the README or the security policy, even if they don't name the files.
metadata:
  category: Business Process & Team Automation
---

# Update README.md and SECURITY.md

```
npm run check:docs
```

That is `node .claude/skills/update-docs/check-docs.mjs`. It exits with code 1 and lists each mismatch, 0 when both files are up to date. `npm run check:docs -- --offline` skips the GitHub checks (they need the `gh` CLI, logged in).

## What it checks

| Check | Source of truth |
|---|---|
| Every vendored library has a row in the README table, at the right version, and no row is left over | `.github/vendor-versions.json` |
| The "Pinned" column of the SECURITY.md held-back table, and its Status and Acknowledgement cells | `.github/vendor-versions.json`, `node_modules/typescript`, the local Node (a warning only: the CI may differ) |
| One row of the npm overrides table per entry of `overrides`, and no row left over | `package.json` |
| The links between the two files (`README.md#-vendored-libraries`, `SECURITY.md#utilities`, `SECURITY.md#major-versions-held-back-on-purpose`) still point to a heading | the headings of both files |
| Every open Dependabot alert (GHSA or CVE) and every open code scanning alert (rule id) is in the Vulnerability Disclosure Log | the GitHub API |
| Every issue linked from a :hourglass: row is still open (warning) | the GitHub API |

It can't check prose: read the sections below against the change.

## What to update for which change

| Change | README.md | SECURITY.md |
|---|---|---|
| A vendored library added, removed or bumped in `js/` / `css/` (and `.github/vendor-versions.json`) | its row of the Vendored Libraries table (version, npm link, purpose) | the held-back table if it is one of its rows (Pinned, Latest, Status); a new major held back gets a row and an upgrade issue |
| `typescript` or the project's Node version | - | the TypeScript or Node.js row of the held-back table |
| An entry of `overrides` added or removed in `package.json` | - | its row of the npm overrides table (the `check-overrides` skill gives the path and the reason) |
| A font (Google Fonts link, `font-family`, `@font-face` fallbacks in `css/common.css`) or an icon set | - | Fonts / Icons |
| A security alert opened (Dependabot, CodeQL, SonarCloud, `npm audit`) | - | a row of the Vulnerability Disclosure Log |
| An alert fixed, dismissed or its issue closed | - | that row's Status, and :hourglass: -> :white_check_mark: when it's fixed |
| A new public file or endpoint: a file written by `.eleventy.js` (`sitemap.xml`, `feed_<lang>.xml`, `api/*.json`), a Netlify function, a third-party script or service | - (README if visitors use it, e.g. the feed links) | Security Best Practices: what it exposes, that it holds nothing from git, the environment or a secret, how it is served (`_headers`) |
| `_headers` (CSP and other headers), a ruleset, interaction limits, workflow `permissions`, a scanning tool, the Claude Code workflows | - | Security Best Practices |
| A heading renamed in either file | every link to it (`check:docs` lists them) | same |

## How to write it

- English, like the rest of both files.
- Keep the tables: one row per library, per held-back component, per advisory (one row per CVE, two rows for two CVEs of the same package).
- Dates as `YYYY-MM-DD`: the date the alert was opened for an advisory.
- Disclosure Log row: `**CVE-…** (GHSA-…)` or `**CodeQL** *rule-id*`, the package and the path it comes through (`via …`, `dev only` when it's a dev dependency), the criticity of the advisory, then a status that says what was done or why it's not exploitable here, with a link to the tracking issue.
- Acknowledgement: `:white_check_mark:` once fixed, `:hourglass:` while open or held back.
- Link issues with their full URL (`bugs.url` of `package.json` followed by `/<n>`), not `#<n>`: SECURITY.md is also read outside GitHub.
- Never rename a heading without updating the links to it.

## Steps

1. Find what changed: the files the user names, or `git diff --name-only` (uncommitted), or `git diff --name-only HEAD~1` (last commit).
2. Gather the facts instead of guessing them:
   - Vendored versions: `.github/vendor-versions.json`, and `npm view <package> version` for the latest one.
   - Dependabot alerts: `gh api "repos/{owner}/{repo}/dependabot/alerts?per_page=100" --jq '.[] | [.number, .state, .dependency.package.name, .security_advisory.ghsa_id, .security_advisory.cve_id, .security_advisory.severity, .dependency.scope] | @tsv'`
   - Code scanning alerts: `gh api "repos/{owner}/{repo}/code-scanning/alerts?state=open"`
   - Where a dependency comes from: `npm ls <package>`
   - Whether the vulnerable code runs here: read how the dependency uses the vulnerable function before writing "not exploitable".
3. Edit README.md and SECURITY.md, following the tables above.
4. Run `npm run check:docs` until it reports no error.
5. Show the user the rows you changed and commit with a `📝` gitmoji (CLAUDE.md), or ask first if they haven't said to commit.
