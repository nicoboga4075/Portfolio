// The sections of the site, the pages at the root besides the home: every <name>_<defaultLang>.html of the root folder but index (blog, policy, terms), served at /<lang>/<name>; read by .eleventy.js (the sitemap) and gen-redirects.js (the pretty URLs and the 404 of the source pages) instead of a list kept in package.json.
const fs = require("node:fs");

module.exports = function resolveSections(root, defaultLang) {
    const suffix = `_${defaultLang}.html`;
    return fs.readdirSync(root)
        .filter(file => file.endsWith(suffix))
        .map(file => file.slice(0, -suffix.length))
        .filter(name => name !== "index")
        .sort();
};
