---
name: netlify-ops
description: Operates the live Netlify site of the portfolio - shows its state (builds stopped or running, published deploy locked or not, last deploys), stops or starts the builds, locks or unlocks the published deploy, builds main with or without cache, restores an earlier deploy - through the logged-in Netlify CLI, always showing the state first and asking before any change. Use it whenever the user asks why the site is not deployed or not up to date, to deploy, redeploy, rebuild, clear the cache, stop or start the builds, lock or unlock auto publishing, roll back, or check a deploy, even if they don't say "Netlify".
metadata:
  category: Infrastructure Operations
---

# Operate the Netlify site

```
npm run netlify:ops -- status
```

That is `node .claude/skills/netlify-ops/netlify-ops.mjs`. It calls `netlify api` with the logged-in Netlify CLI (`netlify login`; `npm install -g netlify-cli` if missing) on the site linked in `.netlify/state.json` (or `NETLIFY_SITE_ID`). It never reads nor prints a token.

| Command | What it does |
|---|---|
| `status` | Read-only: the site, its repository and branch, whether the builds are stopped, the published deploy (id, commit, date, locked) and the last deploys with their state and error |
| `builds stop` / `builds start` | Stops or starts the builds (Netlify ignores the pushes while they are stopped); checks afterwards that no other build setting moved |
| `lock` / `unlock` | Locks or unlocks the published deploy: while locked, new deploys still build but are not published |
| `build` / `build --clear-cache` | Builds the production branch (`main`) now, with or without the build cache |
| `restore <deploy id>` | Publishes an earlier deploy again (an id from `status`) |

Every command but `status` only prints what it would do; it acts only with `--yes`. A command that would change nothing (locking a locked deploy, starting running builds) says so and stops.

## How to use it

1. Run `status` and show the user the state in a few lines: builds, lock, published commit and date, last deploys.
2. Explain what the change would do and ask for confirmation: every action touches the live site. Run the command without `--yes` to show the exact plan.
3. Run it with `--yes`, then `status` again to confirm.

## Common situations

- **The site is not up to date** (the published commit is older than `main`): look at `buildsStopped` and `published.locked`. Both must be off for a push to be published: `builds start`, `unlock`, then `build --clear-cache` if dependencies changed since the last deploy.
- **A deploy failed**: `status` shows its `error`; the details are in the Netlify deploy log. Fix it in the code, push, or `build` again.
- **Something broke in production**: `restore <id of the last good deploy>`, then `lock` so the next push doesn't replace it before the fix; `unlock` once fixed.
- **Hold publishing for a while** (a series of commits to ship together): `lock`, push, then `unlock` and `build`.

## Before unblocking deploys

Check what the next deploy will put online: `git log <published commit>..main --oneline`. Settings that live in the Netlify UI can conflict with the repository: for example the Google Analytics snippet injection must be removed before deploying `js/analytics.js`, or every visit counts twice (CONTRIBUTING.md, Deployment with Netlify).

## Not this skill

Setting up deploys (linking a repository, deploy contexts in `netlify.toml`, Deploy Previews, `netlify deploy --prod`): the `netlify-deploy` skill of the netlify-skills plugin. A manual `netlify deploy --prod` is replaced by the next build of `main`, so prefer `build` here.
