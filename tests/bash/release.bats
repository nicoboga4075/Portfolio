#!/usr/bin/env bats
# Bats tests of scripts/release.sh (npm run release): its help, the levels it refuses, each level it bumps, and a tag left by an earlier attempt
load helpers

setup() {
    setup_repo
}

@test "release -h prints the usage and changes nothing" {
    run bash "$REPO_ROOT/scripts/release.sh" -h
    assert_success
    assert_output --partial 'Usage: npm run release -- [patch|minor|major|x.y.z]'
    assert_equal "$(git tag)" ''
}

@test "release refuses an invalid level" {
    run bash "$REPO_ROOT/scripts/release.sh" huge
    assert_failure 1
    assert_output --partial 'Invalid level: huge'
    assert_output --partial 'Usage:'
    assert_equal "$(node -p "require('./package.json').version")" '1.2.3'
}

@test "release bumps the patch version by default, commits, tags and pushes" {
    run bash "$REPO_ROOT/scripts/release.sh"
    assert_success
    assert_output --partial 'Released v1.2.4'
    assert_equal "$(node -p "require('./package.json').version")" '1.2.4'
    assert_equal "$(git log -1 --format=%s)" '🔖 Release v1.2.4'
    assert_equal "$(git tag --points-at HEAD)" 'v1.2.4'
    assert_equal "$(remote_tags)" 'v1.2.4'
    assert_equal "$(git --git-dir="$REMOTE" rev-parse main)" "$(git rev-parse HEAD)"
    grep -q '^> [0-9]\{2\} [A-Z][a-z]* [0-9]\{4\}$' CHANGELOG.md
    assert_equal "$(git status --porcelain)" ''
}

@test "release bumps the minor, the major or to an exact version" {
    run bash "$REPO_ROOT/scripts/release.sh" minor
    assert_success
    assert_equal "$(git tag --points-at HEAD)" 'v1.3.0'
    run bash "$REPO_ROOT/scripts/release.sh" major
    assert_success
    assert_equal "$(git tag --points-at HEAD)" 'v2.0.0'
    run bash "$REPO_ROOT/scripts/release.sh" 3.1.4
    assert_success
    assert_equal "$(git tag --points-at HEAD)" 'v3.1.4'
    assert_equal "$(remote_tags | sort | tr '\n' ' ')" 'v1.3.0 v2.0.0 v3.1.4 '
}

@test "release deletes a tag left by an earlier attempt and makes it again on the release commit" {
    git tag v1.2.4
    git push --quiet origin v1.2.4 2> /dev/null
    run bash "$REPO_ROOT/scripts/release.sh" patch
    assert_success
    assert_output --partial 'Tag v1.2.4 already exists, deleting and recreating...'
    assert_equal "$(git rev-parse v1.2.4)" "$(git rev-parse HEAD)"
    assert_equal "$(git --git-dir="$REMOTE" rev-parse v1.2.4)" "$(git rev-parse HEAD)"
}
