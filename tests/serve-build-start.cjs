// Starts serve-build.mjs for the end-to-end tests (the Playwright browser specs, Cypress): on a free port, with the environment given (the build folder of ELEVENTY_OUTPUT), resolving with its address and its process once it has written the port it got, rejecting if it stops first
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..');

function startServeBuild(env = process.env) {
    const portFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-serve-')), 'port');
    const child = spawn(process.execPath, [path.join(root, 'tests', 'serve-build.mjs'), '--port-file', portFile], { cwd: root, env, stdio: 'ignore' });
    return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
            if (fs.existsSync(portFile) && fs.readFileSync(portFile, 'utf8')) {
                clearInterval(timer);
                resolve({ url: `http://localhost:${fs.readFileSync(portFile, 'utf8')}`, child });
            }
        }, 100);
        child.on('exit', code => {
            clearInterval(timer);
            reject(new Error(`serve-build.mjs exited with code ${code}`));
        });
    });
}

module.exports = { startServeBuild };
