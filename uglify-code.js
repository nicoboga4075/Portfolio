const fs = require('node:fs');
const path = require('node:path');
const { minify } = require('terser');

const ENCODING = 'utf-8';

async function main() {
    const projectRoot = path.resolve(__dirname);
    const jsDir = path.resolve(projectRoot, process.argv[2] || 'js');
    if (jsDir !== projectRoot && !jsDir.startsWith(projectRoot + path.sep)) {
        throw new Error(`Refusing to run outside the project root: ${jsDir}`);
    }
    const files = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));

    for (const file of files) {
        const filePath = path.join(jsDir, file);
        const code = fs.readFileSync(filePath, ENCODING);
        const result = await minify(code, { compress: true, mangle: true });
        if (result.error) {
            throw result.error;
        }
        fs.writeFileSync(filePath, result.code, ENCODING);
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
