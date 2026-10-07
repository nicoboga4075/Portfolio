#!/usr/bin/env node
// PreToolUse hook (Bash / PowerShell): before a `git commit`, runs the HTML, CSS and JS/MTS lints and blocks the commit (exit 2) on any error or warning.
import { spawnSync } from 'node:child_process';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const command = JSON.parse(input || '{}').tool_input?.command ?? '';

// Only `git commit` (not git commit-tree, nor the word "commit" inside a message of another command)
if (!/(^|[\s;&|(])git(\s+-\S+(\s+\S+)?)*\s+commit(\s|$)/.test(command)) {
    process.exit(0);
}

const lints = [
    ['HTML', 'npx html-validate --max-warnings 0 "*.html" "*/*.html"'],
    ['CSS', 'npx stylelint --max-warnings 0 "**/*.css"'],
    ['JS / MTS', 'npx eslint --max-warnings 0 .'],
];

const failures = [];
for (const [name, cmd] of lints) {
    const run = spawnSync(cmd, { cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(), shell: true, encoding: 'utf8' });
    if (run.status !== 0) {
        const output = `${run.stdout ?? ''}${run.stderr ?? ''}`.split('\n').filter(line => !line.startsWith('npm notice')).join('\n').trim();
        failures.push(`── ${name} lint failed (${cmd}) ──\n${output}`);
    }
}

if (failures.length) {
    console.error(`Commit blocked: the lint must pass with no error and no warning.\n\n${failures.join('\n\n')}`);
    process.exit(2);
}
