#!/usr/bin/env bash
# npm run push-all [-- force]: pushes the branch, then the tags, to origin (GitHub and GitLab); force only when asked, which the rulesets of main refuse anyway
set -euo pipefail

if [[ ${1:-} == force ]]; then
    git push --force
    git push --tags --force
else
    git push
    git push --tags
fi
