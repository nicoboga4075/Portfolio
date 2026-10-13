---
name: netlify-prod
description: Puts the latest commit of main online on Netlify in one go - starts the builds if they are stopped, unlocks auto publishing if it is locked, builds main if no ready production deploy has that commit yet, then makes sure that deploy is the published one. Run only when the user types /netlify-prod.
disable-model-invocation: true
---

# Publish main to production

Typing `/netlify-prod` is the user's go-ahead for every step below: run them without asking again, but stop and report at the first failure. Every action goes through the `netlify-ops` script (see its SKILL.md), always with `--yes`:

```
npm run netlify:ops -- <command> --yes
```

## Steps

1. **State**: run `npm run netlify:ops -- status` and `git fetch origin main`, then note the commit to publish, `git rev-parse --short origin/main`. Show what will go online with `git log <published commit>..origin/main --oneline` (empty when it is already live).
2. **Builds**: if `buildsStopped` is true, run `builds start --yes`. Netlify ignores the pushes while the builds are stopped.
3. **Lock**: if `published.locked` is true, run `unlock --yes`, so the deploy goes online and later pushes are published on their own again.
4. **Deploy of that commit**: look in `lastDeploys` for a `production` deploy whose `commit` is the commit to publish.
   - `ready`: use it.
   - Building (`new`, `enqueued`, `building`, `uploading`, `processing` and the like): wait for it.
   - None, or only `error` ones: run `build --yes`, then wait for the new deploy.
   - To wait, run `status` again every 30 seconds, for 15 minutes at most. Stop and report the `error` if the deploy fails, or the last state if it is still not ready after 15 minutes.
5. **Publish**: once auto publishing is unlocked, a deploy that becomes ready is published by itself. If the ready deploy of that commit is still not the `published` one (it was built while the site was locked), run `restore <deploy id> --yes`.
6. **Check**: run `status` once more and confirm that `published.commit` is the commit of `origin/main` and that `published.locked` is false. Tell the user in a few lines: builds started or not, unlocked or not, deploy built or reused, published commit and time.

## Never

- Publish anything but the latest commit of `origin/main`, or a deploy whose context is not `production`.
- Lock auto publishing again, change any other build setting, or run a manual `netlify deploy --prod`.
