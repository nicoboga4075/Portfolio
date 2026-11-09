// Loaded with --require before .claude/hooks/token-expiry.mjs by its test: replaces the GitHub and GitLab APIs (fetch), the Netlify CLI and the Git credential helper (execFile) by the answers of the scenario in TOKEN_EXPIRY_SCENARIO, so the hook runs offline and never touches a real token.
const childProcess = require('node:child_process');
const { EventEmitter } = require('node:events');
const { syncBuiltinESMExports } = require('node:module');
const util = require('node:util');

const scenario = JSON.parse(process.env.TOKEN_EXPIRY_SCENARIO);

// GitHub answers by token, with the expiry header or none; GitLab answers by token, with its expires_at
globalThis.fetch = async (url, { headers }) => {
    if (url.startsWith('https://api.github.com/')) {
        const answer = scenario.github?.[headers.Authorization.replace('Bearer ', '')] ?? { status: 401 };
        const expiry = answer.expiry ?? null;
        return { ok: answer.status === 200, headers: { get: name => (name === 'github-authentication-token-expiration' ? expiry : null) } };
    }
    const answer = scenario.gitlab?.[headers['PRIVATE-TOKEN']] ?? { status: 401 };
    return { ok: answer.status === 200, json: async () => ({ expires_at: answer.expires_at ?? null }) };
};

// git credential fill: a child that prints the password of the scenario once its input is written, or fails with its exit code
function gitCredential() {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stdin = {
        end: input => setImmediate(() => {
            if (!input.includes('host=gitlab.com')) {
                throw new Error(`unexpected credential request: ${input}`);
            }
            if (scenario.git.password) {
                child.stdout.emit('data', `protocol=https\nhost=gitlab.com\nusername=nicoboga4075\npassword=${scenario.git.password}\n`);
            }
            child.emit('close', scenario.git.code);
        })
    };
    return child;
}

function execFile(command, args) {
    if (command === 'git' && args.join(' ') === 'credential fill') {
        return gitCredential();
    }
    throw new Error(`unexpected execFile: ${command} ${args.join(' ')}`);
}

// The promisified form the hook uses for the Netlify CLI: its value on stdout, or the CLI failing
execFile[util.promisify.custom] = async (command, args) => {
    if (command !== 'netlify' || args.join(' ') !== 'env:get GITHUB_API_TOKEN') {
        throw new Error(`unexpected run: ${command} ${args.join(' ')}`);
    }
    if (scenario.netlify === null) {
        throw new Error('netlify: not logged in');
    }
    return { stdout: `${scenario.netlify}\n`, stderr: '' };
};

childProcess.execFile = execFile;
syncBuiltinESMExports();
