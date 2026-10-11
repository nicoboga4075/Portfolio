#!/usr/bin/env node
// PreToolUse hook (Bash / PowerShell): before a `git commit`, shows the health of the site in one line (live pages, CI of origin/main, SonarCloud quality gate, unpushed commits); it never blocks the commit.
import { hookCommand, isGitCommit } from './git-commit.mjs';
import { fullHealth, healthForHook } from '../marketplace/plugins/portfolio-dev/mcp/site-health.mjs';

if (!isGitCommit(await hookCommand())) {
    process.exit(0);
}

// A failing check only leaves the line out: the commit goes on either way.
try {
    console.log(JSON.stringify(healthForHook(await fullHealth(process.env.CLAUDE_PROJECT_DIR || process.cwd()))));
} catch {
    process.exit(0);
}
