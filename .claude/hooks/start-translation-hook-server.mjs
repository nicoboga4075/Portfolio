#!/usr/bin/env node
// SessionStart hook: starts translation-hook-server.mjs in the background unless this project's server already answers on its port, so the PostToolUse http hook has something to call.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const PORT = Number(process.env.TRANSLATION_HOOK_PORT) || 4799;

// The project root the server on the port belongs to, or null when nothing answers.
async function runningRoot() {
    try {
        const res = await fetch(`http://127.0.0.1:${PORT}/health`, { signal: AbortSignal.timeout(1000) });
        return res.ok ? (await res.json()).root : null;
    } catch {
        return null;
    }
}

const root = await runningRoot();
if (root && path.resolve(root) !== ROOT) {
    console.error(`Port ${PORT} is used by the translation hook server of ${root}: _data edits of this project won't be checked (set TRANSLATION_HOOK_PORT to another port).`);
} else if (!root) {
    spawn(process.execPath, [path.join(HERE, 'translation-hook-server.mjs')], { cwd: ROOT, detached: true, stdio: 'ignore', windowsHide: true }).unref();
    // Wait until it answers, so the first edit of the session is already checked.
    for (let i = 0; i < 30 && !(await runningRoot()); i++) await new Promise(resolve => setTimeout(resolve, 100));
}
