---
name: check-overrides
description: Checks whether each entry of "overrides" in package.json still changes what npm installs - obsolete (no package depends on it any more), redundant (the packages that ask for it would already get a matching version) or still active - with the commit that added it, then removes the ones that are no longer needed and checks nothing breaks. Use it after a dependency update (a Dependabot pull request merged, npm update, npm install of a new package, a change of package-lock.json), when npm audit changes, or when the user asks about the npm overrides, pinned or forced transitive dependencies, even if they don't say "overrides".
metadata:
  category: Code Quality & Review
---

# Check the npm overrides

```
npm run check:overrides
```

That is `node .claude/skills/check-overrides/check-overrides.mjs`. For each override it prints the commit that added it, every installed package that asks for the overridden dependency with the range it asks for, and the version npm would install for it without the override (from `package-lock.json` and the npm registry). It exits with code 1 when an override is obsolete or redundant.

## What the results mean

| Result | Meaning | What to do |
|---|---|---|
| `✖ obsolete` | No installed package (or no package of the parent, for a nested override such as `critical > oust`) depends on it any more: the parent dropped it or was removed | Remove the entry |
| `✖ redundant` | Every package that asks for it would already get a version matching the override: the parents raised their own range (e.g. `auto-changelog` now asks `handlebars ^4.7.9`) | Remove the entry, then check the version and `npm audit` do not move |
| `✔ active` | At least one package (`→` line) would get another version without it | Keep it: it becomes redundant once that package raises its range |
| `✔ active: replaces ... with ...` | An `npm:` alias swaps the package for another one | Keep it while the parent depends on the replaced package |
| `⚠ holds ... below the version npm would pick` | The override pins an older version than npm would choose (e.g. `nwsapi` 2.2.27 while 2.2.28 exists) | Find why it was pinned (below) before touching it |

## Removing an override

1. Read the commit printed under `added by` (`git show <hash>`): most overrides here fix a security advisory, a deprecated package or an incompatible version.
2. Note the current state: `npm ls <dependency>` and `npm audit --json | jq '.metadata.vulnerabilities'`.
3. Remove the entry from `overrides` in package.json (and its parent object if it becomes empty), then `npm install`.
4. Check:
   - `npm ls <dependency>`: the installed version still matches what the override forced (for a redundant one) or the dependency is gone (for an obsolete one).
   - `npm audit`: no new advisory. An override added for a security fix must not bring the advisory back.
   - `npm run lint`, `npm run jest`, and `ELEVENTY_PREVIEW=1 npx eleventy` (never a plain `npx eleventy`, which rewrites the source pages).
5. Run `npm run check:overrides` again: the removed entry is gone and the others are unchanged.
6. If anything moved the wrong way, put the entry back and `npm install`.

## A pin below the latest version (`⚠`)

The reason is not always written down. Look for it in this order: the commit body, the CHANGELOG.md entry of that commit, an issue of this repository that mentions the package (`gh issue list --search <package> --state all`), then the release notes and issues of the package itself for the newer version. If the newer version has no known problem, try it as in "Removing an override", with the tool that uses the package: `nwsapi` is used by the `jsdom` of `inline-critical`, which only runs in the Netlify build (`netlify-plugin-inline-critical-css`), so check the critical CSS of the next deploy. If no reason can be found, tell the user rather than removing it.

## Then

- Commit each removed override on its own with the `➖` gitmoji (CLAUDE.md), the reason in the message (`➖ Remove the handlebars override, auto-changelog and ts-jest now ask ^4.7.9`), or ask first if the user hasn't said to commit.
- Keep the npm overrides table of SECURITY.md in step: remove the row of a removed override, add one (path it comes through, reason, commit) for a new override. `npm run check:docs` fails while the table and `package.json` differ.
