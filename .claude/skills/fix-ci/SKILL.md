---
name: fix-ci
description: Finds why the CI of a commit failed on GitHub Actions or GitLab CI and fixes the cause - reads both hosts at once (Node.js CI with the build on Node 20/22/24, Jest, Playwright, Cypress, Robot Framework and the SonarCloud quality gate, CodeQL, the GitLab pipeline on the self-hosted runner windows-local) from the failed jobs, steps, failure reasons and log errors, then fixes the cause in the code or says what to restart. Use it when a pipeline, workflow, job or check is red, failed, stuck, pending for long or canceled, when the session start or the pre-commit health says the CI failed, when a push email reports a failure, or when the user asks why the CI or GitLab fails, even if they don't say "CI".
metadata:
  category: Runbooks & Troubleshooting
---

# Fix a failed CI

```
npm run ci:status -- [commit] [--lines N]
```

That is `node .claude/skills/fix-ci/ci-status.mjs` (commit: `HEAD` by default). Read-only, with `gh` and `glab` logged in. For the commit it prints:

- **GitHub Actions**: each run, the failed jobs with their failed step, then per job the lines that name an error and the end of the log up to its `##[error]`.
- **GitLab**: the runners and whether one is online, the pipeline, each failed job with its `failure_reason` and how long it waited, and for a `script_failure` the error lines and the end of its trace.

## Read the cause first

| What the script shows | Cause | Fix |
|---|---|---|
| GitLab `stuck_pending_no_matching_runners` or `stuck_or_timeout_failure`, waited 90 min or more, `status-job` failed and every other job skipped | `windows-local` was off, asleep or its service stopped: no runner took the job. `status-job` can't restart a runner that isn't running it | Nothing to fix in the code. Start the runner (`Start-Service gitlab-runner` in an elevated PowerShell), then retry the pipeline |
| GitLab pipeline `canceled` | Replaced by the pipeline of a newer push | Check the pipeline of the next commit instead |
| GitLab `sonar-job` failed after 20 min | It waits for the `sonar` job of GitHub and takes its verdict | Look at the GitHub `sonar` job: the cause is there |
| `sonar`: `QUALITY GATE STATUS: FAILED` | New code below the gate: coverage under 100 %, duplications, a new issue or hotspot | Read the gate with the SonarQube MCP (`get_project_quality_gate_status`, then `search_sonar_issues_in_projects` or `search_files_by_coverage`) and fix the code or add the test (`test-writer` agent) |
| `jest`: a failing test, or coverage under 100 % | A changed behaviour without its test, or a test out of date | `npm run jest` locally, fix, keep the coverage at 100 % (`collectCoverageFrom` of `jest.config.js`) |
| `build` failing on `lts/iron` only | An API newer than ES2023 or than Node 20 (`Object.groupBy`, `Promise.withResolvers`...) | Replace it (rule `site-js.md`); the matrix keeps Node 20 on purpose |
| `cypress` or `playwright`: `Timed out`, a selector not found | A changed id or class the specs use, or an element hidden until scrolled (`.ftco-animate`) | Run the suite locally (`npm run cypress`, `npm run playwright`) and fix the spec or the page; retry only a test that passes locally and fails once |
| `robot` | A page change the Robot keywords rely on | `tests/robot/ROBOT_FRAMEWORK.md`, then `npm run robot` |
| `npm ci` failing | `package-lock.json` out of step with `package.json`, or an `overrides` entry that no longer resolves | `npm install`, commit the lock, `npm run check:overrides` |

When the error lines are not enough, open the full log (`gh run view <run id> --log-failed`, or the job page from the GitLab link) before guessing.

## Then act

1. Show the user the cause in a few lines: host, job, error, and whether it comes from the code or from the infrastructure.
2. A cause in the code: fix it, run the matching suite and `npm run lint` locally, and propose the commit; never push to see whether it passes.
3. A cause in the infrastructure (runner off, a flaky test that passes locally): ask before retrying, since it starts the jobs again: `gh run rerun <run id> --failed` on GitHub, `glab ci retry <job id>` (or Retry on the pipeline page) on GitLab.
4. Run `npm run ci:status` again on the new commit or after the retry to confirm.
