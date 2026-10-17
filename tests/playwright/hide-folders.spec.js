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

test('runs without throwing and creates nothing', () => {
    execFileSync(process.execPath, [path.join(tmp, 'hide-folders.js')]);
    expect(fs.readdirSync(tmp).sort()).toEqual(['api', 'hide-folders.js', 'logs', 'other', 'reports']);
});

test('exports hideFolders and does nothing on import', () => {
    const result = execFileSync(process.execPath, ['-e', `const m = require(${JSON.stringify(path.join(tmp, 'hide-folders.js'))}); console.log(typeof m.hideFolders)`], { encoding: 'utf8' });
    expect(result.trim()).toBe('function');
    if (process.platform === 'win32') expect(isHidden(path.join(tmp, 'api'))).toBe(false);
});

test('hides the listed folders that exist, and only them', () => {
    test.skip(process.platform !== 'win32', 'attrib exists on Windows only');
    execFileSync(process.execPath, [path.join(tmp, 'hide-folders.js')]);
    for (const folder of created) expect(isHidden(path.join(tmp, folder)), folder).toBe(true);
    expect(isHidden(path.join(tmp, 'other'))).toBe(false);
    // A folder that was missing is not created
    expect(fs.existsSync(path.join(tmp, '.netlify'))).toBe(false);
});
