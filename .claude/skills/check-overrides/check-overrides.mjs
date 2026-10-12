#!/usr/bin/env node
// Tells, for each entry of "overrides" in package.json, whether it still changes what npm installs: the package that asks for the overridden dependency, the range it asks for, the version npm would pick without the override, and the commit that added the override.
// Usage: npm run check:overrides (exit 1 when an override is obsolete or redundant; it reads package-lock.json and the npm registry)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const json = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const semver = createRequire(path.join(ROOT, 'package.json'))('semver');

const overrides = json('package.json').overrides ?? {};
const lock = json('package-lock.json').packages;

// "js-yaml@^3" -> { name: "js-yaml", range: "^3" }; "@scope/pkg" -> { name: "@scope/pkg", range: null }
function parseKey(key) {
    const at = key.lastIndexOf('@');
    return at > 0 ? { name: key.slice(0, at), range: key.slice(at + 1) } : { name: key, range: null };
}

const nameOf = lockPath => lockPath.slice(lockPath.lastIndexOf('node_modules/') + 'node_modules/'.length);
const installed = name => Object.entries(lock).filter(([p]) => p && nameOf(p) === name).map(([p, meta]) => ({ path: p, version: meta.version }));
const wanted = (meta, dep) => meta.dependencies?.[dep] ?? meta.optionalDependencies?.[dep] ?? meta.peerDependencies?.[dep] ?? null;

// Every installed package that declares the dependency, optionally only inside one parent (and parent version range)
function requesters(dep, parent) {
    return Object.entries(lock)
        .filter(([p, meta]) => p && wanted(meta, dep))
        .filter(([p, meta]) => !parent || (nameOf(p) === parent.name && (!parent.range || semver.satisfies(meta.version, parent.range))))
        .map(([p, meta]) => ({ path: p, name: nameOf(p), version: meta.version, range: wanted(meta, dep) }))
        // One line per name@version, even when npm installed several copies of it
        .filter((r, i, all) => all.findIndex(o => o.name === r.name && o.version === r.version && o.range === r.range) === i);
}

const published = new Map();
function versionsOf(name) {
    if (!published.has(name)) {
        // No shell: the package name is passed as one argument
        const run = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['view', name, 'versions', '--json'], { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
        published.set(name, run.status === 0 ? [JSON.parse(run.stdout)].flat() : null);
    }
    return published.get(name);
}

// The first commit that wrote this exact override line ("key": "spec")
function addedBy(key, spec) {
    const run = spawnSync('git', ['log', '--reverse', '--format=%h %ad %s', '--date=short', `-S"${key}": "${spec}"`, '--', 'package.json'], { cwd: ROOT, encoding: 'utf8' });
    return (run.stdout ?? '').split('\n').find(Boolean) ?? 'unknown commit';
}

// Flattens { "a": "1", "p": { "b": "2" } } into [{ key, dep, parent, spec }]
function entries(tree, parent = null, prefix = '') {
    return Object.entries(tree).flatMap(([key, value]) => {
        if (typeof value === 'object') return entries(value, parseKey(key), `${prefix}${key} > `);
        const { name } = parseKey(key);
        return [{ label: `${prefix}${key}`, key, dep: name, parent, spec: value }];
    });
}

let problems = 0;
for (const entry of entries(overrides)) {
    const { spec } = entry;
    const alias = spec.startsWith('npm:');
    const asked = requesters(entry.dep, entry.parent);
    const origin = addedBy(entry.key, spec);
    console.log(`\n${entry.label}: ${spec}`);
    console.log(`  added by ${origin}`);

    if (!asked.length) {
        // For a nested override, only the packages of its parent count
        let scope = '';
        if (entry.parent) scope = entry.parent.range ? ` ${entry.parent.name}@${entry.parent.range}` : ` ${entry.parent.name}`;
        console.log(`  ✖ obsolete: no installed package${scope} depends on ${entry.dep} any more`);
        problems++;
        continue;
    }
    if (alias) {
        const users = asked.map(r => `${r.name}@${r.version} (asks ${r.range})`).join(', ');
        console.log(`  ✔ active: replaces ${entry.dep} with ${spec.slice(4)} for ${users}`);
        continue;
    }

    const versions = versionsOf(entry.dep);
    const needed = [];
    const older = [];
    for (const r of asked) {
        // The version npm would install for this package without the override
        const natural = versions ? semver.maxSatisfying(versions.filter(v => !semver.prerelease(v)), r.range) : null;
        const ok = natural && semver.satisfies(natural, spec);
        const marker = ok ? '·' : '→';
        const matches = ok ? `, which already matches ${spec}` : '';
        console.log(`  ${marker} ${r.name}@${r.version} asks ${entry.dep} ${r.range}: without the override npm would install ${natural ?? '?'}${matches}`);
        if (!ok) needed.push(r);
        // The override holds the dependency below the version npm would pick: the reason it was added may be gone
        if (!ok && natural && semver.gt(natural, semver.maxSatisfying(versions, spec) ?? '0.0.0')) older.push(`${r.name} would get ${natural}`);
    }
    if (!versions) console.log(`  ? could not read the published versions of ${entry.dep}: check by hand`);
    else if (needed.length) console.log(`  ✔ active: still needed for ${[...new Set(needed.map(r => r.name))].join(', ')}`);
    else {
        console.log(`  ✖ redundant: every package that asks for ${entry.dep} would already get a version matching ${spec}`);
        problems++;
    }
    if (older.length) console.log(`  ⚠ holds ${entry.dep} below the version npm would pick (${older.join(', ')}): check that the reason in the commit above still applies`);
    const now = installed(entry.dep).map(i => i.version);
    if (now.length) console.log(`  installed: ${[...new Set(now)].join(', ')}`);
}

const summary = problems ? `${problems} override(s) to remove or review` : 'Every override still changes what npm installs';
console.log(`\n${summary}`);
process.exit(problems ? 1 : 0);
