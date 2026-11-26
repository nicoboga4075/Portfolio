#!/usr/bin/env bats
# Bats tests of scripts/rollback-reflog.sh (npm run rollback-reflog): it resets to the reflog entry typed, deletes here and on origin the tags of the commits it leaves behind, keeps the others, and force pushes
load helpers

setup() {
    setup_repo
    git tag v1.0.0
    for n in 1 2; do
        printf '%s\n' "$n" > "file$n.txt"
        git add "file$n.txt"
        git commit --quiet -m "Commit $n"
        git tag "v1.0.$n"
    done
    git push --quiet origin main --tags 2> /dev/null
}

@test "rollback-reflog resets to the entry typed and deletes the tags it leaves behind" {
    kept=$(git rev-parse HEAD~2)
    run bash "$REPO_ROOT/scripts/rollback-reflog.sh" <<< '2'
    assert_success
    assert_output --partial 'Rollback to HEAD@{2}'
    assert_equal "$(git rev-parse HEAD)" "$kept"
    assert_equal "$(git tag)" 'v1.0.0'
    assert_equal "$(remote_tags)" 'v1.0.0'
    assert_equal "$(git --git-dir="$REMOTE" rev-parse main)" "$kept"
}

@test "rollback-reflog refuses an index that is not a number" {
    head=$(git rev-parse HEAD)
    run bash "$REPO_ROOT/scripts/rollback-reflog.sh" <<< 'x'
    assert_failure 1
    assert_output --partial 'Invalid index: x'
    assert_equal "$(git rev-parse HEAD)" "$head"
}
