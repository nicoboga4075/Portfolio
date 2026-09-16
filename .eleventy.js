const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");
const toml = require("toml");
const prettier = require("prettier");
const pkg = require("./package.json");
const outputFolder = ".eleventy";
const includesFolder = "_includes";
const allowedDirs = new Set([".", includesFolder, "articles", "projects"]);
// npm run dev serves the output folder; npm run build compiles html in place (article.mts reads it off disk).
const isPreview = !!process.env.ELEVENTY_PREVIEW;
const passthroughDirs = ["images", "css", "js", "fonts", "videos", "docs/public"];
const passthroughFiles = [
    "_redirects",
    "_headers",
    "service-worker.js",
    "site.webmanifest",
    "robots.txt",
    // Search Console token - keep this exact path (else it compiles to /googled.../index.html).
    "googled72e0253bbe65a2f.html",
    "favicon.ico",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "package.json"
];

// /sitemap.xml is built here from package.json "routes" (shared with
// gen-redirects.js; a plain require, not an Eleventy _data file - that would need
// "njk" back and the cascade only reaches templates).
//   locales    - language -> BCP-47 tag; its keys are the language list
//   defaultLang - "/" redirect + hreflang x-default
//   authorLang  - the author's own language (vs. the deployed default)
// Add a language: add its routes.locales entry + create the *_<lang>.html files.
const { site, locales, defaultLang, authorLang, sections, projects, articles } = pkg.routes;
const langs = Object.keys(locales);
for (const lang of [defaultLang, authorLang]) {
    if (!locales[lang]) {
        throw new Error(`package.json routes: "${lang}" is not a key of routes.locales`);
    }
}

// <lastmod> per url = last commit date of the page's own source file (git log;
// today when unavailable). Netlify's clone is full history, so this resolves there.
const dateCache = new Map();
function gitDate(file) {
    if (dateCache.has(file)) {
        return dateCache.get(file);
    }
    let date = new Date().toISOString().slice(0, 10);
    try {
        const out = execSync(`git log -1 --format=%cs -- "${file}"`, {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"]
        }).trim();
        if (out) {
            date = out;
        }
    } catch {
        // keep the today fallback
    }
    dateCache.set(file, date);
    return date;
}

// The same page in every language. `neutralPath` (home only, "/") also becomes the
// x-default target and gets its own <url>. All entries share the full alternates set.
function localised(toPath, toFile, neutralPath) {
    const alternates = [
        ...langs.map(lang => ({ hreflang: lang, href: site + toPath(lang) })),
        { hreflang: "x-default", href: site + (neutralPath || toPath(defaultLang)) }
    ];
    const urls = langs.map(lang => ({
        loc: site + toPath(lang),
        lastmod: gitDate(toFile(lang)),
        alternates
    }));
    if (neutralPath) {
        urls.unshift({ loc: site + neutralPath, lastmod: urls[0].lastmod, alternates });
    }
    return urls;
}

function buildSitemap() {
    return [
        ...localised(lang => `/${lang}`, lang => `index_${lang}.html`, "/"),
        ...sections.flatMap(slug =>
            localised(lang => `/${lang}/${slug}`, lang => `${slug}_${lang}.html`)),
        ...projects.flatMap(slug =>
            localised(lang => `/${lang}/${slug}`, lang => `projects/${slug}_${lang}.html`)),
        ...articles.flatMap(slug =>
            localised(
                lang => `/.netlify/functions/article?filename=${slug}_${lang}.html`,
                lang => `articles/${slug}_${lang}.html`
            ))
        // /404 omitted: noindex, soft 200 fallback only.
    ];
}

const xmlEscape = s => String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function sitemapXml(urls) {
    const body = urls.map(u => {
        const lines = [
            "    <url>",
            `        <loc>${xmlEscape(u.loc)}</loc>`,
            `        <lastmod>${u.lastmod}</lastmod>`
        ];
        for (const a of u.alternates) {
            lines.push(`        <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${xmlEscape(a.href)}"/>`);
        }
        lines.push("    </url>");
        return lines.join("\n");
    }).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
}

module.exports = function configureEleventy(eleventyConfig) {
    // -> repo root (the publish dir); passthrough-copied for the preview server.
    fs.writeFileSync(path.join(__dirname, "sitemap.xml"), sitemapXml(buildSitemap()));
    eleventyConfig.addPassthroughCopy("sitemap.xml");

    for (const name of fs.readdirSync(".")) {
        const fullPath = path.join(".", name);
        if (fs.statSync(fullPath).isDirectory() && !allowedDirs.has(name)) {
            eleventyConfig.ignores.add(name);
        }
    }
    const lighthousePlugin = toml.parse(fs.readFileSync("./netlify.toml", "utf-8")).context.production.plugins.find(p => p.package === "@netlify/plugin-lighthouse");
    const preset = lighthousePlugin?.inputs?.settings?.preset ?? "mobile";
    eleventyConfig.addGlobalData("viewport", preset);
    eleventyConfig.addGlobalData("author", "Nicolas BOGALHEIRO");
    eleventyConfig.addGlobalData("version", pkg.version);
    const linkedinDomain = "https://www.linkedin.com";
    const linkedinVanity = "nicolas-bogalheiro-126a7616b";
    eleventyConfig.addGlobalData("linkedin", {
        vanity: linkedinVanity,
        url: `${linkedinDomain}/in/${linkedinVanity}`,
        messaging: `${linkedinDomain}/messaging/thread/new`
    });
    eleventyConfig.addGlobalData("socials", [
        { href: `${linkedinDomain}/in/${linkedinVanity}`, label: "LinkedIn", icon: "linkedin" },
        { href: "https://github.com/nicoboga4075", label: "GitHub", icon: "github" },
        { href: "https://www.codingame.com/profile/8755914e3c5aeab435bb5ec921b9237e8911643", label: "CodinGame", icon: "gamepad" },
        { href: "https://www.chess.com/member/nicoboga4075knight", label: "Chess", icon: "king-outlined", modalIcon: "chessboard" }
    ]);
    eleventyConfig.addGlobalData("languages", {
        default: defaultLang,
        author: authorLang,
        locales
    });
    // Crawlable path to the same page in `lang`, matching buildSitemap()'s scheme:
    // "/<lang>" for home, "/<lang>/<slug>" for every section and project (the page
    // types the language switcher renders on). initTranslator() adds the
    // remembered #hash on top of this client-side.
    eleventyConfig.addFilter("localisedHref", (page, lang) => {
        const parts = page.fileSlug.split("_");
        parts.pop();
        const slug = parts.join("_");
        return slug === "index" ? `/${lang}` : `/${lang}/${slug}`;
    });
    // Resolves each article's bilingual title/tags to `lang` (falling back to `defaultLang`), leaving already single-language tags untouched.
    eleventyConfig.addFilter("resolveArticles", (articles, lang, defaultLang, locales) => {
        const langCodes = Object.keys(locales);
        const isBilingualText = value => typeof value === "object" && langCodes.every(code => code in value);
        const resolveTag = tag => {
            if (typeof tag === "string") return tag;
            if ("name" in tag && "url" in tag) {
                const name = isBilingualText(tag.name) ? (tag.name[lang] ?? tag.name[defaultLang]) : tag.name;
                return { [name]: tag.url };
            }
            return isBilingualText(tag) ? (tag[lang] ?? tag[defaultLang]) : tag;
        };
        return articles.map(article => ({
            slug: article.slug,
            title: article.title[lang] ?? article.title[defaultLang],
            date: article.date,
            tags: article.tags.map(resolveTag)
        }));
    });
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
        // .html only; input is "." so this skips the repo-root markdown docs.
        templateFormats: ["html"],
        // Render .html with Nunjucks (Eleventy defaults to Liquid, which lacks `| safe` and the {%- -%} / {% include %} syntax base.njk uses).
        htmlTemplateEngine: "njk"
    };
};
