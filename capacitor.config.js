// Capacitor config of the Android app: the web view loads the local site of npm run dev, on the port of [dev] in netlify.toml (adb reverse forwards it from the device).
const fs = require('node:fs');
const path = require('node:path');
const toml = require('toml');
const pkg = require('./package.json');

const { port } = toml.parse(fs.readFileSync(path.join(__dirname, 'netlify.toml'), 'utf8')).dev;
// The Android package name, com.<first label of the homepage of package.json>.app (com.nicoboga.app for nicoboga.netlify.app), every character a Java identifier can't hold turned into _
const appId = `com.${new URL(pkg.homepage).hostname.split('.')[0].replaceAll(/\W/g, '_')}.app`;

module.exports = {
    appId,
    // The name of package.json, the one under the app icon
    appName: pkg.name,
    webDir: '.eleventy',
    bundledWebRuntime: false,
    server: {
        url: `http://localhost:${port}`,
        cleartext: true
    }
};
