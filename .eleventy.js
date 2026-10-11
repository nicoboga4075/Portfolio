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
        // /404 omitted: it's an error page, not content.
    ];
}

const xmlEscape = s => String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

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

// Read at each call rather than required, so npm run dev:watch picks up a change of _data.
const readData = name => JSON.parse(fs.readFileSync(path.join(__dirname, "_data", `${name}.json`), "utf8"));
const inLang = (value, lang) => (value && typeof value === "object" && lang in value ? value[lang] : value);
// Strip tags until none is left: one pass would rebuild a tag split around another one ("<scr<b>ipt>" -> "<script>"), then drop any lone "<" or ">".
function plainText(html) {
    let text = String(html);
    let previous;
    do {
        previous = text;
        text = text.replaceAll(/<[^<>]*>/g, "");
    } while (text !== previous);
    return text.replaceAll(/[<>]/g, "").replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll(/\s+/g, " ").trim();
}
const tagName = (tag, lang) => {
    if (typeof tag === "string") return tag;
    if ("name" in tag) return inLang(tag.name, lang);
    return lang in tag ? tag[lang] : Object.keys(tag)[0];
};

function jsonLd({ page, lang, title, description, image, author, socials }) {
    const parts = page.fileSlug.split("_");
    parts.pop();
    const slug = parts.join("_");
    const inLanguage = locales[lang].replace("_", "-");
    const person = { "@type": "Person", "@id": `${site}/#person`, name: author, url: `${site}/${lang}`, sameAs: socials.map(s => s.href) };
    let data = null;
    // Home: who the author is, and the site itself
    if (slug === "index") {
        const roles = JSON.parse(plainText(readData("hero")[lang].roles));
        const about = readData("about")[lang];
        data = {
            "@graph": [
                { ...person, jobTitle: roles[0].replace(/\.$/, ""), description: plainText(description), alumniOf: { "@type": "CollegeOrUniversity", name: "ESILV", url: about.esilvHref } },
                { "@type": "WebSite", "@id": `${site}/#website`, name: plainText(title), url: site, inLanguage: langs.map(code => locales[code].replace("_", "-")), author: { "@id": `${site}/#person` } }
            ]
        };
    }
    // Blog: the list of the articles
    else if (slug === "blog") {
        data = {
            "@type": "Blog",
            name: plainText(title),
            description: plainText(description),
            url: `${site}/${lang}/blog`,
            inLanguage,
            author: person,
            blogPost: readData("articles").map(article => ({ "@type": "BlogPosting", headline: inLang(article.title, lang), datePublished: article.date, url: `${site}/${lang}/blog#${article.slug}` }))
        };
    }
    // Article: its title, date, tags and excerpt from _data, at the URL of the sitemap
    else if (page.inputPath.includes("/articles/")) {
        const articles = readData("articles");
        const index = articles.findIndex(a => a.slug === slug);
        const article = articles[index];
        // A blog card sits at the position of its article (npm run check:content): its id is the card image, not the slug
        const card = readData("blog").entries[index];
        if (article) {
            data = {
                "@type": "BlogPosting",
                headline: inLang(article.title, lang),
                description: card ? plainText(inLang(card.excerpt, lang)) : plainText(description),
                datePublished: article.date,
                inLanguage,
                keywords: article.tags.map(tag => tagName(tag, lang)).join(", "),
                image,
                url: `${site}/.netlify/functions/article?filename=${slug}_${lang}.html`,
                mainEntityOfPage: `${site}/${lang}/blog#${slug}`,
                author: person
            };
        }
    }
    // Project: its name and the page
    else if (page.inputPath.includes("/projects/")) {
        data = { "@type": "CreativeWork", name: plainText(description), url: `${site}/${lang}/${slug}`, inLanguage, image, author: person };
    }
    // Escape "<" so no value can close the <script> element
    return data ? JSON.stringify({ "@context": "https://schema.org", ...data }).replaceAll("<", String.raw`\u003c`) : "";
}

// The Atom feed of the blog in one language: each article's title, dates, excerpt and tags, linked to its place in the blog.
function feedXml(lang, author) {
    const blog = readData("blog");
    const atomDate = day => `${day}T00:00:00Z`;
    const entries = readData("articles").map((article, index) => {
        const link = `${site}/${lang}/blog#${article.slug}`;
        // The card at the same position (its id is the card image, not the slug)
        const excerpt = blog.entries[index]?.excerpt;
        const categories = article.tags.map(tag => `        <category term="${xmlEscape(tagName(tag, lang))}"/>`);
        const updated = gitDate(`articles/${article.slug}_${lang}.html`);
        return {
            updated,
            xml: [
                "    <entry>",
                `        <title>${xmlEscape(inLang(article.title, lang))}</title>`,
                `        <link rel="alternate" type="text/html" href="${xmlEscape(link)}"/>`,
                `        <id>${xmlEscape(link)}</id>`,
                `        <published>${atomDate(article.date)}</published>`,
                `        <updated>${atomDate(updated)}</updated>`,
                ...(excerpt ? [`        <summary>${xmlEscape(plainText(inLang(excerpt, lang)))}</summary>`] : []),
                ...categories,
                "    </entry>"
            ].join("\n")
        };
    });
    const updated = entries.map(e => e.updated).sort().at(-1);
    return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${locales[lang].replace("_", "-")}">
    <title>Portfolio - Blog</title>
    <subtitle>${xmlEscape(blog.sectionText[lang].tagline)}</subtitle>
    <link rel="self" type="application/atom+xml" href="${site}/feed_${lang}.xml"/>
    <link rel="alternate" type="text/html" href="${site}/${lang}/blog"/>
    <id>${site}/${lang}/blog</id>
    <updated>${atomDate(updated)}</updated>
    <author>
        <name>${xmlEscape(author)}</name>
        <uri>${site}/${lang}</uri>
    </author>
${entries.map(e => e.xml).join("\n")}
</feed>
`;
}

// Public data for the Botpress chatbot (and anyone): the articles and the projects in every language, the same fields as list_articles and list_projects of the portfolio-dev MCP server, without anything read from git or a secret.
function apiData() {
    const both = value => Object.fromEntries(langs.map(lang => [lang, plainText(inLang(value, lang) ?? "")]));
    const cards = readData("blog").entries;
    const articleList = readData("articles").map((article, index) => ({
        slug: article.slug,
        date: article.date,
        readTime: cards[index]?.readTime ?? null,
        title: both(article.title),
        // The card at the same position (its id is the card image, not the slug)
        excerpt: both(cards[index]?.excerpt),
        tags: Object.fromEntries(langs.map(lang => [lang, article.tags.map(tag => tagName(tag, lang))])),
        url: Object.fromEntries(langs.map(lang => [lang, `${site}/${lang}/blog#${article.slug}`]))
    }));
    // What the Explore button of each card opens, in the order of _data/projects.json (js/app.js appProjects, checked by npm run check:content)
    const block = fs.readFileSync(path.join(__dirname, "js", "app.js"), "utf8").match(/const appProjects = \[([^\]]*)\];/);
    const targets = block ? [...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
    const targetUrl = (target, lang) => {
        // An external page
        if (!target || /^https?:/.test(target)) return target ?? null;
        // A project page or an article of the blog
        return `${site}/${lang}/${target}`;
    };
    const projectList = readData("projects").cards.map((card, index) => ({
        id: card.id,
        title: plainText(inLang(card.title, defaultLang)),
        badge: plainText(card.badge ?? ""),
        context: both(card.context),
        description: both(card.description),
        technologies: plainText(inLang(card.technologies, defaultLang) ?? ""),
        hasPage: projects.includes(targets[index]),
        url: Object.fromEntries(langs.map(lang => [lang, targetUrl(targets[index], lang)]))
    }));
    return {
        articles: { site, languages: langs, articles: articleList },
        projects: { site, languages: langs, projects: projectList }
    };
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
    const author = "Nicolas BOGALHEIRO";
    eleventyConfig.addGlobalData("author", author);
    eleventyConfig.addGlobalData("version", pkg.version);
    // Google Analytics only on the Netlify production build: not in npm run dev, the preview build, deploy previews or branch deploys
    eleventyConfig.addGlobalData("analytics", { id: "G-S08CZ1FDQM", enabled: process.env.CONTEXT === "production" && !isPreview });
    const linkedinDomain = "https://www.linkedin.com";
    const linkedinVanity = "nicolas-bogalheiro-126a7616b";
    eleventyConfig.addGlobalData("linkedin", {
        vanity: linkedinVanity,
        url: `${linkedinDomain}/in/${linkedinVanity}`,
        messaging: `${linkedinDomain}/messaging/thread/new`
    });
    const calendlyUrl = "https://calendly.com/nicolas-bogalheiro/30min";
    eleventyConfig.addGlobalData("calendly", { en: calendlyUrl, fr: calendlyUrl });
    const socials = [
        { href: `${linkedinDomain}/in/${linkedinVanity}`, label: "LinkedIn", icon: "linkedin" },
        { href: "https://github.com/nicoboga4075", label: "GitHub", icon: "github" },
        { href: "https://www.codingame.com/profile/8755914e3c5aeab435bb5ec921b9237e8911643", label: "CodinGame", icon: "gamepad" },
        { href: "https://www.chess.com/member/nicoboga4075knight", label: "Chess", icon: "king-outlined", modalIcon: "chessboard" }
    ];
    eleventyConfig.addGlobalData("socials", socials);
    // The schema.org JSON-LD of a page (Person + WebSite for home, Blog, BlogPosting for an article, CreativeWork for a project), or "" for the other pages.
    eleventyConfig.addFilter("jsonLd", (page, lang, title, description, image) => jsonLd({ page, lang, title, description, image, author, socials }));
    // -> api/ at the repo root, like the feeds: /api/articles.json and /api/projects.json for the chatbot.
    const api = apiData();
    fs.mkdirSync(path.join(__dirname, "api"), { recursive: true });
    for (const [name, data] of Object.entries(api)) {
        fs.writeFileSync(path.join(__dirname, "api", `${name}.json`), `${JSON.stringify(data, null, 2)}\n`);
    }
    eleventyConfig.addPassthroughCopy("api");
    // -> repo root next to sitemap.xml, one Atom feed per language (/feed_en.xml, /feed_fr.xml).
    for (const lang of langs) {
        fs.writeFileSync(path.join(__dirname, `feed_${lang}.xml`), feedXml(lang, author));
        eleventyConfig.addPassthroughCopy(`feed_${lang}.xml`);
    }
    eleventyConfig.addGlobalData("siteLanguages", {
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
    let cleaned = false;
    eleventyConfig.on("eleventy.before", ({ runMode }) => {
        // Always start from a clean output folder so a stale preview build
        // can never leak into a production (in-place) compile, or vice versa.
        // Under --watch only the first build cleans: a rebuild re-copies just
        // the changed passthrough files, so wiping would delete the rest.
        if (runMode === "watch" && cleaned) return;
        cleaned = true;
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
