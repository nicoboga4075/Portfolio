#!/usr/bin/env node
// PreToolUse hook (Bash / PowerShell): before a `git commit` that contains code, asks Claude Haiku whether a unit, integration or E2E test covers it (in the commit, already in the repository, or to add later) and shows its reminder; it never blocks the commit.
import { spawnSync } from 'node:child_process';

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const MODEL = 'claude-haiku-5-5';
const CODE = /\.(m?js|cjs|ts|njk|html|css)$/i;
// A test is a file under a tests/ or cypress/ folder, or a *.test / *.spec / *.cy script anywhere.
const TEST_DIR = /(?:^|\/)(?:tests|cypress)\//i;
const TEST_FILE = /\.(?:test|spec|cy)\.(?:m?js|cjs|ts)$/i;
const isTest = file => TEST_DIR.test(file) || TEST_FILE.test(file);

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
    // The arguments of each git add / git commit of the command, split on spaces (no regex that backtracks over the whole command).
    const runs = [...command.matchAll(/\bgit\s(add|commit)\s([^;&|]*)/g)].map(([, verb, args]) => [verb, args.trim().split(/\s+/)]);
    const everything = runs.some(([verb, args]) => (verb === 'add'
        ? args.some(a => a === '.' || a === '-A' || a === '--all')
        : args.some(a => a === '--all' || /^-[a-z]*a[a-z]*$/i.test(a))));
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
const code = files.filter(f => CODE.test(f) && !isTest(f));
// No code, or a test in the commit: nothing to remind.
if (!code.length || files.some(isTest)) {
    process.exit(0);
}

const tests = git(['ls-files']).filter(f => isTest(f) && !f.endsWith('.gitkeep'));
const testList = tests.slice(0, 200).map(f => `- ${f}`).join('\n');
const question = [
    'A developer is about to commit these code files of a portfolio (Eleventy, Nunjucks, vanilla JS, Netlify functions):',
    ...code.map(f => `- ${f}`),
    '',
    tests.length ? `The repository already has these test files (Jest unit tests, Playwright and Cypress integration / E2E tests):\n${testList}` : 'The repository has no test file yet (no Jest, Playwright or Cypress test).',
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
// Claude also learns which sub-agent writes the tests, so a plain "yes, write them" from the developer is enough.
const context = `${message} If the developer asks for these tests, delegate them to the test-writer sub-agent (.claude/agents/test-writer.md) with these files: ${code.join(', ')}.`;
console.log(JSON.stringify({ systemMessage: `${message} Ask "write the tests" to have the test-writer agent write them.`, hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: context } }));
