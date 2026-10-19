// Unit tests of adb-reverse.js: the adb it runs (from ANDROID_HOME, ANDROID_SDK_ROOT or the default SDK folder), the reverse it asks for on the port of netlify.toml, and its exit code, adb mocked.
jest.mock('node:child_process', () => ({ spawnSync: jest.fn() }));

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const toml = require('toml');

const root = path.join(__dirname, '..', '..');
const { port } = toml.parse(fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8')).dev;
const env = { ...process.env };
const argv = process.argv;
const platform = process.platform;

// Runs adb-reverse.js with these arguments, adb found or not, and returns the exit code it asked for
function run(args = [], { adbExists = true, status = 0 } = {}) {
    process.argv = ['node', 'adb-reverse.js', ...args];
    jest.spyOn(fs, 'existsSync').mockReturnValue(adbExists);
    spawnSync.mockReturnValue({ status });
    // process.exit stops the script: a throw does the same here
    const exit = jest.spyOn(process, 'exit').mockImplementation(code => {
        throw Object.assign(new Error('exit'), { code });
    });
    try {
        jest.isolateModules(() => require(path.join(root, 'adb-reverse.js')));
    } catch (error) {
        if (error.message !== 'exit') throw error;
    }
    return exit.mock.calls.at(-1)[0];
}

// The adb path the script built, from the last spawnSync call
const adbPath = () => spawnSync.mock.calls.at(-1)[0];

afterEach(() => {
    process.env = { ...env };
    process.argv = argv;
    Object.defineProperty(process, 'platform', { value: platform });
    jest.restoreAllMocks();
    spawnSync.mockReset();
});

test('forwards the port of netlify.toml from the device, and exits with the code of adb', () => {
    process.env.ANDROID_HOME = path.join('sdk', 'home');
    expect(run([], { status: 0 })).toBe(0);
    expect(spawnSync).toHaveBeenCalledWith(expect.any(String), ['reverse', `tcp:${port}`, `tcp:${port}`], { stdio: 'inherit' });
    expect(run([], { status: 3 })).toBe(3);
});

test('stops forwarding with --remove', () => {
    process.env.ANDROID_HOME = path.join('sdk', 'home');
    run(['--remove']);
    expect(spawnSync).toHaveBeenCalledWith(expect.any(String), ['reverse', '--remove', `tcp:${port}`], { stdio: 'inherit' });
});

test('exits with 1 when adb gives no code, as when it is killed', () => {
    process.env.ANDROID_HOME = path.join('sdk', 'home');
    expect(run([], { status: null })).toBe(1);
});

test('takes adb.exe of ANDROID_HOME on Windows, adb elsewhere', () => {
    process.env.ANDROID_HOME = path.join('sdk', 'home');
    Object.defineProperty(process, 'platform', { value: 'win32' });
    run();
    expect(adbPath()).toBe(path.join('sdk', 'home', 'platform-tools', 'adb.exe'));
    Object.defineProperty(process, 'platform', { value: 'linux' });
    run();
    expect(adbPath()).toBe(path.join('sdk', 'home', 'platform-tools', 'adb'));
});

test('falls back on ANDROID_SDK_ROOT, then on the default SDK folder of Android Studio', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    delete process.env.ANDROID_HOME;
    process.env.ANDROID_SDK_ROOT = path.join('sdk', 'root');
    run();
    expect(adbPath()).toBe(path.join('sdk', 'root', 'platform-tools', 'adb'));
    delete process.env.ANDROID_SDK_ROOT;
    process.env.LOCALAPPDATA = path.join('local');
    run();
    expect(adbPath()).toBe(path.join('local', 'Android', 'Sdk', 'platform-tools', 'adb'));
    delete process.env.LOCALAPPDATA;
    run();
    expect(adbPath()).toBe(path.join('Android', 'Sdk', 'platform-tools', 'adb'));
});

test('says where it looked for adb and exits with 1 when adb is missing, without running anything', () => {
    process.env.ANDROID_HOME = path.join('sdk', 'home');
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(run([], { adbExists: false })).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining(path.join('sdk', 'home', 'platform-tools')));
    expect(spawnSync).not.toHaveBeenCalled();
});
