// The Jest transform of the repository, for the two kinds of files Jest cannot run as they are: the Netlify functions (.mts) and their tests (.ts), compiled to CommonJS; the classic browser scripts of js/ (app.js, common.js, standalone.js), given a module.exports of their top-level declarations.
const ts = require('typescript');

// TypeScript always emits ES modules for a .mts file, so it is compiled under a .ts name, to CommonJS, the module system Jest runs
function compileTypeScript(source, filename) {
    const { outputText, sourceMapText } = ts.transpileModule(source, {
        fileName: filename.replace(/\.mts$/, '.ts'),
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            esModuleInterop: true,
            resolveJsonModule: true,
            sourceMap: true,
            inlineSources: true
        }
    });
    const map = JSON.parse(sourceMapText);
    // The map names the .ts file it was compiled as: point it back to the real source so coverage reports the .mts lines
    map.sources = [filename];
    return { code: outputText.replace(/\/\/# sourceMappingURL=.*$/m, ''), map };
}

// A browser script's top-level declarations are globals in the browser but stay inside the module under Jest: append a module.exports of them for the tests to read, the script itself unchanged
function exportBrowserGlobals(source, filename) {
    const names = [...source.matchAll(/^(?:async\s+)?(?:function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)].map(match => match[1]);
    // One mapping per line of the script, column 0 to column 0, so coverage keeps its lines; the appended line has none and is left out of it
    const lines = source.split('\n').length;
    const map = { version: 3, sources: [filename], sourcesContent: [source], names: [], mappings: ['AAAA', ...new Array(lines - 1).fill('AACA')].join(';') };
    return { code: `${source}\n;module.exports = { ${names.join(', ')} };\n`, map };
}

module.exports = {
    process(source, filename) {
        return /\.m?ts$/.test(filename) ? compileTypeScript(source, filename) : exportBrowserGlobals(source, filename);
    }
};
