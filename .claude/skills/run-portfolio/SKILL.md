---
name: run-portfolio
description: Runs the portfolio locally and drives it in a headless browser - starts npm run dev (Eleventy preview build, netlify dev with the functions, browser-sync on the port of [dev] in netlify.toml), waits for it, then opens pages, takes screenshots, reads the console errors and switches the language with driver.mjs (Playwright Chromium). Use it when asked to run, start, launch, open, screenshot or smoke-test the site, to check a change in the real site rather than in the tests, or when the local site does not answer.
metadata:
  category: Product Verification
---

# Run the portfolio

The site runs locally through `npm run dev` and is driven by `.claude/skills/run-portfolio/driver.mjs`, a Playwright Chromium script that opens pages, saves screenshots and prints their title, h1 and console errors. Paths below are relative to the repository root. Verified on the Windows dev machine (Git Bash and PowerShell).

## Prerequisites

`npm ci` done, the Netlify CLI installed globally, logged in and linked (see CLAUDE.md), and the Playwright browsers of the project installed (`npm run playwright:install`, Playwright 1.64 here).

## Launch

Start the dev server in the background (Bash or PowerShell tool with `run_in_background`), never in the foreground: it never exits.

```bash
npm run dev
```

It regenerates `_redirects`, builds the preview into `.eleventy/` (about 13 s), then starts `netlify dev` on a free port (written to `.netlify/dev-proxy-port`) with its static server on `staticServerPort`, and only once `netlify dev` answers, browser-sync on `port` (both in the `[dev]` section of `netlify.toml`). `netlify dev` takes one to three minutes to answer and prints nothing meanwhile. Check once, then again later rather than in a tight loop:

```powershell
$dev = node -p "JSON.stringify(require('toml').parse(require('fs').readFileSync('netlify.toml', 'utf8')).dev)" | ConvertFrom-Json
try { (Invoke-WebRequest "http://localhost:$($dev.port)/en" -UseBasicParsing -TimeoutSec 10).StatusCode } catch { "DOWN: $($_.Exception.Message)" }
```

To see which ports are up and which process holds them:

```powershell
$proxy = Get-Content .netlify/dev-proxy-port -ErrorAction SilentlyContinue
Get-NetTCPConnection -State Listen -LocalPort (@($dev.port, $dev.staticServerPort, $proxy) -ne $null) -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, OwningProcess
```

## Drive it (agent path)

```bash
node .claude/skills/run-portfolio/driver.mjs
```

It reads the site port from `netlify.toml`, opens `en` and `en/blog`, then clicks FR in the language switcher of the English home page and checks that `html lang` is `fr`. One line per page, exit code 1 on an HTTP error, a console error or a failed switch:

```
/en -> http://localhost:<port>/en [200] title="Portfolio - Nicolas BOGALHEIRO" h1="Nicolas BOGALHEIRO" errors=0 screenshot=reports\run\en.png
```

Other pages, another server, another screenshot folder:

```bash
node .claude/skills/run-portfolio/driver.mjs en fr/blog --base http://localhost:61704 --out reports/run/static
```

Screenshots land in `reports/run/` (git-ignored): open them with Read and look at them. For clicks or forms beyond this flow, the Playwright MCP tools (`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_take_screenshot`) work against the site port too; their screenshots must stay under the repository (`.playwright-mcp/`), a path in the scratchpad is refused.

## Without netlify dev

When only the pages matter, serve the last preview build with `tests/serve-build.mjs` (no Netlify function) and point the driver at it:

```bash
node tests/serve-build.mjs --port-file reports/run/port.txt &
node .claude/skills/run-portfolio/driver.mjs en fr/blog --base http://localhost:$(cat reports/run/port.txt) --out reports/run/static
```

Expect exit code 1 there: the functions are missing, so every page logs a 404 and the home page `Error: GitHub fetch failed` (the `env?lang=` call), and the blog h1 stays empty (the `article` function fills it).

## Human path

`npm run dev`, then the site port opens in the browser once `netlify dev` answers; `npm run dev:watch` rebuilds on change.

## Stop

Find the processes by their command line, then stop `node dev-watch.js` and the `netlify-cli\bin\run.js dev` it started (`taskkill /PID <pid> /T /F`):

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'netlify|dev-watch|eleventy' } | Select-Object ProcessId, CommandLine | Format-List
```

## Gotchas

- Pass the page paths without their leading slash (`en/blog`, not `/en/blog`): Git Bash rewrites `/en` into `C:/Program Files/Git/en` before node sees it, and the driver navigates to `http://localhost:<port>C:/Program Files/Git/en`. The driver adds the slash itself.
- Silence from `netlify dev` for two or three minutes is normal, not a hang: the log stops at `[11ty] Copied … Wrote 36 files` until browser-sync starts.
- Never run `npm run build` or plain `npx eleventy` to get a build: they overwrite the source pages.
- `npm run dev` may already be running from another session: check the site port first and reuse it rather than starting a second one.

## Troubleshooting

- `Driver error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:<port>/en`: the site is not up yet, or `npm run dev` is not running. Check the port again in a minute.
- `Driver error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL` with `C:/Program Files/Git` in the URL: a path passed with its leading slash from Git Bash (see Gotchas).
- `net::ERR_UNSAFE_PORT`: Chromium refuses some ports (1, 6000…): use another one.
