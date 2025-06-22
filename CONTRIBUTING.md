# Contributing to Portfolio

Thank you for your interest in contributing to this portfolio.

## Getting Started

This repository is private : external contributions are limited.

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
- To insure free mirroring between GitHub and GitLab:
  - If pushing was only on GitHub, use `git push gitlab main` to synchronise the repo on GitLab.
  - If pushing was only on GitLab, use the following commands to synchronize the repo on GitHub:
    - `git fetch gitlab` (**do not use `git pull gitlab`**)
    - `git checkout main` if not already on main branch
    - `git rebase gitlab/main` to keep the same history (**do not use `git merge gitlab/main`**)
    - `git push --force github main` to overwrite history

No ruleset is declared by default in GitHub but in GitLab, when importing the repo, the `main` branch is set with labels `default` and `protected`. **Push force is not allowed by default in GitLab**.

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
