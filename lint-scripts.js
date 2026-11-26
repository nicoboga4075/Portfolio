// npm run lint:ps / lint:sh: lints the scripts the other linters don't read, and exits 1 on any error or warning. ps: PSScriptAnalyzer (settings in .gitlab/PSScriptAnalyzerSettings.psd1) on .gitlab/*.ps1, tests/powershell/*.ps1 and the PowerShell of each job of .gitlab/.gitlab-ci.yml, run by the windows-local runner. sh: ShellCheck on scripts/*.sh, the scripts package.json runs with bash, and on the Bats helpers of tests/bash, and actionlint on .github/workflows, which runs ShellCheck on each run: step.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const yaml = require('js-yaml');

const root = __dirname;
const ciFile = path.join(root, '.gitlab', '.gitlab-ci.yml');
const settings = path.join(root, '.gitlab', 'PSScriptAnalyzerSettings.psd1');

// The absolute path of a program found on PATH (with its .exe on Windows), or null; the programs are then run by that path, never looked up again
function findProgram(name, env = process.env, platform = process.platform) {
    const names = platform === 'win32' ? [`${name}.exe`, name] : [name];
    const dirs = (env.PATH ?? env.Path ?? '').split(path.delimiter).filter(Boolean);
    // On Windows, also the package folders of winget install, which the PATH of a shell opened before the install doesn't have yet
    const winget = path.join(env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Packages');
    if (platform === 'win32' && env.LOCALAPPDATA && fs.existsSync(winget)) {
        dirs.push(...fs.readdirSync(winget).map(folder => path.join(winget, folder)));
    }
    for (const dir of dirs) {
        for (const file of names) {
            const candidate = path.join(dir, file);
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
        }
    }
    return null;
}

// The PowerShell of each job of a GitLab CI file, its default before_script first, as { job, script } with one command per line
function gitlabJobScripts(source) {
    const ci = yaml.load(source);
    const lines = value => [value ?? []].flat().map(String);
    const before = lines(ci.default?.before_script);
    return Object.entries(ci)
        .filter(([, job]) => job && typeof job === 'object' && 'script' in job)
        .map(([job, def]) => ({ job, script: `${[...lines(def.before_script ?? before), ...lines(def.script), ...lines(def.after_script)].join('\n')  }\n` }));
}

// The files of a folder of the repository with this extension, as paths relative to the root
function filesOf(folder, extension) {
    return fs.readdirSync(path.join(root, folder)).filter(name => name.endsWith(extension)).map(name => path.posix.join(folder, name));
}

// Runs a program and returns its exit status and its output
function run(program, args, input) {
    const result = spawnSync(program, args, { cwd: root, encoding: 'utf8', input });
    return { status: result.status ?? 1, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
}

// The program, or a message saying how to install it, and a failure
function need(name, install) {
    const program = findProgram(name);
    if (!program) console.error(`${name} not found on PATH: ${install}`);
    return program;
}

function lintPowerShell() {
    const pwsh = need('pwsh', 'install PowerShell 7 (https://aka.ms/powershell)');
    if (!pwsh) return false;
    // The job scripts go to a temp folder, away from the folders npm run dev:watch watches, one file per job named after it
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-ps-'));
    try {
        for (const { job, script } of gitlabJobScripts(fs.readFileSync(ciFile, 'utf8'))) {
            fs.writeFileSync(path.join(dir, `${job}.ps1`), script);
        }
        const quote = value => `'${value.replaceAll("'", "''")}'`;
        const command = [
            "$ErrorActionPreference = 'Stop'",
            "if (-not (Get-Module -ListAvailable PSScriptAnalyzer)) { Write-Error 'PSScriptAnalyzer not found: Install-PSResource PSScriptAnalyzer -Scope CurrentUser' }",
            `$results = @(Invoke-ScriptAnalyzer -Path ${quote(path.join(root, '.gitlab'))} -Settings ${quote(settings)}) + @(Invoke-ScriptAnalyzer -Path ${quote(path.join(root, 'tests', 'powershell'))} -Settings ${quote(settings)}) + @(Invoke-ScriptAnalyzer -Path ${quote(dir)} -Settings ${quote(settings)})`,
            String.raw`foreach ($r in $results) { $file = if ($r.ScriptPath.StartsWith(${quote(dir)})) { '.gitlab/.gitlab-ci.yml, job ' + [IO.Path]::GetFileNameWithoutExtension($r.ScriptPath) + ', script line' } else { [IO.Path]::GetRelativePath(${quote(root)}, $r.ScriptPath).Replace('\', '/') }; '{0} {1}: {2} {3} {4}' -f $file, $r.Line, $r.Severity, $r.RuleName, $r.Message }`,
            'exit $results.Count',
        ].join('; ');
        const { status, output } = run(pwsh, ['-NoProfile', '-NonInteractive', '-Command', command]);
        if (output) process.stdout.write(`${output}\n`);
        return status === 0;
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function lintShell() {
    const shellcheck = need('shellcheck', 'install ShellCheck (https://github.com/koalaman/shellcheck#installing)');
    const actionlint = need('actionlint', 'install actionlint (https://github.com/rhysd/actionlint/blob/main/docs/install.md)');
    if (!shellcheck || !actionlint) return false;
    let ok = true;
    const scripts = run(shellcheck, ['--severity=warning', ...filesOf('scripts', '.sh'), ...filesOf('tests/bash', '.sh'), ...filesOf('tests/bash', '.bash')]);
    if (scripts.status !== 0) {
        process.stdout.write(`${scripts.output}\n`);
        ok = false;
    }
    const { status, output } = run(actionlint, ['-shellcheck', shellcheck, '-pyflakes', '']);
    if (status !== 0) {
        process.stdout.write(`${output}\n`);
        ok = false;
    }
    return ok;
}

const lints = { ps: lintPowerShell, sh: lintShell };
if (require.main === module) {
    const lint = lints[process.argv[2]];
    if (!lint) {
        console.error(`Usage: node lint-scripts.js <${Object.keys(lints).join('|')}>`);
        process.exit(1);
    }
    process.exit(lint() ? 0 : 1);
}

module.exports = { findProgram, gitlabJobScripts, filesOf };
