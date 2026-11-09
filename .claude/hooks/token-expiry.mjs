#!/usr/bin/env node
// SessionStart hook (startup): reads the expiry date of each token of the dev machine from the API it opens, and writes the dates only, never the values, to .github/token-expiry.json, which the weekly services report routine reads in its clone; a token renewed is caught at the next session, with no date to type by hand.
// GITHUB_PERSONAL_ACCESS_TOKEN: the user environment variable; GITHUB_API_TOKEN: its Netlify value, through the linked Netlify CLI (the default context, the production one being masked); both give their date in the github-authentication-token-expiration header of any GitHub API call, none for a token without expiry.
// GITLAB_TOKEN: the gitlab.com credential Git pushes with (Windows Credential Manager), whose date GitLab gives at /personal_access_tokens/self.
// A token that cannot be read (no network, CLI logged out, credential missing) keeps its last date; the file is only written when a date changes, and the session starts either way.
import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const file = path.join(root, '.github', 'token-expiry.json');
const timeout = 20_000;

// The date (YYYY-MM-DD) GitHub gives for a token, "none" for a token without expiry, null when it cannot be read
async function githubExpiry(token) {
    if (!token) {
        return null;
    }
    const response = await fetch('https://api.github.com/rate_limit', { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'portfolio-token-expiry' }, signal: AbortSignal.timeout(timeout) });
    if (!response.ok) {
        return null;
    }
    return response.headers.get('github-authentication-token-expiration')?.slice(0, 10) ?? 'none';
}

// The Netlify value of a variable, through the CLI (a .cmd on Windows, hence the shell)
async function netlifyEnv(name) {
    const { stdout } = await run('netlify', ['env:get', name], { cwd: root, shell: true, timeout, windowsHide: true });
    return stdout.trim();
}

// The gitlab.com password Git pushes with, asked of the credential helper without ever prompting
async function gitlabCredential() {
    const child = execFile('git', ['credential', 'fill'], { cwd: root, timeout, windowsHide: true, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' } });
    child.stdin.end('protocol=https\nhost=gitlab.com\n\n');
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    await new Promise((resolve, reject) => child.on('close', code => (code === 0 ? resolve() : reject(new Error(`git credential fill: ${code}`)))));
    return /^password=(.+)$/m.exec(output)?.[1] ?? null;
}

async function gitlabExpiry() {
    const token = await gitlabCredential();
    if (!token) {
        return null;
    }
    const response = await fetch('https://gitlab.com/api/v4/personal_access_tokens/self', { headers: { 'PRIVATE-TOKEN': token }, signal: AbortSignal.timeout(timeout) });
    if (!response.ok) {
        return null;
    }
    return (await response.json()).expires_at ?? 'none';
}

const readers = {
    GITHUB_API_TOKEN: async () => githubExpiry(await netlifyEnv('GITHUB_API_TOKEN')),
    GITHUB_PERSONAL_ACCESS_TOKEN: () => githubExpiry(process.env.GITHUB_PERSONAL_ACCESS_TOKEN),
    GITLAB_TOKEN: gitlabExpiry
};

let previous = {};
try {
    previous = JSON.parse(await readFile(file, 'utf8'));
} catch {
    // No file yet: every date read is new
}
const names = Object.keys(readers);
const read = await Promise.all(names.map(name => readers[name]().catch(() => null)));
const dates = Object.fromEntries(names.map((name, index) => [name, read[index] ?? previous[name] ?? 'unknown']));
const changed = names.filter(name => dates[name] !== previous[name]);
if (changed.length) {
    await writeFile(file, `${JSON.stringify(dates, null, 4)}\n`);
    console.log(`Token expiry dates updated in .github/token-expiry.json (commit it so the weekly report sees them): ${changed.map(name => `${name} ${previous[name] ?? 'none recorded'} -> ${dates[name]}`).join(', ')}`);
}
