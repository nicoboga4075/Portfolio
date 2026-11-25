// Unit tests of lighthouse-report.js: the form factor it requires, the url it audits (the homepage of package.json by default), the Lighthouse arguments of mobile and desktop, and its exit code, Lighthouse mocked.
jest.mock('node:child_process', () => ({ spawnSync: jest.fn() }));

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const { homepage } = require(path.join(root, 'package.json'));
const reports = path.join(root, 'reports', 'lighthouse');
const argv = process.argv;

// Runs lighthouse-report.js with these arguments and returns the exit code it asked for
function run(args = [], status = 0) {
    process.argv = ['node', 'lighthouse-report.js', ...args];
    jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
    spawnSync.mockReturnValue({ status });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // process.exit stops the script: a throw does the same here
    const exit = jest.spyOn(process, 'exit').mockImplementation(code => {
        throw Object.assign(new Error('exit'), { code });
    });
    try {
        jest.isolateModules(() => require(path.join(root, 'lighthouse-report.js')));
    } catch (error) {
        if (error.message !== 'exit') throw error;
    }
    return exit.mock.calls.at(-1)[0];
}

// The arguments of the last Lighthouse run, after the path of its CLI
function lighthouseArgs() {
    const [command, args, options] = spawnSync.mock.calls.at(-1);
    expect(command).toBe(process.execPath);
    expect(args[0]).toBe(path.join(root, 'node_modules', 'lighthouse', 'cli', 'index.js'));
    expect(options).toEqual({ stdio: 'inherit' });
    return args.slice(1);
}

afterEach(() => {
    process.argv = argv;
    jest.restoreAllMocks();
    spawnSync.mockReset();
});

test('refuses to run without a known form factor', () => {
    expect(run()).toBe(1);
    expect(run(['tablet'])).toBe(1);
    expect(spawnSync).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Usage: node lighthouse-report.js <mobile|desktop> [url]');
});

test('audits the homepage on mobile, with the default form factor of Lighthouse, into reports/lighthouse', () => {
    expect(run(['mobile'])).toBe(0);
    expect(fs.mkdirSync).toHaveBeenCalledWith(reports, { recursive: true });
    expect(lighthouseArgs()).toEqual([homepage, '--output=html', '--output=json', `--output-path=${path.join(reports, 'mobile')}`, '--chrome-flags=--headless=new', '--quiet']);
});

test('audits the url given on desktop with the desktop preset', () => {
    expect(run(['desktop', 'http://localhost:8888/en'])).toBe(0);
    const args = lighthouseArgs();
    expect(args[0]).toBe('http://localhost:8888/en');
    expect(args).toContain(`--output-path=${path.join(reports, 'desktop')}`);
    expect(args.at(-1)).toBe('--preset=desktop');
});

test('exits with the status of Lighthouse, or 1 when it could not start', () => {
    expect(run(['mobile'], 2)).toBe(2);
    expect(run(['mobile'], null)).toBe(1);
});
