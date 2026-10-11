# CI/CD

The project runs two CI pipelines on every push to `main`: GitHub Actions in the cloud, and GitLab CI on a local runner (installed below). Netlify builds and deploys the site on its own.

## GitHub Actions

| Workflow | Trigger | What it does |
|---|---|---|
| `node.js.yml` (Node.js CI) | push and pull request on `main` | `build`: `npm ci` and `npm run build` on Node 20.x, 22.x and 24.x (20.x kept for backward compatibility). `test`: Jest and Playwright on Node 22.x, reports uploaded as the `reports` artifact. `sonar`: SonarCloud scan of those reports, skipped for Dependabot. Every job declares `permissions: contents: read` |
| `claude-code-review.yml` (Claude Code Review) | pull request opened, pushed or reopened | Claude reviews the pull requests of the repository owner, including the commits Claude pushes on them, and leaves inline comments. On a Dependabot pull request (which the `code-review` plugin skips as automated), Claude reads the release notes instead and posts one comment: a verdict and the changes that affect this repository. Skipped on a pull request that changes this workflow itself |
| `claude.yml` (Claude Code) | an issue or comment that mentions `@claude` | Claude answers, edits the code and pushes a branch with a "Create PR" link. Only people with write access can call it (never a bot, so it can't trigger itself). It can't change `.github/workflows/` (the Claude GitHub App has no `workflows` permission) nor open pull requests itself |
| `vendor-versions.yml` (Vendor library version check) | every Monday at 06:00 UTC, or by hand | Compares the libraries vendored in `js/` and `css/` (`.github/vendor-versions.json`) with npm, and opens or updates the "Vendor library updates available" issue with the latest release of the current major and the latest release |
| CodeQL (default setup) | push and pull request | Security analysis of the JavaScript / TypeScript (including the scripts inside the HTML) and of the workflows |

### Dependabot

`.github/dependabot.yml` checks:

- the npm dependencies every day at 06:00 Europe/Paris, weekends included (a cron schedule: the `daily` interval only runs on weekdays);
- the actions of the workflows every week, including the ones pinned to a commit SHA.

Security updates don't wait for the schedule: Dependabot opens them as soon as an advisory is published.

### Secrets

| Secret | Where | Used by |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Actions **and** Dependabot secrets | the Claude Code workflows (a workflow started by Dependabot only receives the Dependabot secrets). Generate it with `claude setup-token` |
| `SONAR_TOKEN` | Actions secrets, and a GitLab CI/CD variable | the SonarCloud scans |

## SonarCloud

Both pipelines analyse `main`: the `sonar` job of GitHub Actions (`sonarqube-scan-action`) and the `sonar-job` of GitLab CI (`npx @sonar/scan`). They must send the same project version: `@sonar/scan` reads it from `package.json`, and the GitHub job passes `-Dsonar.projectVersion` read from `package.json` too. Two different versions would make SonarCloud reset its "previous version" new code period at every analysis, and the coverage condition of the quality gate would be skipped.

## GitLab CI

`.gitlab-ci.yml` runs on the `windows-local` runner in PowerShell, so only while the computer that hosts it is on: `setup` (runner status), `build` (`npm ci`, `npm run build`), `test` (Jest, Playwright), `sonar` (`npx @sonar/scan`, allowed to fail) and `teardown` (cleans the build folder).


### Install the GitLab Runner

- The `gitlab-runner` will execute the pipeline on the local computer.  
- Download the `gitlab-runner.exe` `64bit version` file from [official website](https://docs.gitlab.com/runner/install/windows.html).  
- Place this file in `C:\GitLab-Runner\gitlab-runner.exe` *(you must rename the file)*.  
Open an administrator prompt *(otherwise the installation will work but you will have problems during the CI/CD)* and run the following commands :
- `cd C:\GitLab-Runner`
- `.\gitlab-runner.exe install` : Installation of the service gitlab-runner
- `.\gitlab-runner.exe start` : Start the service
- `.\gitlab-runner.exe register`: Registration of the runner
    - Enter the gitlab URL `https://gitlab.com/`
    - Enter the registration token. You can get it on `Project ==> Settings ==> CI/CD ==> Runners ==> Project runners`
    - Enter the name of the runner
    - Enter the runner executor : `shell`
- Then edit the file `C:\GitLab-Runner\config.toml` and make sure the file looks like below.  
```toml
concurrent = 1
check_interval = 0
shutdown_timeout = 0

[session_server]
  session_timeout = 1800

[[runners]]
  name = "<name>"
  url = "https://gitlab.com/"
  id = "<id>"
  token = "<token>"
  token_obtained_at = 2025-07-06T19:17:21Z
  token_expires_at = 0001-01-01T00:00:00Z
  executor = "shell"
  shell = "pwsh"
```
- Change pwsh for shell execution (to powershell for Windows runner or bash for Linux runner).
- Check the runner exists and is valid with 
	-`.\gitlab-runner.exe list`
	-`.\gitlab-runner.exe verify`
	-`.\gitlab-runner.exe status`
- The service can be stopped with `.\gitlab-runner.exe stop`.
- `.\gitlab-runner.exe` can be replaced by `gitlab-runner` in commands, adding `C:\GitLab-Runner` to PATH in system environment variables.
