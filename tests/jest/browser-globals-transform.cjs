// Jest transform of a classic browser script (js/app.js, js/common.js, js/standalone.js): its top-level declarations are globals in the browser but stay inside the module under Jest, so this appends a module.exports of them for the tests to read, the script itself unchanged.
module.exports = {
    process(source, filename) {
        const names = [...source.matchAll(/^(?:async\s+)?(?:function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)].map(match => match[1]);
        // One mapping per line of the script, column 0 to column 0, so coverage keeps its lines; the appended line has none and is left out of it
        const lines = source.split('\n').length;
        const map = { version: 3, sources: [filename], sourcesContent: [source], names: [], mappings: ['AAAA', ...new Array(lines - 1).fill('AACA')].join(';') };
        return { code: `${source}\n;module.exports = { ${names.join(', ')} };\n`, map };
    }
};
