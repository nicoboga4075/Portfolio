# Portfolio plugins

A Claude Code marketplace that lives in this repository and is declared for this project only, in `.claude/settings.json` (`extraKnownMarketplaces` with a relative `directory` path, and `enabledPlugins`). It is not installed in other projects, and `/.claude/*` is a 404 on the public site (`gen-redirects.js`).

## portfolio-dev

### MCP server `portfolio`

`mcp/portfolio-mcp.mjs`, started by `.mcp.json` in the project directory, with no dependency of its own (it borrows the project's Playwright for `preview`). Its tools appear in Claude Code as `mcp__plugin_portfolio-dev_portfolio__<tool>`.

| Tool | What it gives |
|---|---|
| `list_articles` | The blog articles newest first, in one language: slug, title, date, read time, excerpt, tags, blog URL, source pages |
| `list_projects` | The project cards in home page order, with what their Explore button opens (`appProjects`) and their pages |
| `find_text` | Where a text seen on the site lives: the `_data` key path, or the page / include and line |
| `translation_gaps` | The result of `check-translation.mjs` as lists of errors, warnings and notes (`build: true` rebuilds first) |
| `preview` | A PNG of a page of the last build, served like Netlify (`/fr/blog#mcs`, `/en/panel_mnt`), light or dark, 320 to 1920 px wide |
| `site_health` | The live pages (status, time), the repository (unpushed commits, uncommitted files), the GitHub CI checks of `origin/main`, the SonarCloud quality gate (through the `sonar` CLI); `hook: true` returns it as one line of PreToolUse hook output, which the `mcp_tool` hook of `.claude/settings.json` shows before each commit |

It reads no secret: the visitor counter is left out, since its Supabase key exists only on Netlify.

The skills stay in `.claude/skills/` and the lint hook in `.claude/hooks/`: they are the project's, and `package.json` and `.claude/settings.json` call them.

## Changing the plugin

Claude Code runs a copy of the plugin (`~/.claude/plugins/cache/portfolio/`), not these files. After a change:

```
# raise "version" in plugins/portfolio-dev/.claude-plugin/plugin.json, then:
claude plugin marketplace update portfolio
claude plugin update portfolio-dev@portfolio --scope project
```

and restart Claude Code. `claude plugin validate .claude/marketplace` and `claude plugin validate .claude/marketplace/plugins/portfolio-dev` check the manifests.

On a new clone, Claude Code offers to install the plugins enabled in `.claude/settings.json`; otherwise run `claude plugin install portfolio-dev@portfolio --scope project` from the repository root.

OneDrive can leave a file as a cloud placeholder (a reparse point), and the install skips it without a word: if a file is missing from the cache, open the file (or rewrite it) so it is downloaded, then reinstall.
