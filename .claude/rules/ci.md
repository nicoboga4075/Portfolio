---
paths:
  - ".github/**"
  - ".gitlab/**"
  - "netlify.toml"
  - ".nvmrc"
---

# CI and deployment

- Node.js is always an LTS: `.nvmrc` (22.23.4) for Netlify and the single-version jobs (`node-version-file: .nvmrc`), the `lts/<codename>` aliases in the build matrix, with the full versions and their dates in its comment.
- Every job declares the least `permissions` it needs (`contents: read` by default).
- A workflow change is described in the CI/CD section of README.md, and a security setting (permissions, secrets, rulesets) in SECURITY.md: run `npm run check:docs` (`update-docs` skill).
- `.gitlab/.gitlab-ci.yml` runs in PowerShell on the self-hosted Windows runner `windows-local`; its `sonar-job` only analyses a commit GitHub Actions doesn't, so the two never overwrite each other in SonarCloud.
- In `.gitlab/.gitlab-ci.yml` the runner fails the job when `$?` is false after a line, even for an error silenced by `-ErrorAction SilentlyContinue`: test the condition first (`if (Test-Path x) { Remove-Item x }`). PowerShell also drops a bare `--`: quote it to pass an option through npm (`npm run playwright '--' --workers=3`).
- `netlify.toml` holds the build, the dev ports and the production plugins; a page or function visitors see has its Lighthouse audit there. Any change on the live Netlify site goes through the `netlify-ops` or `netlify-prod` skill and asks first.
- Secrets live in the GitHub, Dependabot, GitLab and Netlify settings, never in a workflow file.
- The `overrides` of `package.json` only reach a Netlify build plugin installed from `node_modules`: `netlify-plugin-inline-critical-css` is a devDependency for that reason (its `nwsapi` and related overrides). Never judge a fix of a build plugin on a cached deploy: build without cache (`netlify-ops` skill).
- `_redirects` is written by `gen-redirects.js` from `config` of `package.json` on every build and dev start: never edit it. `/docs/public/*` comes first with a `200`, ahead of the `404!` block that hides the source pages, the root config and scripts, `package.json` and the internal folders; `/404` answers a real 404 status.
