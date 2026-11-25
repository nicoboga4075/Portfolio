// npm run lighthouse:mobile [-- <url>] / lighthouse:desktop [-- <url>]: the Lighthouse report of a page on mobile (Lighthouse's default) or on desktop (the preset of the Netlify plugin in netlify.toml), for the homepage of package.json or the url given (http://localhost:8888 after npm run dev), in HTML and JSON under reports/lighthouse/.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { homepage } = require('./package.json');

const formFactors = ['mobile', 'desktop'];
const [formFactor, url = homepage] = process.argv.slice(2);

if (!formFactors.includes(formFactor)) {
    console.error(`Usage: node lighthouse-report.js <${formFactors.join('|')}> [url]`);
    process.exit(1);
}
// The Lighthouse CLI of the project by its path, run by this node, in a headless Chrome found by chrome-launcher; it writes <form factor>.report.html and <form factor>.report.json
const cli = path.join(__dirname, 'node_modules', 'lighthouse', 'cli', 'index.js');
const reports = path.join(__dirname, 'reports', 'lighthouse');
fs.mkdirSync(reports, { recursive: true });
const args = [cli, url, '--output=html', '--output=json', `--output-path=${path.join(reports, formFactor)}`, '--chrome-flags=--headless=new', '--quiet'];
// Mobile is Lighthouse's default form factor and screen emulation: only desktop needs its preset
if (formFactor === 'desktop') {
    args.push('--preset=desktop');
}
process.exit(spawnSync(process.execPath, args, { stdio: 'inherit' }).status ?? 1);
