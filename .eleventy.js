const fs = require("node:fs");
const path = require("node:path");
const toml = require("toml");
const prettier = require("prettier");
const outputFolder = ".eleventy";
const includesFolder = "_includes";
const allowedDirs = new Set([".", includesFolder, "articles", "projects"]);
// Local preview (npm run dev) serves straight from the output folder instead of
// compiling html back over the tracked source files. Production (npm run build)
// keeps the historical in-place compile, since netlify/functions/article.mts
// reads the compiled articles/*.html straight off disk at request time.
const isPreview = !!process.env.ELEVENTY_PREVIEW;
const passthroughDirs = ["images", "css", "js", "fonts", "videos", "docs/public"];
const passthroughFiles = [
    "_redirects",
    "_headers",
    "service-worker.js",
    "site.webmanifest",
    "robots.txt",
    "sitemap.xml",
    "favicon.ico",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "package.json"
];

module.exports = function configureEleventy(eleventyConfig) {
    for (const name of fs.readdirSync(".")) {
        const fullPath = path.join(".", name);
        if (fs.statSync(fullPath).isDirectory() && !allowedDirs.has(name)) {
            eleventyConfig.ignores.add(name);
        }
    }
    const lighthousePlugin = toml.parse(fs.readFileSync("./netlify.toml", "utf-8")).context.production.plugins.find(p => p.package === "@netlify/plugin-lighthouse");
    const preset = lighthousePlugin.inputs.settings.preset ?? "mobile";
    eleventyConfig.addGlobalData("viewport", preset);
    eleventyConfig.addGlobalData("author", "Nicolas BOGALHEIRO");
    for (const dir of passthroughDirs) {
        if (fs.existsSync(dir)) {
            eleventyConfig.addPassthroughCopy(dir);
        }
    }
    for (const file of passthroughFiles) {
        if (fs.existsSync(file)) {
            eleventyConfig.addPassthroughCopy(file);
        }
    }
    eleventyConfig.addTransform("prettify", async function (content, outputPath) {
        if (outputPath?.endsWith(".html")) {
            try {
                return await prettier.format(content, {
                    parser: "html",
                    tabWidth: 4,
                    useTabs: false,
                    printWidth: 1000,
                    htmlWhitespaceSensitivity: "strict",
                });
            } catch (e) {
                console.warn(`Prettier failed on ${outputPath}: ${e.message}`);
                return content;
            }
        }
        return content;
    });
    eleventyConfig.on("eleventy.before", () => {
        // Always start from a clean output folder so a stale preview build
        // can never leak into a production (in-place) compile, or vice versa.
        fs.rmSync(path.join(__dirname, outputFolder), {
            recursive: true,
            force: true
        });
    });
    eleventyConfig.on("eleventy.after", () => {
        if (isPreview) return;
        const publicDir = path.join(__dirname, outputFolder);
        if (!fs.existsSync(publicDir)) return;
        for (const dir of allowedDirs) {
            const srcDir = path.join(publicDir, dir);
            const destDir = path.join(__dirname, dir);
            if (!fs.existsSync(srcDir)) continue;
            for (const file of fs.readdirSync(srcDir)) {
                if (file.endsWith(".html")) {
                    fs.renameSync(path.join(srcDir, file), path.join(destDir, file));
                }
            }
        }
        fs.rmSync(publicDir, {
            recursive: true,
            force: true
        });
    });
    return {
        dir: { input: ".", includes: includesFolder, output: outputFolder },
        templateFormats: ["html"],
        htmlTemplateEngine: "njk"
    };
};