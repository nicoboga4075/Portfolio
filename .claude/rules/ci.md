---
paths:
  - ".github/**"
  - ".gitlab/**"
  - "netlify.toml"
  - ".nvmrc"
---

# CI and deployment

- Node.js is always an LTS: `.nvmrc` (22.23.3) for Netlify and the single-version jobs (`node-version-file: .nvmrc`), the `lts/<codename>` aliases in the build matrix, with the full versions and their dates in its comment.
- Every job declares the least `permissions` it needs (`contents: read` by default).
- A workflow change is described in the CI/CD section of README.md, and a security setting (permissions, secrets, rulesets) in SECURITY.md: run `npm run check:docs` (`update-docs` skill).
- `.gitlab/.gitlab-ci.yml` runs in PowerShell on the self-hosted Windows runner `windows-local`; its `sonar-job` only analyses a commit GitHub Actions doesn't, so the two never overwrite each other in SonarCloud.
- `netlify.toml` holds the build, the dev ports and the production plugins; a page or function visitors see has its Lighthouse audit there. Any change on the live Netlify site goes through the `netlify-ops` or `netlify-prod` skill and asks first.
- Secrets live in the GitHub, Dependabot, GitLab and Netlify settings, never in a workflow file.
