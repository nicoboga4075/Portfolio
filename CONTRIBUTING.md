# Contributing to Portfolio

Thank you for your interest in contributing to this portfolio.

## Getting Started

This repository is private : external contributions are limited.

## Git Remotes and Deployment Workflow

This project uses multiple Git remotes to manage code across GitHub and GitLab, and is deployed via Netlify.

### Git Remotes

- `github`: Points to the GitHub repository (fetch and push).
- `gitlab`: Points to the GitLab repository (fetch and push).
- `origin`: Configured to fetch from GitHub, but push to both GitHub and GitLab simultaneously.

### Common Git Commands

| Action                              | Command                    | Remote                       |
|-------------------------------------|----------------------------|------------------------------|
| Fetch latest changes                | `git fetch <remote>`       | `github`, `gitlab`, `origin` |
| Pull latest changes (fetch + merge) | `git pull <remote> main`   | `github`, `gitlab`, `origin` |
| Push changes to GitHub              | `git push github main`     | `github`                     |
| Push changes to GitLab              | `git push gitlab main`     | `gitlab`                     |
| Push changes to both at once        | `git push origin main`     | `origin`                     |
| List all remotes                    | `git remote`               | `github`, `gitlab`, `origin` |
| List all remote actions             | `git remote -v`            | `github`, `gitlab`, `origin` |

### Deployment with Netlify

- Netlify is connected to the GitHub repository only.
- Every push to the `main` branch triggers an automatic build and deployment on Netlify **if buid status is not set to Stopped and if "Lock auto-publishing" is not enabled**.
- Netlify does not receive code via Git commands directly, but via repository integration.

---

Make sure to push changes to the appropriate remote(s) depending on your workflow. 
- **For most cases, pushing to `origin` will update both GitHub and GitLab simultaneously**. It's possible to use directly `git push` in GitBash.
- To insure free mirroring between GitHub and GitLab  :
  - If pushing was only on GitHub, use `git push gitlab main` to synchronise the repo on GitLab.
  - If pushing was only on GitLab, use the following commands to synchronize the repo on GitHub :
    - `git fetch gitlab` (**do not use `git pull gitlab`**)
    - `git checkout main` if not already on main branch
    - `git rebase gitlab/main` to keep the same history (**do not use `git merge gitlab/main`**)
    - `git push --force github main` to overwrite history

No ruleset is declared by default in GitHub but in GitLab, when importing the repo, the `main` branch is set with labels `default` and `protected`. **Push force is not allowed by default in GitLab**.
