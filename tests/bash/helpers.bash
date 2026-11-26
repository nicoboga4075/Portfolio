# Shared setup of the Bats tests of scripts/: a temporary git repository with a local bare repository as origin, so nothing reaches GitHub or GitLab, and npm replaced by a stand-in for npm version and npm run changelog
REPO_ROOT="$(cd "$BATS_TEST_DIRNAME/../.." && pwd)"
load "$REPO_ROOT/node_modules/bats-support/load.bash"
load "$REPO_ROOT/node_modules/bats-assert/load.bash"

# A repository at version 1.2.3 with one commit pushed to its bare origin, as the current directory
setup_repo() {
    export GIT_AUTHOR_NAME=Test GIT_AUTHOR_EMAIL=test@example.com GIT_COMMITTER_NAME=Test GIT_COMMITTER_EMAIL=test@example.com
    REMOTE="$BATS_TEST_TMPDIR/remote.git"
    REPO="$BATS_TEST_TMPDIR/repo"
    git init --quiet --bare "$REMOTE"
    git init --quiet --initial-branch=main "$REPO"
    cd "$REPO" || return 1
    git config commit.gpgsign false
    git config tag.gpgsign false
    git config core.hooksPath /dev/null
    printf '{\n  "name": "test",\n  "version": "1.2.3"\n}\n' > package.json
    cp package.json package-lock.json
    printf '### Changelog\n' > CHANGELOG.md
    printf '{{title}}\n' > changelog.hbs
    mkdir -p .github/workflows
    printf 'name: CI\n' > .github/workflows/node.js.yml
    cp "$REPO_ROOT/update-version.js" update-version.js
    git add .
    git commit --quiet -m 'Initial commit'
    git remote add origin "$REMOTE"
    git push --quiet origin main 2> /dev/null
    git branch --quiet --set-upstream-to=origin/main
    stub_npm
}

# npm on PATH: npm version <level> --no-git-tag-version bumps package.json and package-lock.json, npm run changelog writes the heading of the version in CHANGELOG.md as auto-changelog does
stub_npm() {
    mkdir -p "$BATS_TEST_TMPDIR/bin"
    cat > "$BATS_TEST_TMPDIR/bin/npm" <<'STUB'
#!/usr/bin/env bash
case "$1" in
    version)
        node -e '
            const fs = require("fs");
            const level = process.argv[1];
            const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
            const [major, minor, patch] = pkg.version.split(".").map(Number);
            pkg.version = { major: `${major + 1}.0.0`, minor: `${major}.${minor + 1}.0`, patch: `${major}.${minor}.${patch + 1}` }[level] ?? level;
            for (const file of ["package.json", "package-lock.json"]) fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
            console.log(`v${pkg.version}`);
        ' "$2" ;;
    run)
        version=$(node -p "require('./package.json').version")
        printf '### Changelog\n\n#### v%s\n\n> 1 January 2000\n' "$version" > CHANGELOG.md ;;
esac
STUB
    chmod +x "$BATS_TEST_TMPDIR/bin/npm"
    PATH="$BATS_TEST_TMPDIR/bin:$PATH"
}

# The tags of the bare origin, one per line
remote_tags() {
    git --git-dir="$REMOTE" tag
}
