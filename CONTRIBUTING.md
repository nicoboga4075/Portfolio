# Contributing to Portfolio

Thank you for your interest in contributing to this portfolio.

## Getting Started

This repository is public, but external contributions are not open: opening issues and pull requests and commenting are limited to collaborators (GitHub interaction limits, renewed every six months). To report a vulnerability, follow [SECURITY.md](SECURITY.md#reporting-a-vulnerability).

## Development Workflow

This project uses multiple Git remotes to manage code across GitHub and GitLab and is deployed via Netlify.

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
| Push changes to GitLab              | `npm run mirror-git`       | `gitlab`                     |
| Push changes to both at once        | `git push origin main`     | `origin`                     |
| List all remotes                    | `git remote`               | `github`, `gitlab`, `origin` |
| List all remote actions             | `git remote -v`            | `github`, `gitlab`, `origin` |

### Deployment with Netlify

- Netlify is connected to the GitHub repository only.
- Every push to the `main` branch triggers an automatic build and deployment on Netlify **if build status is not set to Stopped and if "Lock auto-publishing" is not enabled**. Netlify runs `npm run build` and publishes the repository root. If the live site doesn't show the last commits, check *Deploys* in Netlify: no deploy, a failed build or locked auto-publishing.
- Netlify doesn't wait for the CI of GitHub Actions: while the builds run, a push goes online even if its Node.js CI fails. To publish only a commit whose CI passed, keep the builds stopped and publish with the `netlify-prod` skill of Claude Code (`/netlify-prod`), which checks the Node.js CI of the commit first and stops if it failed.
- Netlify does not receive code via Git commands directly, but via repository integration.
- Netlify automatically serves `index.html` when you visit a directory URL ending with a slash (e.g., /fr/ serves /fr/index.html). It also serves .html files when the extension is omitted in the URL, so /toto_fr will serve /toto_fr.html if that file exists. If a requested path does not match any file or redirect rule, Netlify serves the custom `/404.html` page if it is present in the site root. Otherwise, it displays its default 404 error page. Redirect rules in `_redirects` or `netlify.toml` are applied before this fallback behavior.
- Netlify builds run in a `Linux` (Ubuntu) environment. The shell used is `Bash`.
- "Pretty URLs" is set in `netlify.toml` (`[build.processing.html] pretty_urls = true`), not in the Netlify UI: the post processing drops `.html` and `index.html` from the internal links. The clean URLs themselves (`/en`, `/fr/blog`) come from `_redirects`. After a deploy that touches it, check the blog articles still load (`/.netlify/functions/article?filename=<slug>_<lang>.html` keeps its `.html`).
- The build also writes `api/articles.json` and `api/projects.json` (git-ignored, like `sitemap.xml` and the feeds): the articles and projects in every language, for the Botpress chatbot (an API call or its knowledge base, set up in Botpress Studio).
- Google Analytics (`js/analytics.js`) is only added to the pages by the production build on Netlify (`CONTEXT=production`): `npm run dev`, the preview build, deploy previews and branch deploys don't count visits. Don't add it again as a snippet injection in the Netlify settings, or every visit would count twice. It loads `gtag.js` only after the visitor accepts in the consent banner of `_includes/footer.html` (texts in `_data/consent.json`): keep it that way, nothing may be sent to Google before consent.

---

Make sure to push changes to the appropriate remote(s) depending on your workflow. 
- **For most cases, pushing to `origin` will update both GitHub and GitLab simultaneously**. It's possible to use directly `git push` in GitBash.
- To insure free mirroring between GitHub and GitLab:
  - If pushing was only on GitHub, use `npm run mirror-git` (`main` and the `v*` release tags) to synchronise the repo on GitLab.
  - If pushing was only on GitLab, use the following commands to synchronize the repo on GitHub:
    - `git fetch gitlab` (**do not use `git pull gitlab`**)
    - `git checkout main` if not already on main branch
    - `git rebase gitlab/main` to keep the same history (**do not use `git merge gitlab/main`**)
    - `git push --force github main` to overwrite history

In GitHub, the "Protect main" ruleset blocks force pushes and deletion of `main`; only the repository admin can bypass it (GitHub logs every bypass). In GitLab, when importing the repo, the `main` branch is set with labels `default` and `protected`. **Push force is not allowed by default in GitLab**.

### Conventions

- **Commits**: start the message with the [gitmoji](https://gitmoji.dev) of the change, as the character itself (`🐛 Fix ...`, `✨ Add ...`, `📝 Update ...`), one per commit. See [CLAUDE.md](CLAUDE.md).
- **Comments**: single-line comments in every language, one per branch rather than a block above several branches.
- **Before a commit**: the Claude Code hooks of `.claude/settings.json` run the HTML, CSS and JS lints (`npm run lint`) and block the commit on any error or warning.
- **README.md and SECURITY.md**: after changing a vendored library, a dependency version, a font, a security setting or a security alert, run `npm run check:docs` (the `update-docs` skill lists what to update).
- **Articles and projects**: use the `new-article` and `new-project` skills, then `npm run check:content`.
- **Tests**: a Jest unit test of `js/` sits next to the module it tests (`js/analytics.js` → `js/analytics.test.js`); those of the Netlify functions go in `tests/jest/netlify/` (`visit.mts` → `visit.test.ts`), since Netlify deploys every file of `netlify/functions/` as a function; the integration and E2E tests, which test the built site or a whole script, go in `tests/<tool>/` (`tests/playwright/`, `tests/cypress/`, `tests/robot/`).

### Add a video (.mp4 only, < 10 min and < 100Mo)

- Record a video with Windows + Shift + S (Snipping Tool).
- Edit it possibly with `Movavi Editor`.
- Use `Microsoft Clipchamp` to generate subtitles thanks to IA and select the option 'Hide subtitles in video' while exporting to have a separated .srt file.
- Convert it with the command: `ffmpeg -i ${SRT_NAME}.srt ${SRT_NAME}.vtt`.
- Do the same for other languages, translating potentially with Microsoft Word.
- Open the video with `HandBrake` and select checkbox 'Optimized for the web' in Resume, button 'Clean' in Subtitles and uncheck 'Create markers' in Chapters.
- Export it with default quality (Fast1080p30).
- Mux subtitles (burn in) into the video with the command:`ffmpeg -i ${VIDEO_NAME}.mp4  -i ${VIDEO_NAME}_FR.srt  -i ${VIDEO_NAME}_EN.srt -map 0 -map 1 -map 2 -metadata:s:s:0 language=fra -metadata:s:s:1 language=eng -c:v copy -c:a copy -c:s mov_text ${NEW_VIDEO_NAME}.mp4` (for instance, for French and English).
- Open the video with `VLC Media Player`. Make sure in Advanced Preferences > Subtitles & OSD, 'Detect auto subtitles files' option is unchecked. Following the previous example, you should see only two tracks in Subtitles (Track 1 - French, Track 2 - English).
- In HTML, use .vtt files (as .srt files are in .gitignore) and the following element:
<video controls>
	  <track label="Français" kind="subtitles" srclang="fr" src="${RELATIVE_PATH_TO_FRENCH_SUBTITLES}.vtt">
	  <track label="English" kind="subtitles" srclang="en" src="${RELATIVE_PATH_TO_ENGLISH_SUBTITLES}.vtt" default>
	  <source src="${RELATIVE_PATH_TO_VIDEO}.mp4" type="video/mp4">
</video>
You may add the attribute default for one track so as to have automatically the matched subtitles when playing the video online. Avoid assign it to the same language track as the audio or the application language.

### Add a Robot Framework test

Follow [tests/robot/ROBOT_FRAMEWORK.md](tests/robot/ROBOT_FRAMEWORK.md): the folder layout, the suite template, the writing rules, the run commands and the list of the tests, where each new test is added.
