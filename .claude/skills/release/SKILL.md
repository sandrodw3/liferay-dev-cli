---
name: release
description: Cut a new release of liferay-dev-cli end-to-end. Generates the markdown changelog from commits since the last `Update to vX.Y.Z`, asks for approval, then lands the `Update to vX.Y.Z` commit on a non-default branch, opens/reuses its PR, waits for checks, rebase-merges, and finally tags the merged commit on `main` and publishes the matching GitHub release. Use when the user asks to release, cut a release, ship a new version, or generate release notes.
---

# Release skill

End-to-end release of liferay-dev-cli. The version bump lands via PR so it goes through CI; the tag is created **after** the merge, pinned to the SHA on `main`.

## Preconditions

Stop if any fail:

- Working tree is clean (`git status --porcelain`).
- There are commits above the last `Update to vX.Y.Z` (otherwise nothing to release).
- `gh auth status` succeeds.

## 1. Build the changelog

Find the last `Update to v<version>` with `git log --format='%h %s' -n 50`. The release range is `<that-commit>..HEAD`.

Bump per semver: breaking → major, feature → minor, fixes → patch. If ambiguous, confirm.

Inspect commits (`git show --stat <sha>`, `git show <sha>` when needed). Group into `Added` / `Changed` / `Fixed`. Fold polish commits (`Format`, typo fixes, `Auto: deno.lock`) into their parent or drop them. Bullets describe what users notice; wrap commands/flags in backticks.

Pick a side-profile, full-body animal emoji not used in any prior release:

```bash
gh release list --limit 300 --json tagName -q '.[].tagName' \
  | while read tag; do
      printf '%s ' "$tag"
      gh release view "$tag" --json body -q '.body | split("\n")[0]' 2>/dev/null
      echo
    done
```

Show the markdown in exactly this shape (include only sections with entries):

```markdown
# `vX.Y.Z` <emoji>

## Changelog

### Added

- ...

### Changed

- ...

### Fixed

- ...
```

**Stop and wait for explicit approval before continuing.**

## 2. Bump and ship

If on the default branch, create `release/vX.Y.Z`. Otherwise stay on the current branch.

Edit `src/lfr.ts` so `VERSION = 'vX.Y.Z'`, then:

```bash
git add -- src/lfr.ts
git commit -m "Update to vX.Y.Z"
```

Run the `merge-branch` skill (push → PR → checks → rebase-merge → refresh `main`). PR title is `Update to vX.Y.Z` when this skill created the branch; otherwise synthesize per `merge-branch`. PR body stays empty.

## 3. Tag and release

After the merge, HEAD should be the rebased version commit on `main`. Verify before tagging:

```bash
SHA=$(git rev-parse HEAD)
SUBJECT=$(git log -1 --format='%s' "$SHA")
```

If `$SUBJECT` is not exactly `Update to vX.Y.Z`, abort. Otherwise:

```bash
git tag "vX.Y.Z" "$SHA"
git push origin "vX.Y.Z"
gh release create "vX.Y.Z" --title "vX.Y.Z" --notes-file - <<'EOF'
<approved markdown body>
EOF
```

Tags are lightweight (no `-a`), matching the project's history. Confirm with one short line including the release URL.
