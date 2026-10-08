#!/usr/bin/env node
// Checks the translation (i18n) and localisation (l10n) of the portfolio: every _data text in every language with the same shape, every page in every language, no template locked to one language, the runtime messages, then the built pages (html lang, language switcher, text left in the other language, dates, broken values).
// Usage: npm run check:translation [-- --no-build] (exit 1 on an error; warnings are printed but don't fail)
//   --no-build   reuse the current .eleventy output instead of rebuilding it (ELEVENTY_PREVIEW=1, sources untouched)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(ROOT, '.eleventy');
const args = new Set(process.argv.slice(2));
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const exists = file => fs.existsSync(path.join(ROOT, file));
const list = dir => (exists(dir) ? fs.readdirSync(path.join(ROOT, dir)) : []);

const langs = Object.keys(JSON.parse(read('package.json')).routes.locales);
const PAGE_DIRS = ['.', 'articles', 'projects'];
const errors = [];
const warnings = [];
const notes = [];

// Short words that only one language uses: a sentence with two of the other language's and none of its own is in the other language.
const FUNCTION_WORDS = {
    en: new Set(['the', 'and', 'of', 'to', 'with', 'for', 'your', 'you', 'is', 'are', 'this', 'that', 'in', 'on', 'my', 'an', 'it', 'be', 'or', 'by', 'from', 'what', 'how', 'more', 'about']),
    fr: new Set(['le', 'la', 'les', 'des', 'et', 'pour', 'avec', 'une', 'un', 'est', 'vous', 'votre', 'du', 'de', 'au', 'aux', 'sur', 'dans', 'mon', 'ma', 'mes', 'ce', 'cette', 'qui', 'que', 'plus', 'pas', 'en']),
};
const MONTHS = {
    en: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
};

// The words of a text, lower case, without the elided article of French (l', d', qu'...).
function wordsOf(text) {
    return (text.toLowerCase().match(/\p{L}+(?:['’]\p{L}+)?/gu) ?? []).map(w => w.replace(/^(?:l|d|j|qu|n|s|c|m|t)['’]/, ''));
}

// The language a text is written in, when its function words make it clear (null otherwise: a name, a list of technologies, a short label).
function languageOf(text) {
    const words = wordsOf(text);
    if (words.length < 4) return null;
    const counts = langs.map(lang => [lang, words.filter(w => FUNCTION_WORDS[lang]?.has(w)).length]);
    const found = counts.filter(([, n]) => n > 0);
    return found.length === 1 && found[0][1] >= 2 ? found[0][0] : null;
}

// ---- Data: every text of _data in every language, with the same shape ----
// A translation is an object with a key per language ({ en, fr }); its versions must have the same type, keys and lengths.
function compareVersions(versions, where) {
    const [[firstLang, firstValue], ...others] = versions;
    for (const [lang, value] of others) compareValues(firstValue, value, [firstLang, lang], where);
}

// Two versions of a text, compared all the way down: same type, same keys, same lengths, both empty or both filled.
function compareValues(a, b, [langA, langB], where) {
    const kind = v => (Array.isArray(v) ? 'array' : typeof v);
    if (kind(a) !== kind(b)) {
        errors.push(`${where}: "${langA}" is a ${kind(a)}, "${langB}" is a ${kind(b)}`);
    } else if (Array.isArray(a)) {
        if (a.length !== b.length) errors.push(`${where}: ${a.length} items in "${langA}", ${b.length} in "${langB}"`);
        a.slice(0, b.length).forEach((item, i) => compareValues(item, b[i], [langA, langB], `${where}[${i}]`));
    } else if (a && typeof a === 'object') {
        const missing = Object.keys(a).filter(k => !(k in b)).map(k => `${k} (missing in "${langB}")`);
        const extra = Object.keys(b).filter(k => !(k in a)).map(k => `${k} (missing in "${langA}")`);
        if (missing.length || extra.length) errors.push(`${where}: keys differ: ${[...missing, ...extra].join(', ')}`);
        for (const key of Object.keys(a).filter(k => k in b)) compareValues(a[key], b[key], [langA, langB], `${where}.${key}`);
    } else if (typeof a === 'string') {
        compareTexts(a, b, [langA, langB], where);
    }
}

function compareTexts(a, b, [langA, langB], where) {
    if (Boolean(a.trim()) !== Boolean(b.trim())) {
        errors.push(`${where}: empty in "${a.trim() ? langB : langA}" only`);
    } else if (a === b && languageOf(a)) {
        warnings.push(`${where}: same ${languageOf(a)} text in "${langA}" and "${langB}": "${a.slice(0, 70)}"`);
    }
}

function walkData(node, where) {
    if (Array.isArray(node)) {
        node.forEach((item, i) => walkData(item, `${where}[${i}]`));
        return;
    }
    if (!node || typeof node !== 'object') return;
    const present = langs.filter(lang => lang in node);
    if (present.length && present.length < langs.length) {
        errors.push(`${where}: has "${present.join('", "')}" but not "${langs.filter(l => !present.includes(l)).join('", "')}"`);
    } else if (present.length) {
        compareVersions(langs.map(lang => [lang, node[lang]]), where);
    }
    for (const [key, value] of Object.entries(node)) walkData(value, `${where}.${key}`);
}

for (const file of list('_data').filter(f => f.endsWith('.json'))) {
    walkData(JSON.parse(read(`_data/${file}`)), file.replace(/\.json$/, ''));
}

// ---- Runtime messages: every getMessage('key') of the scripts is in _data/messages.json ----
const messages = JSON.parse(read('_data/messages.json'));
const usedKeys = new Set();
for (const file of list('js').filter(f => f.endsWith('.js') && !f.endsWith('.min.js'))) {
    for (const [, key] of read(`js/${file}`).matchAll(/getMessage\(\s*['"]([\w-]+)['"]\s*\)/g)) {
        usedKeys.add(key);
        if (!(key in messages)) errors.push(`js/${file}: getMessage('${key}') has no entry in _data/messages.json`);
    }
}
const unusedKeys = Object.keys(messages).filter(k => !usedKeys.has(k));
if (unusedKeys.length) notes.push(`_data/messages.json keys no script asks for (built dynamically, or unused): ${unusedKeys.join(', ')}`);

// ---- Sources: every page in every language, no template locked to one language ----
const frontMatter = file => {
    const block = read(file).match(/^---\r?\n([\s\S]*?)\r?\n---/);
    return Object.fromEntries([...(block?.[1] ?? '').matchAll(/^(title|description):\s*"(.*)"\s*$/gm)].map(([, k, v]) => [k, v]));
};
const sources = PAGE_DIRS.flatMap(dir => list(dir).filter(f => f.endsWith('.html')).map(f => (dir === '.' ? f : `${dir}/${f}`)));
const translated = new Map();
for (const file of sources) {
    const match = file.match(/^(.*)_([a-z]{2})\.html$/);
    if (!match || !langs.includes(match[2])) continue;
    if (!translated.has(match[1])) translated.set(match[1], new Set());
    translated.get(match[1]).add(match[2]);
}
for (const [base, found] of translated) {
    for (const lang of langs.filter(l => !found.has(l))) errors.push(`${base}_${lang}.html is missing (${base} exists in ${[...found].join(', ')})`);
    if (found.size < langs.length) continue;
    const [first, ...others] = langs.map(lang => [lang, frontMatter(`${base}_${lang}.html`)]);
    for (const [lang, fields] of others) {
        for (const key of ['title', 'description']) {
            if (fields[key] && fields[key] === first[1][key] && languageOf(fields[key])) warnings.push(`${base}_${lang}.html: same ${key} as ${base}_${first[0]}.html: "${fields[key]}"`);
        }
    }
}
// The Nunjucks tags of a line ({{ ... }} and {% ... %}), read with indexOf rather than a backtracking regex.
function templateTags(line) {
    const tags = [];
    let from = line.indexOf('{');
    while (from >= 0) {
        const closing = { '{': '}}', '%': '%}' }[line[from + 1]];
        const end = closing ? line.indexOf(closing, from + 2) : -1;
        if (end >= 0) tags.push(line.slice(from, end + 2));
        from = line.indexOf('{', end >= 0 ? end + 2 : from + 1);
    }
    return tags;
}

// {{ x.en }} or {{ x['fr'] }} shows the same language on every page: templates read x[lang].
const templates = [...sources, ...list('_includes').filter(f => /\.(html|njk)$/.test(f)).map(f => `_includes/${f}`)];
const langAccess = new RegExp(String.raw`(?:\.(?:${langs.join('|')})\b(?!\.html)|\[\s*['"](?:${langs.join('|')})['"]\s*\])`);
for (const file of templates) {
    read(file).split(/\r?\n/).forEach((line, i) => {
        for (const tag of templateTags(line)) {
            if (langAccess.test(tag)) errors.push(`${file}:${i + 1}: ${tag.trim()} is locked to one language (use [lang])`);
        }
    });
}

// ---- Built pages ----
if (!args.has('--no-build')) {
    const eleventy = path.join(ROOT, 'node_modules', '@11ty', 'eleventy', 'cmd.cjs');
    const build = spawnSync(process.execPath, [eleventy], { cwd: ROOT, env: { ...process.env, ELEVENTY_PREVIEW: '1' }, stdio: ['ignore', 'ignore', 'inherit'] });
    if (build.status !== 0) {
        console.error('Eleventy build failed');
        process.exit(2);
    }
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const SKIPPED = new Set(['script', 'style', 'pre', 'code', 'svg', 'template', 'noscript']);
const TEXT_ATTRIBUTES = ['alt', 'title', 'aria-label', 'placeholder'];
const attribute = (attrs, name) => attrs.match(new RegExp(String.raw`(?:^|\s)${name}="([^"]*)"`))?.[1];
const decode = text => text.replaceAll(/&nbsp;|&#160;/g, ' ').replaceAll(/&#39;|&#x27;|&apos;/g, "'").replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll(/\s+/g, ' ').trim();

// The visible texts of a page (text and the text attributes), each with the element it sits in; code, scripts and anything marked translate="no" or in another language (lang="xx") are left out.
function textsOf(html, pageLang) {
    const state = { html, pageLang, texts: [], stack: [] };
    let i = 0;
    while (i < html.length) {
        const open = html.indexOf('<', i);
        addText(state, decode(html.slice(i, open < 0 ? html.length : open)), state.stack.at(-1)?.tag ?? 'html');
        i = open < 0 ? html.length : readMarkup(state, open);
    }
    return state.texts;
}

const isSkipped = state => state.stack.some(e => e.skip);

function addText(state, text, tag) {
    if (text && !isSkipped(state)) state.texts.push({ text, tag });
}

// Reads the comment or tag that starts at `open`, and returns where the text after it starts.
function readMarkup(state, open) {
    const { html } = state;
    if (html.startsWith('<!--', open)) {
        const end = html.indexOf('-->', open);
        return end < 0 ? html.length : end + 3;
    }
    const close = html.indexOf('>', open);
    if (close < 0) return html.length;
    const raw = html.slice(open + 1, close);
    const name = raw.match(/^\/?([a-zA-Z][\w-]*)/)?.[1]?.toLowerCase();
    if (!name || raw.startsWith('!')) return close + 1;
    if (!raw.startsWith('/')) return openTag(state, name, raw, close + 1);
    const at = state.stack.findLastIndex(e => e.tag === name);
    if (at >= 0) state.stack.length = at;
    return close + 1;
}

// An opening tag: its text attributes, then its content skipped (script, style, code...) or entered.
function openTag(state, name, raw, after) {
    const own = attribute(raw, 'lang');
    const skip = SKIPPED.has(name) || /(?:^|\s)class="[^"]*\blang-code\b/.test(raw) || attribute(raw, 'translate') === 'no' || Boolean(own && own !== state.pageLang && name !== 'html');
    if (!skip) {
        for (const attr of TEXT_ATTRIBUTES) {
            const value = attribute(raw, attr);
            if (value !== undefined) addText(state, decode(value), `${name}[${attr}]`);
        }
    }
    if (SKIPPED.has(name) && name !== 'svg') {
        const end = state.html.toLowerCase().indexOf(`</${name}`, after);
        return end < 0 ? state.html.length : end;
    }
    if (!VOID.has(name) && !raw.endsWith('/')) state.stack.push({ tag: name, skip });
    return after;
}

// The path the language switcher must open for a page in `lang`, as the localisedHref filter builds it.
const switchTarget = (base, lang) => {
    const slug = path.basename(base);
    return slug === 'index' ? `/${lang}` : `/${lang}/${slug}`;
};

let checkedPages = 0;
for (const [base, found] of translated) {
    for (const lang of found) {
        const file = `${base}_${lang}.html`;
        const builtFile = path.join(OUT, file);
        if (!fs.existsSync(builtFile)) {
            warnings.push(`${file}: not in .eleventy (run without --no-build)`);
            continue;
        }
        checkedPages++;
        const html = fs.readFileSync(builtFile, 'utf8');
        const tags = name => [...html.matchAll(new RegExp(String.raw`<${name}\s[^>]*>`, 'g'))].map(([tag]) => tag);
        const [htmlTag] = tags('html');
        // Articles are fragments loaded into the blog: they have no <html> of their own.
        if (htmlTag && attribute(htmlTag, 'lang') !== lang) errors.push(`${file}: <html lang="${attribute(htmlTag, 'lang') ?? ''}"> instead of "${lang}"`);
        for (const tag of tags('a').filter(t => /\blang-text\b/.test(attribute(t, 'class') ?? ''))) {
            const target = attribute(tag, 'hreflang');
            const href = attribute(tag, 'href');
            if (href !== switchTarget(base, target)) errors.push(`${file}: the ${target.toUpperCase()} link of the language switcher opens "${href}" instead of "${switchTarget(base, target)}"`);
        }
        for (const { text, tag } of textsOf(html, lang)) {
            if (/\bundefined\b|\[object Object\]|\bNaN\b/.test(text)) errors.push(`${file} <${tag}>: "${text.slice(0, 80)}" (a missing value)`);
            const written = languageOf(text);
            if (written && written !== lang) warnings.push(`${file} <${tag}>: ${written} text in the ${lang} page: "${text.slice(0, 80)}" (translate it, or mark it lang="${written}" if it is meant to stay in ${written})`);
            for (const other of langs.filter(l => l !== lang)) {
                const month = MONTHS[other]?.find(m => new RegExp(String.raw`(?:\d\s+${m}(?!\p{L})|(?<!\p{L})${m}\s+\d)`, 'iu').test(text) && !(MONTHS[lang] ?? []).includes(m));
                if (month) warnings.push(`${file} <${tag}>: a date in ${other} ("${month}") in the ${lang} page: "${text.slice(0, 80)}"`);
            }
        }
        for (const [, attr] of html.matchAll(/\s(aria-label|title)=""/g)) warnings.push(`${file}: an empty ${attr}`);
    }
}
// Search engines find each page's translations through the hreflang alternates of the sitemap (built by .eleventy.js from routes.locales).
const sitemap = fs.existsSync(path.join(OUT, 'sitemap.xml')) ? fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8') : '';
const declared = new Set([...sitemap.matchAll(/hreflang="([^"]+)"/g)].map(([, code]) => code));
for (const lang of langs.filter(l => sitemap && !declared.has(l))) errors.push(`sitemap.xml: no hreflang="${lang}" alternate (search engines won't find the ${lang} pages)`);
if (!sitemap) warnings.push('.eleventy/sitemap.xml not found: hreflang alternates not checked');

// ---- Report ----
for (const note of notes) console.log(`note: ${note}`);
for (const warning of new Set(warnings)) console.log(`warning: ${warning}`);
for (const error of new Set(errors)) console.error(`error: ${error}`);
const summary = `${langs.join(' / ')}: ${translated.size} translated pages, ${checkedPages} built pages read`;
if (errors.length) {
    console.error(`\n${new Set(errors).size} error(s). ${summary}`);
    process.exit(1);
}
console.log(`\nTranslations are complete. ${summary}`);
