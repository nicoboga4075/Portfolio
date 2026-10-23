#!/usr/bin/env node
// Gathers the CI state of one commit on both hosts: the GitHub Actions runs with their failed jobs and steps, the GitLab pipeline with the failure reason of each failed job, the GitLab runners, and the end of each failed log.
// Usage: node .claude/skills/fix-ci/ci-status.mjs [commit] [--lines N]
// Read-only: it never reruns, retries nor cancels anything. Needs gh and glab logged in.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const linesIndex = args.indexOf('--lines');
const LINES = linesIndex === -1 ? 20 : Number(args[linesIndex + 1]);
const ref = args.find((arg, index) => !arg.startsWith('--') && (linesIndex === -1 || index !== linesIndex + 1)) ?? 'HEAD';

// What each GitLab failure reason usually means on this repository
const REASONS = {
    stuck_pending_no_matching_runners: 'no runner picked the job: windows-local was off or its service stopped while the job waited (GitLab gives up after about 1 h 30)',
    stuck_or_timeout_failure: 'the job waited or ran too long: windows-local off, or a test that hangs',
    runner_system_failure: 'the runner itself failed (service crash, disk full, computer asleep): look at C:\\GitLab-Runner',
    job_execution_timeout: 'the job hit its timeout: a hung test or server (Playwright, the Robot Framework server)',
    script_failure: 'a command of the job failed: read the end of its log below',
    api_failure: 'GitLab could not talk to the runner: retry once'
};

function run(command, commandArgs) {
    const result = spawnSync(command, commandArgs, { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
    if (result.error) throw new Error(`${command} is not available (${result.error.code}): install it and log in`);
    if (result.status !== 0) throw new Error(`${command} ${commandArgs.join(' ')} failed: ${(result.stderr || result.stdout || '').trim().split('\n').slice(-2).join(' ')}`);
    return result.stdout;
}

const json = (command, commandArgs) => JSON.parse(run(command, commandArgs));
// The colours of the test runners, as escape characters (GitLab traces) or as their ^[ text (gh logs)
const clean = line => line.replace(/(?:\x1b|\^\[)\[[\d;]*m/g, '').replace(/\r$/, '');

// The first lines that name an error anywhere in the log, since the end of a log is often a summary table
function errorsOf(lines) {
    const errors = lines.filter(line => /\b(?:\w*Error|FAIL(?:ED)?|failing|Timed out|Timeout)\b|[✖✘●]/.test(line) && !line.includes('##[error]')).slice(0, 15);
    if (errors.length) console.log(`      errors:\n${errors.map(line => `        ${line.trim()}`).join('\n')}\n      end of the log:`);
}
const tail = text => text.trimEnd().split('\n').slice(-LINES).map(line => `      ${line}`).join('\n');

// Each host is read on its own, so a host that is down or logged out doesn't hide the other
function section(title, body) {
    console.log(`\n== ${title}`);
    try {
        body();
    } catch (error) {
        console.log(`  ⚠ ${error.message}`);
    }
}

const sha = run('git', ['rev-parse', ref]).trim();
console.log(`Commit ${sha.slice(0, 7)} ${run('git', ['log', '-1', '--format=%s', sha]).trim()}`);

section('GitHub Actions', () => {
    const runs = json('gh', ['run', 'list', '--commit', sha, '--limit', '50', '--json', 'databaseId,workflowName,status,conclusion,url']);
    if (!runs.length) console.log('  no run for this commit (not pushed to GitHub, or skipped by the workflow filters)');
    for (const workflow of runs) {
        console.log(`  ${workflow.conclusion || workflow.status} ${workflow.workflowName} ${workflow.url}`);
        if (workflow.conclusion !== 'failure') continue;
        const { jobs } = json('gh', ['run', 'view', String(workflow.databaseId), '--json', 'jobs']);
        for (const job of jobs.filter(item => item.conclusion === 'failure')) {
            const steps = job.steps.filter(step => step.conclusion === 'failure').map(step => step.name);
            console.log(`    ✖ ${job.name}${steps.length ? `, step: ${steps.join(', ')}` : ''}`);
        }
        // --log-failed prefixes each line with "job<TAB>step<TAB>timestamp": the lines that matter end at the first ##[error] of each job, before the post-job cleanup
        const log = run('gh', ['run', 'view', String(workflow.databaseId), '--log-failed']).split('\n').map(line => line.split('\t'));
        for (const name of new Set(log.map(([job]) => job).filter(Boolean))) {
            const lines = log.filter(([job]) => job === name).map(fields => clean(fields.slice(2).join('\t').replace(/^\S+Z /, '')));
            const error = lines.findIndex(line => line.includes('##[error]'));
            console.log(`    log of ${name}:`);
            errorsOf(lines);
            console.log(tail(lines.slice(0, error === -1 ? lines.length : error + 1).join('\n')));
        }
    }
});

section('GitLab', () => {
    const project = encodeURIComponent(run('git', ['remote', 'get-url', 'gitlab']).trim().replace(/^.*gitlab\.com[/:]/, '').replace(/\.git$/, ''));
    const runners = json('glab', ['api', `projects/${project}/runners`]);
    for (const runner of runners) console.log(`  runner ${runner.description || runner.name || `#${runner.id}`}: ${runner.status}${runner.paused ? ', paused' : ''}`);
    if (!runners.some(runner => runner.status === 'online')) console.log('  ⚠ no runner online: start windows-local (Start-Service gitlab-runner in an elevated PowerShell)');
    const [pipeline] = json('glab', ['api', `projects/${project}/pipelines?sha=${sha}&per_page=1`]);
    if (!pipeline) {
        console.log('  no pipeline for this commit (not pushed to GitLab: npm run mirror-git)');
        return;
    }
    console.log(`  ${pipeline.status} pipeline #${pipeline.iid} ${pipeline.web_url}`);
    if (pipeline.status === 'canceled') console.log('    canceled pipelines are usually replaced by the one of a newer push: check the next commit');
    const jobs = json('glab', ['api', `projects/${project}/pipelines/${pipeline.id}/jobs?per_page=100&include_retried=false`]);
    for (const job of jobs.filter(item => item.status === 'failed')) {
        const waited = job.queued_duration ? `, waited ${Math.round(job.queued_duration / 60)} min` : '';
        console.log(`    ✖ ${job.name} (${job.stage}): ${job.failure_reason}${waited}${job.allow_failure ? ', allowed to fail' : ''}`);
        if (REASONS[job.failure_reason]) console.log(`      → ${REASONS[job.failure_reason]}`);
        if (job.failure_reason !== 'script_failure') continue;
        const lines = run('glab', ['api', `projects/${project}/jobs/${job.id}/trace`]).split('\n').map(clean);
        errorsOf(lines);
        console.log(tail(lines.join('\n')));
    }
});
