#!/usr/bin/env node
// SessionStart hook (startup): shows the health of the site in one line (live pages, CI of origin/main, SonarCloud quality gate, unpushed commits); run with node rather than through the portfolio MCP server, which is still connecting when the session starts.
import { fullHealth, healthForHook } from '../marketplace/plugins/portfolio-dev/mcp/site-health.mjs';

// A failing check only leaves the line out: the session starts either way.
try {
    console.log(JSON.stringify(healthForHook(await fullHealth(process.env.CLAUDE_PROJECT_DIR || process.cwd()), 'SessionStart')));
} catch {
    process.exit(0);
}
