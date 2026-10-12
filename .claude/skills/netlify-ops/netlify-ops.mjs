#!/usr/bin/env node
// Operates the Netlify site of the portfolio through the logged-in Netlify CLI (netlify api): status, stop or start the builds, lock or unlock the published deploy, build main with or without cache, restore a deploy.
// Usage: node .claude/skills/netlify-ops/netlify-ops.mjs <status|builds stop|builds start|lock|unlock|build [--clear-cache]|restore <deploy id>> [--yes]
// Every command but status only prints what it would do; add --yes to run it.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const yes = args.includes('--yes');
const [command, option] = args.filter(arg => arg !== '--yes');

// The site linked by `netlify link` (.netlify/state.json), else NETLIFY_SITE_ID
function siteId() {
    try {
        return JSON.parse(fs.readFileSync(path.join(ROOT, '.netlify', 'state.json'), 'utf8')).siteId;
    } catch {
        return process.env.NETLIFY_SITE_ID;
    }
}

// The CLI's own entry point, run with node: no shell, so the JSON data is passed as one argument on every OS
function netlifyBin() {
    const npm = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['root', '-g'], { encoding: 'utf8', shell: process.platform === 'win32' });
    const bin = path.join((npm.stdout ?? '').trim(), 'netlify-cli', 'bin', 'run.js');
    if (!fs.existsSync(bin)) throw new Error('netlify-cli is not installed globally: npm install -g netlify-cli, then netlify login');
    return bin;
}

function api(method, data) {
    const run = spawnSync(process.execPath, [netlifyBin(), 'api', method, '--data', JSON.stringify(data)], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
    if (run.status !== 0) throw new Error(`netlify api ${method} failed: ${(run.stderr || run.stdout || '').trim().split('\n').slice(-3).join(' ')}`);
    return JSON.parse(run.stdout);
}

const SITE = siteId();
if (!SITE) {
    console.error('No site: run netlify link in the repository, or set NETLIFY_SITE_ID');
    process.exit(1);
}

function status() {
    const site = api('getSite', { site_id: SITE });
    const deploys = api('listSiteDeploys', { site_id: SITE, per_page: 5 });
    return {
        site: site.name,
        url: site.ssl_url ?? site.url,
        repo: `${site.build_settings?.repo_url} (${site.build_settings?.repo_branch})`,
        buildsStopped: Boolean(site.build_settings?.stop_builds),
        published: { id: site.published_deploy?.id, locked: Boolean(site.published_deploy?.locked), at: site.published_deploy?.published_at, commit: site.published_deploy?.commit_ref?.slice(0, 7) },
        lastDeploys: deploys.map(d => ({ id: d.id, state: d.state, context: d.context, commit: d.commit_ref?.slice(0, 7) ?? null, created: d.created_at, locked: Boolean(d.locked), error: d.error_message ?? null })),
    };
}

// Prints the plan, and runs it only with --yes
function act(description, run) {
    if (!yes) {
        console.log(`Would ${description}. Run again with --yes to do it.`);
        return;
    }
    console.log(JSON.stringify(run(), null, 2));
}

function settingsSnapshot() {
    const { build_settings: b = {} } = api('getSite', { site_id: SITE });
    return { repo_url: b.repo_url, repo_branch: b.repo_branch, cmd: b.cmd, dir: b.dir, provider: b.provider };
}

try {
    // Read-only: the state of the builds, of the published deploy and of the last deploys
    if (command === 'status') {
        console.log(JSON.stringify(status(), null, 2));
    }
    // Stop or start the builds, then check no other build setting moved
    else if (command === 'builds' && ['stop', 'start'].includes(option)) {
        // Nothing to do when the builds are already in that state
        if (status().buildsStopped === (option === 'stop')) {
            console.log(`The builds are already ${option === 'stop' ? 'stopped' : 'running'}.`);
            process.exit(0);
        }
        act(`${option} the builds of ${SITE}`, () => {
            const before = settingsSnapshot();
            api('updateSite', { site_id: SITE, body: { build_settings: { stop_builds: option === 'stop' } } });
            const after = settingsSnapshot();
            const moved = Object.keys(before).filter(key => before[key] !== after[key]);
            if (moved.length) throw new Error(`build settings changed: ${moved.join(', ')}; restore them in the Netlify UI`);
            return { buildsStopped: status().buildsStopped };
        });
    }
    // Lock or unlock the published deploy (locked = new deploys build but are not published)
    else if (command === 'lock' || command === 'unlock') {
        const published = status().published;
        // Nothing to do when the published deploy is already in that state
        if (published.locked === (command === 'lock')) {
            console.log(`The published deploy ${published.id} is already ${command === 'lock' ? 'locked' : 'unlocked'}.`);
            process.exit(0);
        }
        act(`${command} the published deploy ${published.id} (${published.commit}, locked: ${published.locked})`, () => api(command === 'lock' ? 'lockDeploy' : 'unlockDeploy', { deploy_id: published.id }));
    }
    // Build the production branch, with or without the build cache
    else if (command === 'build') {
        const clearCache = option === '--clear-cache' || args.includes('--clear-cache');
        act(`start a build of the production branch${clearCache ? ' without cache' : ''}`, () => {
            const build = api('createSiteBuild', { site_id: SITE, body: { clear_cache: clearCache } });
            return { id: build.id, deployId: build.deploy_id, done: build.done };
        });
    }
    // Publish an earlier deploy again
    else if (command === 'restore' && option) {
        act(`publish the earlier deploy ${option} again`, () => api('restoreSiteDeploy', { site_id: SITE, deploy_id: option }));
    } else {
        console.error('Usage: netlify-ops.mjs <status|builds stop|builds start|lock|unlock|build [--clear-cache]|restore <deploy id>> [--yes]');
        process.exit(1);
    }
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
