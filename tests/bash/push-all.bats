#!/usr/bin/env bats
# Bats tests of scripts/push-all.sh (npm run push-all): it pushes the branch and the tags, and forces only when asked
load helpers

setup() {
    setup_repo
}

@test "push-all pushes the branch and the tags" {
    printf 'x\n' > a.txt
    git add a.txt
    git commit --quiet -m 'Add a'
    git tag v9.9.9
    run bash "$REPO_ROOT/scripts/push-all.sh"
    assert_success
    assert_equal "$(git --git-dir="$REMOTE" rev-parse main)" "$(git rev-parse HEAD)"
    assert_equal "$(remote_tags)" 'v9.9.9'
}

@test "push-all refuses a rewritten history unless forced" {
    git commit --quiet --amend -m 'Rewritten'
    run bash "$REPO_ROOT/scripts/push-all.sh"
    assert_failure
    assert_not_equal "$(git --git-dir="$REMOTE" rev-parse main)" "$(git rev-parse HEAD)"
    run bash "$REPO_ROOT/scripts/push-all.sh" force
    assert_success
    assert_equal "$(git --git-dir="$REMOTE" rev-parse main)" "$(git rev-parse HEAD)"
}
