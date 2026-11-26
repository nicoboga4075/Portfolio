#!/usr/bin/env bash
# npm run tag-version: tags HEAD v<version of package.json>, refusing while a change other than package.json or CHANGELOG.md is not committed
set -euo pipefail

version=$(node -p "require('./package.json').version")
changes=$(git status --porcelain | grep -vE '^.M (package.json|CHANGELOG.md)$' || true)
if [[ -n $changes ]]; then
    echo 'Uncommitted or unstaged changes detected. Please commit or stash your changes before tagging.'
    exit 1
fi
git tag "v$version"
echo "v$version"
