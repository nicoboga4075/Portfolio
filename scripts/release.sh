#!/usr/bin/env bash
# npm run release -- [patch|minor|major|x.y.z]: bumps the version of package.json, writes CHANGELOG.md with auto-changelog, commits, tags v<version> and pushes the commit and the tags
set -euo pipefail

usage() {
    echo 'Usage: npm run release -- [patch|minor|major|x.y.z]'
    echo 'Examples:'
    echo '  npm run release             -> patch (default)'
    echo '  npm run release -- minor'
    echo '  npm run release -- major'
    echo '  npm run release -- 2.1.0'
}

level=${1:-patch}
if [[ $level == -h || $level == --help ]]; then
    usage
    exit 0
fi
if [[ ! $level =~ ^(patch|minor|major|[0-9]+\.[0-9]+\.[0-9]+)$ ]]; then
    echo "Invalid level: $level"
    echo ''
    usage
    exit 1
fi

npm version "$level" --no-git-tag-version > /dev/null
version=$(node -p "require('./package.json').version")
# A tag left by an earlier attempt at this version is deleted here and on the remote, then made again on the release commit
if git tag | grep -qx "v$version"; then
    echo "Tag v$version already exists, deleting and recreating..."
    git tag -d "v$version"
    git push origin ":refs/tags/v$version"
fi
# auto-changelog names the release after the tag on HEAD: a temporary tag before the changelog, the real one on the release commit
git tag "v$version"
npm run changelog
node update-version.js "$version"
git tag -d "v$version"
git add package.json package-lock.json CHANGELOG.md changelog.hbs update-version.js .github/workflows/node.js.yml
git commit -m "🔖 Release v$version"
git tag "v$version"
git push
git push --tags
echo "Released v$version"
