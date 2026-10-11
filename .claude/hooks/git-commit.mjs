// Shared by the PreToolUse hooks of Bash / PowerShell that act before a commit: the command they receive on stdin, and whether it runs `git commit`.

export async function hookCommand() {
    let input = '';
    for await (const chunk of process.stdin) input += chunk;
    return JSON.parse(input || '{}').tool_input?.command ?? '';
}

// Only `git commit` (not git commit-tree, nor the word "commit" inside a message of another command)
export const isGitCommit = command => /(^|[\s;&|(])git(\s+-\S+(\s+\S+)?)*\s+commit(\s|$)/.test(command);
