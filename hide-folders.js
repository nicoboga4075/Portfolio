// Hides the generated folders of the repository in the file manager of each system, which a folder forgets when it is deleted and created again (the clean of a build, npm ci): the hidden attribute on Windows, the hidden flag on macOS, the .hidden file on Linux.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const folders = ['.eleventy', '.netlify', 'api', 'logs', 'node_modules', 'reports'];

// The system tools by their full path, never looked up in PATH, where a writable folder could hold another one (SonarCloud S4036)
const attrib = path.join(process.env.SystemRoot ?? String.raw`C:\Windows`, 'System32', 'attrib.exe');
const chflags = '/usr/bin/chflags';

function hideFolders(root = __dirname) {
    const existing = folders.filter(folder => fs.existsSync(path.join(root, folder)));
    // Windows: the hidden attribute, a dot folder included since Explorer shows it otherwise
    if (process.platform === 'win32') {
        for (const folder of existing) execFileSync(attrib, ['+h', path.join(root, folder)]);
    }
    // macOS: Finder already hides a dot folder, the others get the hidden flag
    else if (process.platform === 'darwin') {
        for (const folder of existing.filter(name => !name.startsWith('.'))) execFileSync(chflags, ['hidden', path.join(root, folder)]);
    }
    // Linux: the file managers (Nautilus, Dolphin, Thunar) hide a dot folder and the names listed in the .hidden file of the parent folder, which keeps its other lines; not in CI nor on Netlify, where nobody browses the folder
    else if (process.platform === 'linux' && !process.env.CI && !process.env.NETLIFY) {
        const file = path.join(root, '.hidden');
        const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean) : [];
        const names = [...new Set([...lines, ...existing.filter(name => !name.startsWith('.'))])];
        if (names.length > lines.length) fs.writeFileSync(file, `${names.join('\n')}\n`);
    }
}

module.exports = { hideFolders };

// Run on its own with node hide-folders.js, for instance after npm ci recreated node_modules
if (require.main === module) hideFolders();
