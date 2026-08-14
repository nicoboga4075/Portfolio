const fs = require('node:fs');
const path = require('node:path');
const { minify } = require('terser');

const ENCODING = 'utf-8';

async function main() {
    const jsDir = path.join(__dirname, 'js');
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
