---
name: release
description: Cut a new release of liferay-dev-cli end-to-end. Generates the markdown changelog from commits since the last `Update to vX.Y.Z`, asks for approval, then lands the `Update to vX.Y.Z` commit on a non-default branch, opens/reuses its PR, waits for checks, rebase-merges, and finally tags the merged commit on `main` and publishes the matching GitHub release. Use when the user asks to release, cut a release, ship a new version, or generate release notes.
---

# Release skill

End-to-end release of liferay-dev-cli:

1. Inspect the commits added since the last `Update to vX.Y.Z`.
2. Determine the next version (semver) and draft the markdown changelog.
3. Show it to the user and **wait for explicit approval**.
4. On approval, add the `Update to vX.Y.Z` commit on a **non-default** branch (creating `release/vX.Y.Z` from `main` if invoked while on `main`; reusing the current branch otherwise).
5. Push, open or reuse the PR, wait for checks, rebase-merge, refresh `main`.
6. Tag the merged `Update to vX.Y.Z` commit (now on `main`) with `vX.Y.Z` and publish the GitHub release using the approved markdown body.

The version bump always lands via PR (so it goes through CI like any other change) and the tag is always created **after** the merge — pinned to the SHA of the rebased commit on `main` — so the tag never points to a commit that isn't in `main`'s history.

## Preconditions (hard checks)

Run these before doing anything. If any one fails, stop, tell the user, and do not proceed. Never mutate the working tree to make a precondition pass.

### 1. Resolve the default branch

```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' \
  || (git show-ref --verify --quiet refs/heads/main && echo main) \
  || echo master
```

### 2. Working tree must be clean

```bash
git status --porcelain
```

If non-empty, abort and show the porcelain output. The version bump must land on top of a clean tree, with no unrelated work mixed in.

### 3. There must be commits to release

```bash
git log --format='%h %s' -n 50
```

Locate the most recent commit whose subject matches `Update to v<version>`. If no commits sit above it (i.e. `HEAD` is that commit), abort — there is nothing to release.

### 4. `gh` must be authenticated

```bash
gh auth status
```

If it exits non-zero, abort and tell the user to run `gh auth login`.

## Workflow

### 1. Find the commit range for the new version

```bash
git log --format='%h %s' -n 50
```

Locate the most recent commit whose subject matches `Update to v<version>`. The release range is `<that-commit>..HEAD` — every commit reachable from `HEAD` and newer than that marker belongs to the new, unreleased version.

This works whether the user invokes the skill from `main` (range covers commits already merged into `main`) or from a feature branch (range covers main's pending commits plus the branch's own commits).

### 2. Determine the next version number

Take the version `X.Y.Z` from that `Update to v…` commit and bump it using semver:

- Breaking change → bump major (`X`)
- New feature / command / flag → bump minor (`Y`)
- Bug fixes only → bump patch (`Z`)

If the bump is ambiguous, suggest a version and confirm with the user before drafting the markdown.

### 3. Inspect the commits

For each commit in the range, inspect it as needed:

```bash
git show --stat <sha>
git show <sha>   # when you need the actual diff
```

Group commits by intent into `Added`, `Changed`, and `Fixed`. Merge related/follow-up commits into a single bullet — e.g. a `Format`, `Fix typo`, `Auto: deno.lock`, or `Update usages` commit that just polishes a main change should be folded into that main change's entry, or dropped entirely if it adds nothing user-facing.

### 4. Pick an animal emoji (not previously used)

The project's convention is a side-profile, full-body animal emoji in the title. To avoid repeats, fetch the history:

```bash
gh release list --limit 300 --json tagName -q '.[].tagName' \
  | while read tag; do
      printf '%s ' "$tag"
      gh release view "$tag" --json body -q '.body | split("\n")[0]' 2>/dev/null
      echo
    done
```

Extract the emojis from the first line of each release body. Suggest a side-profile, full-body animal emoji that isn't in that list. If you can't easily think of one, ask the user to pick.

### 5. Show the changelog and stop

Output the final markdown block to the user, exactly in this shape:

```markdown
# `vX.Y.Z` <animal-emoji>

## Changelog

### Added

- ...

### Changed

- ...

### Fixed

- ...
```

Rules for the body:

- Include only the sections (`Added` / `Changed` / `Fixed`) that actually have entries.
- Keep bullets concise and user-facing — describe what a user notices, not implementation details.
- Wrap command names, flags, and user-facing identifiers in backticks (e.g. `format`, `--profile`, `playwright`).
- Use the body of a previous release as a style reference if needed (`gh release view v1.7.0`).

**Stop here. Do NOT bump the version, push, merge, tag, or release.** Wait for the user to read the markdown and reply. Phrases like "ok", "vale", "adelante", "dale", "sí, sácala", "ship it" count as approval; anything that asks for edits, asks questions, or stays neutral does NOT. When in doubt, ask before proceeding.

### 6. (After approval) Prepare the release branch

If the current branch IS the default branch, create and switch to a fresh release branch:

```bash
git checkout -b "release/vX.Y.Z"
```

If the branch already exists, abort — something's off; the user should investigate.

If the current branch is NOT the default branch, stay on it. The user is already on the branch they want to ship; the version bump will land on top of it.

### 7. Bump the version and commit

Edit `src/lfr.ts` and replace the value of the `VERSION` constant with the new version (`const VERSION = 'vX.Y.Z'`). Then commit, with a subject that matches the project convention exactly — no body, no trailers:

```bash
git add -- src/lfr.ts
git commit -m "Update to vX.Y.Z"
```

### 8. Push, open/reuse the PR, watch checks, rebase-merge

Follow the **`merge-branch` skill workflow** for steps 2–6 (push → find or create PR → wait for checks → rebase-merge → refresh local default branch). The release-specific bits when applying that workflow:

- **PR title**:
    - If the branch was created by this skill (`release/vX.Y.Z`): use `Update to vX.Y.Z`.
    - If the user invoked the skill from a pre-existing feature branch: synthesize the title from the full set of branch commits (including the bump) per merge-branch's title rules — sentence case, imperative, ≤ 70 chars.
- **PR body**: empty (per the user's global title-only PR convention). The changelog goes into the GitHub release in step 9, not the PR description.
- **Merge strategy**: rebase-merge (`gh pr merge --rebase --delete-branch`), matching the rest of the project's history.

If `gh pr checks --watch --fail-fast` exits non-zero, abort. The version bump does not ship until the branch is green.

After `gh pr merge --rebase --delete-branch` and `domo update`, the local checkout is on the default branch, fully refreshed, and `HEAD` points to the rebased `Update to vX.Y.Z` commit.

### 9. Tag the merged commit and publish the release

Capture the SHA of the merged version commit and verify its subject matches before tagging — if anything else has landed on `main` between the merge and now, the SHA must come from the actual `Update to vX.Y.Z` commit, not whatever HEAD happens to be:

```bash
SHA=$(git rev-parse HEAD)
SUBJECT=$(git log -1 --format='%s' "$SHA")
```

If `$SUBJECT` is not exactly `Update to vX.Y.Z`, abort and surface what HEAD is. Otherwise tag the captured SHA as a lightweight tag and push it:

```bash
git tag "vX.Y.Z" "$SHA"
git push origin "vX.Y.Z"
```

Create the GitHub release using the approved changelog body verbatim:

```bash
gh release create "vX.Y.Z" \
  --title "vX.Y.Z" \
  --notes-file - <<'EOF'
<approved markdown body, exactly as shown to the user>
EOF
```

Confirm with one short line including the new release URL.

## Hard rules

- **Never proceed past step 5 without explicit user approval of the changelog.** Drafting and showing the markdown is fine; everything from step 6 onward requires a clear yes from the user. When in doubt, ask.
- **Never commit the version bump directly on the default branch.** It always goes on `release/vX.Y.Z` (when invoked from `main`) or on the existing feature branch (when invoked elsewhere), and reaches `main` through a PR + CI + rebase-merge.
- **Never tag before the merge.** The tag is created after the rebase-merge, against the SHA of the commit that actually landed on `main`. Tagging on the source branch risks orphaning the tag if rebase-merge rewrites SHAs.
- **Never tag without verifying the captured SHA's commit subject is `Update to vX.Y.Z`.** If anything else is at HEAD when you go to tag, abort.
- **Never `--force` push** the branch or the tag. If a push is rejected, abort and let the user reconcile.
- **Never create annotated tags.** The repo's existing tags are lightweight; match them. `git tag vX.Y.Z $SHA` (no `-a`).
- **Never edit, delete, or replace existing tags or releases.** This skill only creates new ones.
- **Never amend prior `Update to vX.Y.Z` commits.** The version bump always lands as a brand-new commit on a non-default branch.
- **Never include commit hashes or internal refactor noise** in the changelog bullets.
- **Never reuse an emoji that has already shipped.** If you can't find a fresh side-profile, full-body animal, ask the user to pick.

## Notes

- The `Update to vX.Y.Z` commit is the single source of truth for the previous release — commits newer than it (anywhere reachable from HEAD) are the unreleased diff.
- If the user supplies their own version number or commit list, use that instead of inferring from git — they've already done the thinking.
- Release body and tag must match the established format: title `# \`vX.Y.Z\` <emoji>`, then `## Changelog`, then sections (only those with content).
- Branch naming: `release/vX.Y.Z` when this skill creates it. When invoked from a pre-existing feature branch, the branch's existing name is kept.
