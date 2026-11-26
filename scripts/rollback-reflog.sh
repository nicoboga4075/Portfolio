#!/usr/bin/env bash
# npm run rollback-reflog: shows the reflog, resets the branch to the entry chosen, deletes here and on the remote the tags of the commits it leaves behind, then force pushes
set -euo pipefail

git reflog --oneline
echo ''
read -r -p 'Reflog index to restore (ex: 1, 2, 3...) : ' idx
if [[ ! $idx =~ ^[0-9]+$ ]]; then
    echo "Invalid index: $idx"
    exit 1
fi
ref="HEAD@{$idx}"
# The tags on the commits between the chosen entry and HEAD, read before the reset moves HEAD
tags=$(git tag --merged HEAD --no-merged "$ref")
echo "Rollback to $ref"
git reset --hard "$ref"
for tag in $tags; do
    git tag -d "$tag"
    git push origin ":$tag"
done
git push --force
