const fs = require('fs');
const path = require('path');

const version = process.argv[2];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const d = new Date();
const releaseDate = process.argv[3] || String(d.getDate()).padStart(2, '0') + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();

if (!version) {
  console.error('Usage: node update-version.js <version> [releaseDate]');
  process.exit(1);
}

// Update CHANGELOG.md
const changelogPath = path.join(__dirname, 'CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');
changelog = changelog.replace(
  new RegExp(`(#### v${version.replace(/\./g, '\\.')}\\r\\n\\r\\n> )[^\\r\\n]*`),
  `$1${releaseDate}`
);
fs.writeFileSync(changelogPath, changelog);
console.log(`CHANGELOG.md updated -> v${version} / ${releaseDate}`);