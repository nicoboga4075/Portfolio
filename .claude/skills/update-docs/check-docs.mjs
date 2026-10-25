#!/usr/bin/env node
// Checks that README.md and SECURITY.md still match the repository: vendored library versions, held-back versions, anchors between the two files, and the security alerts of GitHub.
// Usage: npm run check:docs (exit 1 on an error; warnings are printed but don't fail). Pass -- --offline to skip the GitHub checks (they need the gh CLI).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const json = file => JSON.parse(read(file));
// The owner/name of the GitHub repository of package.json
const REPO = new URL(json('package.json').repository.url).pathname.slice(1);
const offline = process.argv.includes('--offline');

const readme = read('README.md');
const security = read('SECURITY.md');
const vendors = json('.github/vendor-versions.json');
const errors = [];
const warnings = [];

// The rows of the first Markdown table that follows a heading, as arrays of trimmed cells (header and separator excluded).
function tableAfter(markdown, heading) {
    const start = markdown.indexOf(heading);
    if (start === -1) return null;
    const lines = markdown.slice(start).split(/\r?\n/);
    const first = lines.findIndex(line => line.startsWith('|'));
    if (first === -1) return null;
    const rows = [];
    for (const line of lines.slice(first + 2)) {
        if (!line.startsWith('|')) break;
        rows.push(line.split('|').slice(1, -1).map(cell => cell.trim()));
    }
    return rows;
}

const bare = cell => cell.replaceAll('**', '').trim();

// README: one row per vendored library, at the version of .github/vendor-versions.json
const readmeRows = tableAfter(readme, 'Vendored Libraries');
if (!readmeRows) {
    errors.push('README.md: no table under the "Vendored Libraries" heading');
} else {
    const listed = new Map(readmeRows.map(row => [bare(row[0]), row[1]]));
    for (const vendor of vendors) {
        if (!listed.has(vendor.name)) errors.push(`README.md: ${vendor.name} (${vendor.file}) is missing from the Vendored Libraries table`);
        else if (listed.get(vendor.name) !== vendor.version) errors.push(`README.md: ${vendor.name} is ${listed.get(vendor.name)} in the table but ${vendor.version} in .github/vendor-versions.json`);
    }
    for (const name of listed.keys()) {
        if (!vendors.some(vendor => vendor.name === name)) errors.push(`README.md: ${name} is in the Vendored Libraries table but not in .github/vendor-versions.json`);
    }
}

// SECURITY: the "Pinned" column of the held-back table matches what the repository really uses
const heldRows = tableAfter(security, 'Major versions held back on purpose');
if (!heldRows) {
    errors.push('SECURITY.md: no table under the "Major versions held back on purpose" heading');
} else {
    const installed = name => {
        try {
            return json(`node_modules/${name}/package.json`).version;
        } catch {
            return null;
        }
    };
    for (const row of heldRows) {
        const name = bare(row[0]);
        const pinned = row[1].split(' ')[0];
        const vendor = vendors.find(v => v.name === name);
        let actual = null;
        if (vendor) actual = vendor.version;
        else if (name === 'TypeScript') actual = installed('typescript');
        else if (name === 'Node.js') actual = process.version.slice(1);
        if (!actual) warnings.push(`SECURITY.md: can't tell which version of ${name} the repository uses, check the "Pinned" cell by hand`);
        else if (actual !== pinned && name !== 'Node.js') errors.push(`SECURITY.md: ${name} is pinned at ${pinned} in the table but the repository uses ${actual}`);
        else if (actual !== pinned) warnings.push(`SECURITY.md: Node.js is ${pinned} in the table and ${actual} on this machine (the CI may differ)`);
        if (!row[4] || !row[5]) errors.push(`SECURITY.md: the ${name} row has no Status or Acknowledgement`);
    }
}

// SECURITY: one row per entry of "overrides" in package.json, labelled like npm run check:overrides ("critical > oust")
const flatten = (tree, prefix = '') => Object.entries(tree).flatMap(([key, value]) => (typeof value === 'object' ? flatten(value, `${prefix}${key} > `) : [`${prefix}${key}`]));
const overrideRows = tableAfter(security, '## npm overrides');
if (!overrideRows) {
    errors.push('SECURITY.md: no table under the "npm overrides" heading');
} else {
    const listed = overrideRows.map(row => row[0].replaceAll('`', '').trim());
    const declared = flatten(json('package.json').overrides ?? {});
    for (const label of declared) {
        if (!listed.includes(label)) errors.push(`SECURITY.md: the override ${label} of package.json is missing from the npm overrides table`);
    }
    for (const label of listed) {
        if (!declared.includes(label)) errors.push(`SECURITY.md: ${label} is in the npm overrides table but no longer in the overrides of package.json`);
    }
}

// Anchors between the two files: a renamed heading breaks the links silently
const slug = heading => heading.toLowerCase().replaceAll(/[^\p{L}\p{N} _-]/gu, '').replaceAll(' ', '-');
const anchors = markdown => new Set(markdown.split(/\r?\n/).filter(line => /^#{1,6} /.test(line)).map(line => slug(line.replace(/^#{1,6} /, ''))));
const files = { 'README.md': readme, 'SECURITY.md': security };
for (const [from, markdown] of Object.entries(files)) {
    for (const [, target, anchor] of markdown.matchAll(/\]\((README\.md|SECURITY\.md)#([^)]+)\)/g)) {
        if (!anchors(files[target]).has(anchor)) errors.push(`${from}: the link to ${target}#${anchor} points to no heading`);
    }
}

// GitHub: every open alert is logged, and every logged issue that is still waiting is still open
function gh(endpoint) {
    // No shell: on Windows cmd.exe would cut the endpoint at its "&"
    const run = spawnSync('gh', ['api', '--paginate', endpoint], { cwd: ROOT, encoding: 'utf8' });
    if (run.status !== 0) throw new Error((run.stderr || run.stdout || 'gh failed').trim().split('\n')[0]);
    return JSON.parse(run.stdout.replaceAll('][', ','));
}

if (offline) {
    warnings.push('GitHub checks skipped (--offline)');
} else {
    try {
        for (const alert of gh(`repos/${REPO}/dependabot/alerts?state=open&per_page=100`)) {
            const { ghsa_id: ghsa, cve_id: cve, summary } = alert.security_advisory;
            if (!security.includes(ghsa) && !(cve && security.includes(cve))) errors.push(`SECURITY.md: open Dependabot alert #${alert.number} (${ghsa}, ${alert.dependency.package.name}) is not in the Vulnerability Disclosure Log: ${summary}`);
        }
    } catch (error) {
        warnings.push(`Dependabot alerts not checked: ${error.message}`);
    }
    try {
        for (const alert of gh(`repos/${REPO}/code-scanning/alerts?state=open&per_page=100`)) {
            if (!security.includes(alert.rule.id)) errors.push(`SECURITY.md: open code scanning alert #${alert.number} (${alert.rule.id}, ${alert.most_recent_instance.location.path}) is not in the Vulnerability Disclosure Log`);
        }
    } catch (error) {
        warnings.push(`Code scanning alerts not checked: ${error.message}`);
    }
    try {
        const waiting = security.split(/\r?\n/).filter(line => line.includes(':hourglass:'));
        const numbers = [...new Set(waiting.flatMap(line => [...line.matchAll(/issues\/(\d+)/g)].map(m => m[1])))];
        for (const number of numbers) {
            const issue = gh(`repos/${REPO}/issues/${number}`);
            if (issue.state === 'closed') warnings.push(`SECURITY.md: issue #${number} (${issue.title}) is closed but its row still shows :hourglass:, update the status`);
        }
    } catch (error) {
        warnings.push(`Issues not checked: ${error.message}`);
    }
}

for (const warning of warnings) console.log(`warning: ${warning}`);
for (const error of errors) console.log(`error: ${error}`);
console.log(errors.length ? `${errors.length} error(s), ${warnings.length} warning(s)` : `README.md and SECURITY.md are up to date (${warnings.length} warning(s))`);
process.exit(errors.length ? 1 : 0);
