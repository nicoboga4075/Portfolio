// Gives the generated folders of the repository the Windows hidden attribute (attrib +h), which a folder loses when it is deleted and created again (the clean of a build, npm ci); does nothing on another system, where a dot folder is already hidden and the others stay visible.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const folders = ['.eleventy', '.netlify', 'api', 'logs', 'node_modules', 'reports'];

function hideFolders() {
    if (process.platform !== 'win32') return;
    for (const folder of folders) {
        const dir = path.join(__dirname, folder);
        if (fs.existsSync(dir)) execFileSync('attrib', ['+h', dir]);
    }
}

module.exports = { hideFolders };

// Run on its own by the postinstall script of package.json, after npm install or npm ci
if (require.main === module) hideFolders();
