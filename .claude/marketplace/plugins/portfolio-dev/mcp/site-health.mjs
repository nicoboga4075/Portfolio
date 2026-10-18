// The health of the portfolio in one call: the live pages, the repository, the CI checks of origin/main on GitHub and the SonarCloud quality gate. Shared by the site_health tool of portfolio-mcp.mjs and the site-health-at-start and site-health-before-commit hooks.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

async function timed(url) {
    const start = Date.now();
    try {
        const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
        return { url, status: res.status, ms: Date.now() - start };
    } catch (error) {
        return { url, status: null, error: error.message };
    }
}

function git(root, args) {
    const run = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    return run.status === 0 ? run.stdout.trimEnd() : null;
}

async function ciChecks(sha) {
    try {
        const res = await fetch(`https://api.github.com/repos/nicoboga4075/Portfolio/commits/${sha}/check-runs`, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(15000) });
        if (!res.ok) return { error: `GitHub API ${res.status}` };
        return (await res.json()).check_runs.map(run => ({ name: run.name, status: run.status, conclusion: run.conclusion }));
    } catch (error) {
        return { error: error.message };
    }
}

function qualityGate(root) {
    const run = spawnSync('sonar', ['quality-gate', 'status', '--format', 'json'], { cwd: root, encoding: 'utf8', timeout: 60000, shell: process.platform === 'win32' });
    try {
        const gate = JSON.parse(run.stdout).qualityGate;
        return { status: gate.status, failing: gate.conditions.filter(c => c.status !== 'OK').map(c => `${c.metricName ?? c.metric}: ${c.formattedActualValue ?? c.actualValue} (needs ${c.comparator === 'LT' ? '≥' : '≤'} ${c.formattedThreshold ?? c.threshold})`) };
    } catch {
        return { error: 'sonar CLI unavailable or not logged in (sonar auth login)' };
    }
}

export async function fullHealth(root) {
    const { site, locales } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).config;
    const head = git(root, ['rev-parse', 'HEAD']);
    const remote = git(root, ['rev-parse', 'origin/main']);
    const [pages, ci] = await Promise.all([
        Promise.all(['', ...Object.keys(locales).flatMap(code => [`/${code}`, `/${code}/blog`])].map(p => timed(site + p))),
        remote ? ciChecks(remote) : Promise.resolve({ error: 'no origin/main' }),
    ]);
    return {
        live: pages,
        repository: {
            branch: git(root, ['rev-parse', '--abbrev-ref', 'HEAD']),
            head: head?.slice(0, 7),
            pushed: remote?.slice(0, 7),
            unpushed: Number(git(root, ['rev-list', '--count', 'origin/main..HEAD']) ?? 0),
            uncommitted: (git(root, ['status', '--porcelain']) ?? '').split('\n').filter(Boolean),
        },
        ci: { commit: remote?.slice(0, 7), checks: ci },
        sonarcloud: qualityGate(root),
    };
}

function livePart(pages) {
    const down = pages.filter(p => !p.status || p.status >= 400).map(p => `${p.url} ${p.status ?? p.error}`);
    return down.length ? `live pages down: ${down.join(', ')}` : `live pages OK (${pages.length})`;
}

function ciPart(checks) {
    if (!Array.isArray(checks)) return checks.error;
    const failed = [...new Set(checks.filter(c => c.conclusion && !['success', 'skipped', 'neutral'].includes(c.conclusion)).map(c => c.name))];
    if (failed.length) return `failed ${failed.join(', ')}`;
    const running = checks.filter(c => c.status !== 'completed').length;
    return running ? `${running} running` : 'green';
}

function gatePart(gate) {
    if (gate.error) return gate.error;
    return gate.failing.length ? `${gate.status}, ${gate.failing.join('; ')}` : gate.status;
}

const MOMENTS = { PreToolUse: 'before the commit', SessionStart: 'at the start of the session' };

// The health in one line, as the output of a PreToolUse or SessionStart hook: shown to the developer and passed to Claude, never blocking.
export function healthForHook(health, event = 'PreToolUse') {
    const parts = [livePart(health.live), `CI of ${health.ci.commit}: ${ciPart(health.ci.checks)}`, `SonarCloud: ${gatePart(health.sonarcloud)}`, `${health.repository.unpushed} unpushed commit(s)`];
    const message = `Site health ${MOMENTS[event] ?? MOMENTS.PreToolUse}: ${parts.join(' · ')}`;
    return { systemMessage: message, hookSpecificOutput: { hookEventName: event in MOMENTS ? event : 'PreToolUse', additionalContext: message } };
}
