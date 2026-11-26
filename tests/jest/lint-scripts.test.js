// Unit tests of lint-scripts.js: where it finds the linters (PATH, then the winget package folders on Windows), the PowerShell it reads from each GitLab CI job, and the files of a folder it lints.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { findProgram, gitlabJobScripts, filesOf } = require('../../lint-scripts');

const root = path.join(__dirname, '..', '..');
let dir;

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-scripts-'));
});

afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
});

// Creates an empty file at this path under the temp folder and returns its path
function touch(...parts) {
    const file = path.join(dir, ...parts);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '');
    return file;
}

describe('findProgram', () => {
    test('finds a program on PATH by its absolute path, skipping folders and missing entries', () => {
        fs.mkdirSync(path.join(dir, 'a', 'shellcheck'), { recursive: true });
        const file = touch('b', 'shellcheck');
        const env = { PATH: ['', path.join(dir, 'missing'), path.join(dir, 'a'), path.join(dir, 'b')].join(path.delimiter) };
        expect(findProgram('shellcheck', env, 'linux')).toBe(file);
    });

    test('reads Path when PATH is not set, and the .exe first on Windows', () => {
        const exe = touch('bin', 'actionlint.exe');
        touch('bin', 'actionlint');
        expect(findProgram('actionlint', { Path: path.join(dir, 'bin') }, 'win32')).toBe(exe);
    });

    test('falls back to the winget package folders on Windows only', () => {
        const exe = touch('Microsoft', 'WinGet', 'Packages', 'koalaman.shellcheck_x', 'shellcheck.exe');
        expect(findProgram('shellcheck', { LOCALAPPDATA: dir }, 'win32')).toBe(exe);
        expect(findProgram('shellcheck', { LOCALAPPDATA: dir }, 'linux')).toBeNull();
        expect(findProgram('shellcheck', { LOCALAPPDATA: path.join(dir, 'none') }, 'win32')).toBeNull();
        expect(findProgram('shellcheck', {}, 'win32')).toBeNull();
    });
});

describe('gitlabJobScripts', () => {
    test('joins the default before_script, the script and the after_script of each job, one command per line', () => {
        const source = [
            'default:',
            '  before_script:',
            '    - Write-Output "awake"',
            'stages: [build]',
            'variables:',
            '  A: b',
            'build-job:',
            '  script:',
            '    - npm ci',
            '    - |',
            '      if ($x) {',
            '        Write-Output "y"',
            '      }',
            '  after_script: Write-Output "done"',
            'own-job:',
            '  before_script: []',
            '  script: npm test',
        ].join('\n');
        expect(gitlabJobScripts(source)).toEqual([
            { job: 'build-job', script: 'Write-Output "awake"\nnpm ci\nif ($x) {\n  Write-Output "y"\n}\n\nWrite-Output "done"\n' },
            { job: 'own-job', script: 'npm test\n' },
        ]);
    });

    test('reads every job of .gitlab/.gitlab-ci.yml', () => {
        const jobs = gitlabJobScripts(fs.readFileSync(path.join(root, '.gitlab', '.gitlab-ci.yml'), 'utf8')).map(({ job }) => job);
        expect(jobs).toEqual(expect.arrayContaining(['status-job', 'build-job', 'jest-job', 'sonar-job']));
    });
});

describe('filesOf', () => {
    test('lists the files of a folder with the extension, relative to the root with forward slashes', () => {
        expect(filesOf('scripts', '.sh')).toEqual(expect.arrayContaining(['scripts/release.sh', 'scripts/tag-version.sh', 'scripts/push-all.sh', 'scripts/rollback-reflog.sh']));
        expect(filesOf('.gitlab', '.ps1').every(file => file.startsWith('.gitlab/') && file.endsWith('.ps1'))).toBe(true);
    });
});
