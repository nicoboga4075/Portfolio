// npm run adb:reverse [-- --remove]: forwards the port of [dev] in netlify.toml from the Android device to this PC, so the app of capacitor.config.js reaches the local site of npm run dev; --remove stops it (npm run adb:unreverse).
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const toml = require('toml');

const { port } = toml.parse(fs.readFileSync(path.join(__dirname, 'netlify.toml'), 'utf8')).dev;
// adb of the Android SDK by its absolute path (ANDROID_HOME, else the default SDK folder of Android Studio), not looked up through PATH
const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT ?? path.join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
const adb = path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');

if (!fs.existsSync(adb)) {
    console.error(`adb not found at ${adb}: install the Android SDK platform tools, or set ANDROID_HOME to the SDK folder.`);
    process.exit(1);
}
const args = process.argv.includes('--remove') ? ['reverse', '--remove', `tcp:${port}`] : ['reverse', `tcp:${port}`, `tcp:${port}`];
process.exit(spawnSync(adb, args, { stdio: 'inherit' }).status ?? 1);
