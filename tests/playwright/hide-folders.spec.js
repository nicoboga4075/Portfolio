const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const script = path.join(__dirname, '..', '..', 'hide-folders.js');
const listed = ['.eleventy', '.netlify', 'api', 'logs', 'node_modules', 'reports'];
const created = ['api', 'logs', 'reports'];

// attrib prints an H flag before the path of a hidden item
const isHidden = dir => execFileSync('attrib', [dir], { encoding: 'utf8' }).split(dir)[0].includes('H');

let tmp;

test.beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hide-folders-'));
    fs.copyFileSync(script, path.join(tmp, 'hide-folders.js'));
    for (const folder of created) fs.mkdirSync(path.join(tmp, folder));
    fs.mkdirSync(path.join(tmp, 'other'));
});

test.afterEach(() => {
    if (process.platform === 'win32') {
        for (const folder of listed) {
            try { execFileSync('attrib', ['-h', path.join(tmp, folder)]); } catch { /* absent folder */ }
        }
    }
    fs.rmSync(tmp, { recursive: true, force: true });
});

// On a Linux desktop (outside CI and Netlify) the script writes the .hidden file the file managers read
const writesHiddenFile = process.platform === 'linux' && !process.env.CI && !process.env.NETLIFY;

test('runs without throwing and creates no folder', () => {
    execFileSync(process.execPath, [path.join(tmp, 'hide-folders.js')]);
    const expected = ['api', 'hide-folders.js', 'logs', 'other', 'reports', ...(writesHiddenFile ? ['.hidden'] : [])];
    expect(fs.readdirSync(tmp).sort()).toEqual(expected.sort());
});

test('exports hideFolders and does nothing on import', () => {
    const result = execFileSync(process.execPath, ['-e', `const m = require(${JSON.stringify(path.join(tmp, 'hide-folders.js'))}); console.log(typeof m.hideFolders)`], { encoding: 'utf8' });
    expect(result.trim()).toBe('function');
    if (process.platform === 'win32') expect(isHidden(path.join(tmp, 'api'))).toBe(false);
});

// Each system checks its own way of hiding, so the test runs everywhere instead of being skipped
test('hides the listed folders that exist the way the system does, and only them', () => {
    // Windows: the hidden attribute on each folder
    if (process.platform === 'win32') {
        execFileSync(process.execPath, [path.join(tmp, 'hide-folders.js')]);
        for (const folder of created) expect(isHidden(path.join(tmp, folder)), folder).toBe(true);
        expect(isHidden(path.join(tmp, 'other'))).toBe(false);
    }
    // macOS: the hidden flag, which ls -lO prints
    else if (process.platform === 'darwin') {
        execFileSync(process.execPath, [path.join(tmp, 'hide-folders.js')]);
        const flags = dir => execFileSync('/bin/ls', ['-lOd', dir], { encoding: 'utf8' });
        for (const folder of created) expect(flags(path.join(tmp, folder)), folder).toContain('hidden');
        expect(flags(path.join(tmp, 'other'))).not.toContain('hidden');
    }
    // Linux desktop: the names in .hidden, after the lines it already had
    else if (writesHiddenFile) {
        fs.writeFileSync(path.join(tmp, '.hidden'), 'mine\nlogs\n');
        execFileSync(process.execPath, [path.join(tmp, 'hide-folders.js')]);
        expect(fs.readFileSync(path.join(tmp, '.hidden'), 'utf8')).toBe('mine\nlogs\napi\nreports\n');
    }
    // Linux in CI or on Netlify: nothing is written
    else {
        execFileSync(process.execPath, [path.join(tmp, 'hide-folders.js')]);
        expect(fs.existsSync(path.join(tmp, '.hidden'))).toBe(false);
    }
    // A folder that was missing is not created
    expect(fs.existsSync(path.join(tmp, '.netlify'))).toBe(false);
});
