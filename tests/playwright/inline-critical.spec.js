// inline-critical.mjs: the critical CSS inlined with beasties in the built pages of a temporary site, and the skip outside the Netlify production build.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..', '..');
const script = path.join(root, 'inline-critical.mjs');
const load = () => import(pathToFileURL(script).href);

const css = 'body{margin:0}.used{color:red}.unused{color:blue}html.dark-mode{--bg:#000}html.dark-mode body{color:#fff}html.dark-mode .used{color:pink}html.dark-modes{color:gray}.ftco-animated{visibility:visible}.fadeInUp{animation-name:fadeInUp}@keyframes fadeInUp{to{opacity:1}}@font-face{font-family:Icons;src:url(/fonts/icons.woff2)}@font-face{font-family:Unused;src:url(/fonts/unused.woff2)}[class^="icon-"],[class*=" icon-"]{font-family:Icons}.icon-star:before{content:"*"}.unused-font{font-family:Unused}';
// The local fallbacks of the web font, named only through a variable, next to a web font of its own
const common = `@font-face {
    font-family: 'Fallback Windows';
    src: local('Arial');
    size-adjust: 110.7%;
}

@font-face {
    font-family: 'Web';
    src: url('/fonts/web.woff2');
}

:root {
    --font-family: 'Poppins', 'Fallback Windows', sans-serif;
}
`;
const page = '<!DOCTYPE html><html><head><base href="../"><link rel="stylesheet" href="css/site.css"></head><body><p class="used">Hi <i class="icon-star"></i></p></body></html>';

// A built site: pages at the root, in articles/ and projects/, and HTML that is not a page
function site() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inline-critical-'));
    for (const folder of ['css', 'articles', 'projects', '_includes']) {
        fs.mkdirSync(path.join(dir, folder));
    }
    fs.writeFileSync(path.join(dir, 'css', 'site.css'), css);
    fs.writeFileSync(path.join(dir, 'css', 'common.css'), common);
    for (const file of ['index_en.html', 'index_fr.html', '404.html', 'articles/mcs_en.html', 'projects/crm_fr.html', '_includes/nav.html', 'notes.html', 'index_de.html']) {
        fs.writeFileSync(path.join(dir, file), page);
    }
    return dir;
}

test.describe('inline-critical', () => {
    test('lists the pages Eleventy writes in every language, never a partial or another HTML file', async () => {
        const { builtPages } = await load();
        const dir = site();
        try {
            expect(builtPages(dir).map(file => path.relative(dir, file).replaceAll('\\', '/')).sort()).toEqual(['404.html', 'articles/mcs_en.html', 'index_en.html', 'index_fr.html', 'projects/crm_fr.html']);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    test('inlines the rules a page uses, those of the classes the scripts add (dark theme, scroll reveal), the icon font and the local fallback fonts, and loads the stylesheet without blocking', async () => {
        const { inlineCritical } = await load();
        const dir = site();
        try {
            expect(await inlineCritical(dir)).toBe(5);
            const html = fs.readFileSync(path.join(dir, 'articles', 'mcs_en.html'), 'utf8');
            const style = html.match(/<style>([^<]*)<\/style>/)[1];
            expect(style).toContain('.used{color:red}');
            expect(style).toContain('body{margin:0}');
            expect(style).toContain('html.dark-mode{--bg:#000}');
            expect(style).toContain('html.dark-mode body{color:#fff}');
            expect(style).toContain('html.dark-mode .used{color:pink}');
            expect(style).toContain('.ftco-animated{visibility:visible}');
            expect(style).toContain('.fadeInUp{animation-name:fadeInUp}');
            expect(style).toContain('@keyframes fadeInUp');
            // The base rule of the icon font, a [class^=] selector that beasties alone drops, then the @font-face of the font it uses, never one no inlined rule uses, and no font preload
            expect(style).toContain('[class^="icon-"],[class*=" icon-"]{font-family:Icons}');
            expect(style).toContain('.icon-star:before{content:"*"}');
            expect(style).toContain('@font-face{font-family:Icons;src:url(/fonts/icons.woff2)}');
            expect(style).not.toContain('Unused');
            expect(html).not.toContain('as="font"');
            // The local fallbacks of the web font, minified at the end of the head, never a web font of common.css
            expect(html).toContain("<style>@font-face{font-family:'Fallback Windows';src:local('Arial');size-adjust:110.7%}</style></head>");
            expect(html).not.toContain('web.woff2');
            expect(style).not.toContain('.unused');
            expect(style).not.toContain('gray');
            // Deferred by media="print", switched by data-media and js/common.js: no inline onload, which the CSP refuses
            expect(html).toMatch(/<link rel="stylesheet" href="css\/site.css" media="print" data-media="all">/);
            expect(html).not.toContain('onload=');
            expect(html).toContain('<noscript><link rel="stylesheet" href="css/site.css"></noscript>');
            // The stylesheet itself is left whole, and the HTML that is not a page untouched
            expect(fs.readFileSync(path.join(dir, 'css', 'site.css'), 'utf8')).toBe(css);
            expect(fs.readFileSync(path.join(dir, 'css', 'common.css'), 'utf8')).toBe(common);
            expect(fs.readFileSync(path.join(dir, '_includes', 'nav.html'), 'utf8')).toBe(page);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    test('skips outside the Netlify production build, and runs on the folder of reports/ it is given', () => {
        const dir = site();
        const moved = path.join(root, 'reports', `inline-critical-${process.pid}`);
        try {
            const env = { ...process.env };
            delete env.CONTEXT;
            const skipped = execFileSync(process.execPath, [script], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
            expect(skipped).toBe('');
            fs.cpSync(dir, moved, { recursive: true });
            execFileSync(process.execPath, [script, path.relative(root, moved)], { cwd: root, env, stdio: 'ignore' });
            expect(fs.readFileSync(path.join(moved, 'index_fr.html'), 'utf8')).toContain('<style>');
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
            fs.rmSync(moved, { recursive: true, force: true });
        }
    });

    test('adds no fallback font to a site without css/common.css', async () => {
        const { localFontFaces, inlineCritical } = await load();
        const dir = site();
        try {
            fs.rmSync(path.join(dir, 'css', 'common.css'));
            expect(localFontFaces(dir)).toBe('');
            await inlineCritical(dir);
            expect(fs.readFileSync(path.join(dir, 'index_en.html'), 'utf8')).not.toContain('Fallback');
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    test('refuses a folder outside reports/ given on the command line', async () => {
        const { commandLineFolder } = await load();
        expect(commandLineFolder('reports/preview')).toBe(path.join(root, 'reports', 'preview'));
        for (const arg of ['.', 'reports', '../outside', 'reports/../css', os.tmpdir()]) {
            expect(() => commandLineFolder(arg)).toThrow('is not a folder of reports/');
        }
        const env = { ...process.env };
        delete env.CONTEXT;
        expect(() => execFileSync(process.execPath, [script, '..'], { cwd: root, env, stdio: 'ignore' })).toThrow();
    });
});
