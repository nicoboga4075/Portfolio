// Capacitor config of the Android app: the web view loads the local site of npm run dev, on the port of [dev] in netlify.toml (adb reverse forwards it from the device).
const fs = require('node:fs');
const path = require('node:path');
const toml = require('toml');

const { port } = toml.parse(fs.readFileSync(path.join(__dirname, 'netlify.toml'), 'utf8')).dev;

module.exports = {
    appId: 'com.nicoboga.app',
    appName: 'Portfolio',
    webDir: '.eleventy',
    bundledWebRuntime: false,
    server: {
        url: `http://localhost:${port}`,
        cleartext: true
    }
};
