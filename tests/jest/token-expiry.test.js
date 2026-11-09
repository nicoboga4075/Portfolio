// The SessionStart hook .claude/hooks/token-expiry.mjs, run as Claude Code runs it (node, in its own process) in a temporary project folder, with the APIs, the Netlify CLI and the Git credential helper answered by token-expiry.preload.cjs.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const hook = path.join(__dirname, '..', '..', '.claude', 'hooks', 'token-expiry.mjs');
const preload = path.join(__dirname, 'token-expiry.preload.cjs');

// Every token readable, each with its date
const allReadable = {
    github: { 'pat-value': { status: 200, expiry: '2026-12-06 15:12:34 UTC' }, 'api-value': { status: 200, expiry: '2027-02-01 09:00:00 UTC' } },
    netlify: 'api-value',
    git: { code: 0, password: 'gitlab-value' },
    gitlab: { 'gitlab-value': { status: 200, expires_at: '2026-11-26' } }
};

let project;
const file = () => path.join(project, '.github', 'token-expiry.json');
const dates = () => JSON.parse(fs.readFileSync(file(), 'utf8'));

// Runs the hook with a scenario, the user variable GITHUB_PERSONAL_ACCESS_TOKEN set unless pat is null
function runHook(scenario, pat = 'pat-value') {
    const env = { ...process.env, CLAUDE_PROJECT_DIR: project, TOKEN_EXPIRY_SCENARIO: JSON.stringify(scenario) };
    delete env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (pat) {
        env.GITHUB_PERSONAL_ACCESS_TOKEN = pat;
    }
    const result = spawnSync(process.execPath, ['--require', preload, hook], { env, encoding: 'utf8' });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    return result.stdout;
}

beforeEach(() => {
    project = fs.mkdtempSync(path.join(os.tmpdir(), 'token-expiry-'));
    fs.mkdirSync(path.join(project, '.github'));
});

afterEach(() => fs.rmSync(project, { recursive: true, force: true }));

test('writes the date of each token, never its value, and says which ones changed', () => {
    const output = runHook(allReadable);
    expect(dates()).toEqual({ GITHUB_API_TOKEN: '2027-02-01', GITHUB_PERSONAL_ACCESS_TOKEN: '2026-12-06', GITLAB_TOKEN: '2026-11-26' });
    expect(fs.readFileSync(file(), 'utf8')).not.toMatch(/value/);
    expect(output).toContain('GITHUB_API_TOKEN none recorded -> 2027-02-01');
    expect(output).toContain('GITLAB_TOKEN none recorded -> 2026-11-26');
});

test('writes nothing and says nothing when no date changed, and names only the token renewed', () => {
    runHook(allReadable);
    const before = fs.statSync(file()).mtimeMs;
    expect(runHook(allReadable)).toBe('');
    expect(fs.statSync(file()).mtimeMs).toBe(before);

    const renewed = { ...allReadable, gitlab: { 'gitlab-value': { status: 200, expires_at: '2027-11-01' } } };
    const output = runHook(renewed);
    expect(output).toContain('GITLAB_TOKEN 2026-11-26 -> 2027-11-01');
    expect(output).not.toContain('GITHUB_API_TOKEN');
    expect(dates().GITLAB_TOKEN).toBe('2027-11-01');
});

test('keeps the last date of a token it cannot read: no variable, the Netlify CLI failing, no Git credential', () => {
    runHook(allReadable);
    expect(runHook({ github: {}, netlify: null, git: { code: 1, password: null } }, null)).toBe('');
    expect(dates()).toEqual({ GITHUB_API_TOKEN: '2027-02-01', GITHUB_PERSONAL_ACCESS_TOKEN: '2026-12-06', GITLAB_TOKEN: '2026-11-26' });
});

test('marks unknown a token it cannot read and has no date for: an API refusing the token, a credential without a password', () => {
    runHook({ github: { 'pat-value': { status: 401 } }, netlify: 'api-value', git: { code: 0, password: null }, gitlab: {} });
    expect(dates()).toEqual({ GITHUB_API_TOKEN: 'unknown', GITHUB_PERSONAL_ACCESS_TOKEN: 'unknown', GITLAB_TOKEN: 'unknown' });

    runHook({ ...allReadable, gitlab: { 'gitlab-value': { status: 403 } } });
    expect(dates().GITLAB_TOKEN).toBe('unknown');
});

test('writes none for a token without expiry, on GitHub as on GitLab', () => {
    runHook({ github: { 'pat-value': { status: 200 }, 'api-value': { status: 200 } }, netlify: 'api-value', git: { code: 0, password: 'gitlab-value' }, gitlab: { 'gitlab-value': { status: 200 } } });
    expect(dates()).toEqual({ GITHUB_API_TOKEN: 'none', GITHUB_PERSONAL_ACCESS_TOKEN: 'none', GITLAB_TOKEN: 'none' });
});

test('starts from nothing when the file of dates is not valid JSON', () => {
    fs.writeFileSync(file(), 'not json');
    expect(runHook(allReadable)).toContain('GITHUB_PERSONAL_ACCESS_TOKEN none recorded -> 2026-12-06');
});
