#!/usr/bin/env node
// PreToolUse hook (Bash / PowerShell): before a `git commit` that contains code, asks Claude Haiku whether a unit, integration or E2E test covers it (in the commit, already in the repository, or to add later) and shows its reminder; it never blocks the commit.
import { spawnSync } from 'node:child_process';

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const MODEL = 'claude-haiku-5-5';
const CODE = /\.(m?js|cjs|ts|njk|html|css)$/i;
const TEST = /(^|\/)(tests|cypress)\/|\.(test|spec|cy)\.(m?js|cjs|ts)$/i;

let input = '';
for await (const chunk of process.stdin) input += chunk;
const command = JSON.parse(input || '{}').tool_input?.command ?? '';

// Only `git commit` (not git commit-tree, nor the word "commit" inside a message of another command)
if (!/(^|[\s;&|(])git(\s+-\S+(\s+\S+)?)*\s+commit(\s|$)/.test(command) || /\s--dry-run(\s|$)/.test(command)) {
    process.exit(0);
}

const git = args => (spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' }).stdout ?? '').split(/\r?\n/).filter(Boolean);

// The files the commit will hold: already staged, staged by the same command (it runs after this hook), or every change for git add . / -A / commit -a.
function committedFiles() {
    const files = new Set(git(['diff', '--cached', '--name-only']));
    const everything = /\bgit\s+add\s+(.*\s)?(\.|-A|--all)(\s|$)|\bgit\s+commit\s+(.*\s)?-[a-zA-Z]*a/.test(command);
    if (everything) {
        git(['diff', '--name-only']).forEach(f => files.add(f));
        git(['ls-files', '--others', '--exclude-standard']).forEach(f => files.add(f));
    }
    for (const [, args] of command.matchAll(/\bgit\s+(?:add|rm|mv)\s+([^;&|]+)/g)) {
        args.trim().split(/\s+/).filter(a => !a.startsWith('-')).forEach(a => files.add(a.replaceAll(/^["']|["']$/g, '').replaceAll('\\', '/')));
    }
    return [...files];
}

const files = committedFiles();
const code = files.filter(f => CODE.test(f) && !TEST.test(f));
// No code, or a test in the commit: nothing to remind.
if (!code.length || files.some(f => TEST.test(f))) {
    process.exit(0);
}

const tests = git(['ls-files']).filter(f => TEST.test(f) && !f.endsWith('.gitkeep'));
const question = [
    'A developer is about to commit these code files of a portfolio (Eleventy, Nunjucks, vanilla JS, Netlify functions):',
    ...code.map(f => `- ${f}`),
    '',
    tests.length ? `The repository already has these test files (Jest unit tests, Playwright and Cypress integration / E2E tests):\n${tests.slice(0, 200).map(f => `- ${f}`).join('\n')}` : 'The repository has no test file yet (no Jest, Playwright or Cypress test).',
    '',
    'A test does not have to be in the same commit: it can already exist or come in a later commit. If the existing tests plausibly cover every one of these code files (by name, folder or feature), reply exactly OK. Otherwise reply with one short sentence that names the uncovered files and suggests the kind of test to write (unit, integration or E2E). No other text.'
].join('\n');

// Haiku runs on the claude.ai login: an ANTHROPIC_API_KEY of the shell would take precedence over it.
const { ANTHROPIC_API_KEY, ...env } = process.env;
const ask = spawnSync('claude', ['-p', '--model', MODEL, '--no-session-persistence', '--tools', '', '--strict-mcp-config', '--settings', '{"disableAllHooks":true}'], { cwd: ROOT, env, input: question, encoding: 'utf8', timeout: 60000, windowsHide: true });
const answer = (ask.stdout ?? '').trim();
if (ask.status === 0 && /^OK\.?$/i.test(answer)) {
    process.exit(0);
}
// Haiku answered with a reminder; when it could not be reached, the reminder is the plain list of files.
const reminder = ask.status === 0 && answer ? answer : `No test in this commit for ${code.join(', ')}: make sure a unit, integration or E2E test covers them, one that exists or one to add later.`;
const message = `Test reminder (not blocking): ${reminder}`;
console.log(JSON.stringify({ systemMessage: message, hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: message } }));
