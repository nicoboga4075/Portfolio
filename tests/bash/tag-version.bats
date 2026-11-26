#!/usr/bin/env bats
# Bats tests of scripts/tag-version.sh (npm run tag-version): it refuses while a change is not committed, except to package.json and CHANGELOG.md, and tags v<version> otherwise
load helpers

setup() {
    setup_repo
}

@test "tag-version tags HEAD with the version of package.json" {
    run bash "$REPO_ROOT/scripts/tag-version.sh"
    assert_success
    assert_output 'v1.2.3'
    assert_equal "$(git tag --points-at HEAD)" 'v1.2.3'
}

@test "tag-version accepts a modified package.json or CHANGELOG.md" {
    printf '\n' >> CHANGELOG.md
    printf '\n' >> package.json
    run bash "$REPO_ROOT/scripts/tag-version.sh"
    assert_success
    assert_equal "$(git tag)" 'v1.2.3'
}

@test "tag-version refuses another uncommitted change, staged or not, and an untracked file" {
    for change in 'printf x >> changelog.hbs' 'printf x >> changelog.hbs && git add changelog.hbs' 'touch new.txt'; do
        git reset --quiet --hard
        git clean --quiet -fd
        eval "$change"
        run bash "$REPO_ROOT/scripts/tag-version.sh"
        assert_failure 1
        assert_output --partial 'Uncommitted or unstaged changes detected'
        assert_equal "$(git tag)" ''
    done
}
