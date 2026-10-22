#!/usr/bin/env node
// Keeps the skills table of CLAUDE.md (between the skills:start and skills:end markers) in step with .claude/skills/*/SKILL.md and the npm scripts that run them.
// Usage: node .claude/hooks/sync-skills-table.mjs (update and report), --check (exit 1 when out of date, writes nothing), --edit (PostToolUse hook of Edit / Write), --before-commit (PreToolUse hook of Bash / PowerShell).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hookCommand, isGitCommit } from './git-commit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md');
const SKILLS = path.join(ROOT, '.claude', 'skills');
const START = '<!-- skills:start -->';
const END = '<!-- skills:end -->';
const mode = process.argv[2] ?? '';
const CATEGORIES = [
    'Library & API Reference',
    'Product Verification',
    'Data Fetching & Analysis',
    'Business Process & Team Automation',
    'Code Scaffolding & Templates',
    'Code Quality & Review',
    'CI/CD & Deployment',
    'Runbooks & Troubleshooting',
    'Infrastructure Operations',
];

// Each skill folder with a SKILL.md: the folder name (shown in the table, even when the frontmatter name differs, e.g. i18n-l10n is "translation"), the first clause of its description and the category of its metadata
function skills() {
    return fs.readdirSync(SKILLS, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && fs.existsSync(path.join(SKILLS, entry.name, 'SKILL.md')))
        .map(entry => {
            const text = fs.readFileSync(path.join(SKILLS, entry.name, 'SKILL.md'), 'utf8');
            const unquote = value => value?.trim().replace(/^["']|["']$/g, '') ?? '';
            const field = key => unquote(text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]);
            const summary = field('description').split(/ - |\. /)[0].replace(/\.$/, '');
            // The indented lines under metadata:, then their category: key
            const metadata = text.match(/^metadata:[ \t]*\r?\n((?:[ \t]+.*(?:\r?\n|$))*)/m)?.[1] ?? '';
            const category = unquote(metadata.match(/^[ \t]+category:[ \t]*(.+)$/m)?.[1]);
            return { dir: entry.name, summary, category };
        });
}

// The npm scripts that run a file of the skill folder
function scriptsOf(dir) {
    const scripts = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts ?? {};
    const names = Object.entries(scripts).filter(([, command]) => command.includes(`.claude/skills/${dir}/`)).map(([name]) => `\`npm run ${name}\``);
    return names.length ? names.join(', ') : '-';
}

// The rows already in the table: their order and their hand-written "Use it to" text are kept
function currentRows(table) {
    return table.split(/\r?\n/).filter(line => /^\| `[^`]+` \|/.test(line)).map(line => {
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        return { name: cells[0].replaceAll('`', ''), use: cells.at(-2) };
    });
}

// The category column always comes from metadata.category of each SKILL.md; a skill without one of CATEGORIES there is returned as an error
function render(table) {
    const found = skills();
    const known = currentRows(table);
    const kept = known.filter(row => found.some(skill => skill.dir === row.name));
    const added = found.filter(skill => !known.some(row => row.name === skill.dir)).sort((a, b) => a.dir.localeCompare(b.dir));
    const rows = [
        ...kept.map(row => ({ ...found.find(skill => skill.dir === row.name), use: row.use })),
        ...added.map(skill => ({ ...skill, use: skill.summary })),
    ];
    const errors = rows.filter(row => !CATEGORIES.includes(row.category)).map(row => `${row.dir} (category "${row.category}")`);
    const lines = ['| Skill | Category | Use it to | Script |', '|---|---|---|---|', ...rows.map(row => `| \`${row.dir}\` | ${row.category} | ${row.use} | ${scriptsOf(row.dir)} |`)];
    return { table: lines.join('\n'), errors };
}

// The CLAUDE.md text with an up-to-date table, or null when the markers are missing
function updated() {
    const text = fs.readFileSync(CLAUDE_MD, 'utf8');
    const start = text.indexOf(START);
    const end = text.indexOf(END);
    if (start === -1 || end < start) return { text, next: null, errors: [] };
    const { table, errors } = render(text.slice(start + START.length, end));
    const next = `${text.slice(0, start + START.length)}\n${table}\n${text.slice(end)}`;
    return { text, next, errors };
}

const { text, next, errors } = updated();
if (next === null) {
    console.error(`CLAUDE.md has no ${START} / ${END} markers around the skills table`);
    process.exit(mode === '--edit' ? 0 : 1);
}
const changed = next !== text;

// A skill without a valid category: nothing written, blocking in every mode (exit 2 hands the message back to Claude in the hooks)
if (errors.length) {
    console.error(`Skills without a valid category: ${errors.join(', ')}. Add to the frontmatter of their SKILL.md "metadata:" with an indented "category: <one of ${CATEGORIES.join(' | ')}>".`);
    if (mode === '--edit') {
        let input = '';
        for await (const chunk of process.stdin) input += chunk;
        const file = (JSON.parse(input || '{}').tool_input?.file_path ?? '').replaceAll('\\', '/');
        process.exit(/\/\.claude\/skills\/[^/]+\/SKILL\.md$/.test(file) ? 2 : 0);
    }
    if (mode === '--before-commit') process.exit(isGitCommit(await hookCommand()) ? 2 : 0);
    process.exit(1);
}

// Manual check: nothing written
if (mode === '--check') {
    console.log(changed ? 'The skills table of CLAUDE.md is out of date: run node .claude/hooks/sync-skills-table.mjs' : 'The skills table of CLAUDE.md is up to date');
    process.exit(changed ? 1 : 0);
}

// After an edit: only when a SKILL.md was written, never blocking
if (mode === '--edit') {
    let input = '';
    for await (const chunk of process.stdin) input += chunk;
    const file = (JSON.parse(input || '{}').tool_input?.file_path ?? '').replaceAll('\\', '/');
    if (!/\/\.claude\/skills\/[^/]+\/SKILL\.md$/.test(file) || !changed) process.exit(0);
    fs.writeFileSync(CLAUDE_MD, next);
    console.log(JSON.stringify({ systemMessage: 'Updated the skills table of CLAUDE.md' }));
    process.exit(0);
}

// Before a commit: catches deleted or renamed skills too, and blocks until CLAUDE.md is in the commit
if (mode === '--before-commit') {
    if (!isGitCommit(await hookCommand()) || !changed) process.exit(0);
    fs.writeFileSync(CLAUDE_MD, next);
    console.error('The skills table of CLAUDE.md was out of date (a skill was added, removed or renamed): it has been updated. Add CLAUDE.md to the commit and commit again.');
    process.exit(2);
}

// Manual run: update and report
if (changed) fs.writeFileSync(CLAUDE_MD, next);
console.log(changed ? 'Updated the skills table of CLAUDE.md' : 'The skills table of CLAUDE.md is up to date');
