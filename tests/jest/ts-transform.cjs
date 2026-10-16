// Jest transform of the Netlify functions (.mts) and their tests (.ts) to CommonJS, the module system Jest runs: TypeScript always emits ES modules for a .mts file, so it is compiled under a .ts name.
const ts = require('typescript');

module.exports = {
    process(source, filename) {
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
};
