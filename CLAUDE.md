# CLAUDE.md

## Commits

Start every commit message with the emoji from [gitmoji.dev](https://gitmoji.dev) that matches the change, as the character itself (not the `:code:`), followed by a space and the subject line. For example:

- `🐛 Fix ...` for a bug fix
- `✨ Add ...` for a new feature
- `💄 Update ...` for UI and style changes
- `♿️ Improve ...` for accessibility
- `♻️ Refactor ...` for a refactor
- `📝 Document ...` for documentation
- `🔧 Configure ...` for configuration files

One emoji per commit: pick the one for the main intent of the change.

## Comments

Prefer single-line comments, even long ones, in every language (CSS, JS, HTML, Nunjucks): no comment wrapped over several lines, and no numbered lists (`1.`, `2.`) inside a comment. When a comment explains several cases or branches, put one single-line comment on each branch instead of a block above them.

## Skills

The project skills live in `.claude/skills/<name>/SKILL.md`. Use the one that fits before doing the task by hand. The table is kept in step by `.claude/hooks/sync-skills-table.mjs` (after a SKILL.md is written, and before each commit): edit the "Use it to" text freely, the rows and scripts follow the skill folders.

<!-- skills:start -->
| Skill | Use it to | Script |
|---|---|---|
| `new-article` | Add a blog article in English and French (pages, data, route, images) | - |
| `new-project` | Add a project (card, Explore target, pages, redirects, audits) | - |
| `new-language` | Add or remove a language of the site | - |
| `check-content` | Check that articles and projects are wired everywhere, in the same order | `npm run check:content` |
| `i18n-l10n` | Check the translations and the built pages in every language | `npm run check:translation` |
| `check-links` | Check the external links (status, trailing slash, soft 404) | `npm run check:links` |
| `wcag-contrast` | Check and fix WCAG AA contrast after a colour or style change, only when asked | `npm run contrast`, `npm run contrast:quick` |
| `update-docs` | Keep README.md and SECURITY.md in step (vendored libraries, held-back versions, overrides, security log and practices) | `npm run check:docs` |
| `check-overrides` | Tell which npm overrides are still needed after a dependency update | `npm run check:overrides` |
| `robot-test` | Write and run a Robot Framework test following ROBOT_FRAMEWORK.md | - |
| `netlify-ops` | Check and operate the live Netlify site (builds, lock, build without cache, restore), asking before any change | `npm run netlify:ops` |
<!-- skills:end -->
