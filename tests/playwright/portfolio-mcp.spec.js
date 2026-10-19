// The stdio MCP server of the portfolio (portfolio-mcp.mjs), talked to over JSON-RPC: the tools and their schemas, the article and project lists in each language, find_text, translation_gaps, unknown tools and the url check of preview.
const { test, expect } = require('@playwright/test');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const script = path.join(root, '.claude', 'marketplace', 'plugins', 'portfolio-dev', 'mcp', 'portfolio-mcp.mjs');
const data = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const { locales, defaultLang } = data('package.json').config;
const langs = Object.keys(locales);

let child;
let nextId = 1;
const pending = new Map();

// Sends one request and resolves with the response of the same id.
function request(method, params) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`No answer to ${method}`)), 60000);
        pending.set(id, message => {
            clearTimeout(timer);
            resolve(message);
        });
        child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    });
}

// Calls a tool and returns its result (content and isError).
async function call(name, args) {
    const { result } = await request('tools/call', { name, arguments: args });
    return result;
}

const textOf = result => result.content[0].text;

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
    child = spawn(process.execPath, [script], { cwd: root, env: { ...process.env, CLAUDE_PROJECT_DIR: root }, stdio: ['pipe', 'pipe', 'inherit'] });
    let buffer = '';
    child.stdout.on('data', chunk => {
        buffer += chunk;
        let at;
        while ((at = buffer.indexOf('\n')) >= 0) {
            const message = JSON.parse(buffer.slice(0, at));
            buffer = buffer.slice(at + 1);
            pending.get(message.id)?.(message);
            pending.delete(message.id);
        }
    });
});

test.afterAll(() => {
    child.kill();
});

test('initialize answers with the server info and the tools capability', async () => {
    const { result } = await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
    expect(result.protocolVersion).toBe('2025-06-18');
    expect(result.serverInfo.name).toBe('portfolio');
    expect(result.capabilities).toHaveProperty('tools');
    expect((await request('ping')).result).toEqual({});
});

test('an unknown method is a JSON-RPC error', async () => {
    const { error } = await request('nothing/here');
    expect(error.code).toBe(-32601);
});

test('tools/list gives the six tools with their schema', async () => {
    const { result } = await request('tools/list');
    const byName = Object.fromEntries(result.tools.map(tool => [tool.name, tool]));
    expect(Object.keys(byName).sort()).toEqual(['find_text', 'list_articles', 'list_projects', 'preview', 'site_health', 'translation_gaps']);
    for (const tool of result.tools) {
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.inputSchema.type).toBe('object');
        expect(tool).not.toHaveProperty('run');
    }
    expect(byName.find_text.inputSchema.required).toEqual(['query']);
    expect(Object.keys(byName.preview.inputSchema.properties)).toEqual(['url', 'theme', 'width', 'height', 'full_page']);
    expect(byName.site_health.inputSchema.properties.hook.enum).toEqual(['PreToolUse', 'SessionStart']);
});

for (const lang of langs) {
    test(`list_articles in ${lang} follows _data/articles.json`, async () => {
        const articles = data('_data/articles.json');
        const list = JSON.parse(textOf(await call('list_articles', { lang })));
        expect(list.map(a => a.slug)).toEqual(articles.map(a => a.slug));
        list.forEach((article, i) => {
            expect(article.title).toBe(articles[i].title[lang]);
            expect(article.date).toBe(articles[i].date);
            expect(article.url).toBe(`/${lang}/blog#${article.slug}`);
            expect(article.tags.length).toBe(articles[i].tags.length);
        });
    });

    test(`list_projects in ${lang} follows _data/projects.json`, async () => {
        const cards = data('_data/projects.json').cards;
        const list = JSON.parse(textOf(await call('list_projects', { lang })));
        expect(list.map(p => p.id)).toEqual(cards.map(c => c.id));
        list.forEach(project => {
            expect(project.title.length).toBeGreaterThan(0);
            expect(project.title).not.toMatch(/</);
        });
    });
}

test('list_articles falls back to the default language for an unknown one', async () => {
    const fallback = JSON.parse(textOf(await call('list_articles', { lang: 'xx' })));
    const wanted = JSON.parse(textOf(await call('list_articles', { lang: defaultLang })));
    expect(fallback).toEqual(wanted);
});

test('find_text finds a known text in the data', async () => {
    const title = data('_data/articles.json')[0].title[defaultLang];
    const result = JSON.parse(textOf(await call('find_text', { query: title.toUpperCase() })));
    expect(result.count).toBeGreaterThan(0);
    expect(result.results.some(r => r.where.startsWith('_data/articles.json') && r.text === title)).toBe(true);
});

test('find_text restricted to a language leaves the other one out', async () => {
    const other = langs.find(l => l !== defaultLang);
    const title = data('_data/articles.json')[0].title[other];
    const result = JSON.parse(textOf(await call('find_text', { query: title, lang: defaultLang })));
    expect(result.results.some(r => r.where.startsWith('_data/articles.json'))).toBe(false);
});

test('find_text rejects a query under 2 characters', async () => {
    for (const query of ['a', ' ', '']) {
        const result = await call('find_text', { query });
        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain('at least 2 characters');
    }
    expect((await call('find_text', {})).isError).toBe(true);
});

test('translation_gaps reads the last build and reports the state of the data', async () => {
    const report = JSON.parse(textOf(await call('translation_gaps', {})));
    expect(typeof report.complete).toBe('boolean');
    expect(Array.isArray(report.errors)).toBe(true);
    expect(Array.isArray(report.warnings)).toBe(true);
    expect(report.summary).not.toBe('');
    expect(report.complete).toBe(report.errors.length === 0);
});

test('an unknown tool is an error result', async () => {
    const result = await call('no_such_tool', {});
    expect(result.isError).toBe(true);
    expect(textOf(result)).toBe('Unknown tool no_such_tool');
});

test('preview rejects a url that is not a site path', async () => {
    const hasBuild = fs.existsSync(path.join(root, '.eleventy', 'index_en.html'));
    for (const url of ['http://example.com', '/en?x=1', '/en/<script>', 'en']) {
        const result = await call('preview', { url });
        expect(result.isError).toBe(true);
        // Without a build the missing build is reported first, with one the url is
        expect(textOf(result)).toContain(hasBuild ? 'url: a site path' : 'No build in .eleventy');
    }
});
