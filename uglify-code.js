const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { Worker: ThreadWorker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const { minify } = require('terser');

const ENCODING = 'utf-8';

async function minifyFile(filePath) {
    const code = fs.readFileSync(filePath, ENCODING);
    const result = await minify(code, { compress: true, mangle: true });
    if (result.error) {
        throw result.error;
    }
    fs.writeFileSync(filePath, result.code, ENCODING);
}

if (!isMainThread) {
    minifyFile(workerData.filePath)
        .then(() => parentPort.postMessage({ ok: true }))
        .catch(error => parentPort.postMessage({ ok: false, error: error.message }));
} else {
    async function minifyInParallel(filePaths, concurrency) {
        const queue = [...filePaths];
        const activeWorkers = new Set();
        let firstError = null;

        function terminateAll() {
            for (const worker of activeWorkers) {
                worker.terminate();
            }
        }

        function runNext() {
            const filePath = queue.shift();
            if (!filePath || firstError) {
                return Promise.resolve();
            }
            return new Promise(resolve => {
                const worker = new ThreadWorker(__filename, { workerData: { filePath } });
                activeWorkers.add(worker);
                worker.on('message', message => {
                    if (!message.ok && !firstError) {
                        firstError = new Error(message.error);
                        terminateAll();
                    }
                });
                worker.on('error', error => {
                    if (!firstError) {
                        firstError = error;
                        terminateAll();
                    }
                });
                // 'exit' fires whether the worker finished naturally or was
                // killed by terminateAll(), so it's the only safe place to
                // resolve — otherwise a killed worker's slot never settles
                // and the whole pool hangs.
                worker.on('exit', () => {
                    activeWorkers.delete(worker);
                    resolve();
                });
            }).then(runNext);
        }

        await Promise.all(Array.from({ length: concurrency }, runNext));

        if (firstError) {
            throw firstError;
        }
    }

    async function main() {
        const projectRoot = path.resolve(__dirname);
        const jsDir = path.resolve(projectRoot, process.argv[2] || 'js');
        if (jsDir !== projectRoot && !jsDir.startsWith(projectRoot + path.sep)) {
            throw new Error(`Refusing to run outside the project root: ${jsDir}`);
        }
        const files = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
        const filePaths = files.map(file => path.join(jsDir, file));
        const concurrency = Math.min(os.cpus().length, filePaths.length);
        await minifyInParallel(filePaths, concurrency);
    }

    main().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
