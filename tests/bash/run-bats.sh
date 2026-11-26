#!/usr/bin/env bash
# npm run test:sh: runs the Bats tests of tests/bash from the repository root and writes their JUnit report to reports/bats/; PWD is reset from the physical directory first, since one inherited from Windows (C:/...) makes Bats refuse its own load paths
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)
cd "$root"
mkdir -p reports/bats
exec node_modules/bats/bin/bats --report-formatter junit --output reports/bats tests/bash "$@"
