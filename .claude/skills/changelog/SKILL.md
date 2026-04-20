---
name: changelog
description: Draft the markdown changelog and release notes for the next (unreleased) version of liferay-dev-cli. Use when the user asks to generate/draft the changelog, release notes, or release markdown for the new version.
---

# Changelog skill

Generate the markdown release notes for the next version of this repo, following the project's established format.

## Output format

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

- Include only the sections (`Added` / `Changed` / `Fixed`) that actually have entries.
- Keep bullets concise and user-facing — describe what a user notices, not implementation details.
- Wrap command names, flags, and user-facing identifiers in backticks (e.g. `format`, `--profile`, `playwright`).
- Use [the body of a previous release](https://github.com/) as style reference if needed (e.g. `gh release view v1.7.0`).

## Steps

### 1. Find the commit range for the new version

Run:

```bash
git log --format='%h %s' -n 50
```

Locate the most recent commit whose subject matches `Update to v<version>`. Every commit **above** that line (i.e. newer than it) belongs to the new, unreleased version.

If there are no commits above it, there is nothing to release — tell the user and stop.

### 2. Determine the next version number

Take the version `X.Y.Z` from that "Update to v…" commit and bump it using semver:

- Breaking change → bump major (`X`)
- New feature / command / flag → bump minor (`Y`)
- Bug fixes only → bump patch (`Z`)

If it's ambiguous, suggest a version and confirm with the user before writing the markdown.

### 3. Inspect the commits

For each commit in the range, inspect it as needed:

```bash
git show --stat <sha>
git show <sha>   # when you need the actual diff
```

Group the commits by intent into `Added`, `Changed`, and `Fixed`. Merge related/follow-up commits into a single bullet — e.g. a `Format`, `Fix typo`, or `Update usages` commit that just polishes a main change should be folded into that main change's entry, or dropped entirely if it adds nothing user-facing.

### 4. Pick an animal emoji (not previously used)

The project's convention is a side-profile full-body animal emoji in the title. To avoid repeats, fetch the history:

```bash
gh release list --limit 300 --json tagName -q '.[].tagName' \
  | while read tag; do
      printf '%s ' "$tag"
      gh release view "$tag" --json body -q '.body | split("\n")[0]' 2>/dev/null
      echo
    done
```

Extract the emojis from the first line of each release body. Suggest a side-profile, full-body animal emoji that isn't in that list. If you can't easily think of one, ask the user to pick.

### 5. Produce the markdown

Output the final markdown block to the user. Don't write any files unless explicitly asked.

## Notes

- The "Update to vX.Y.Z" commit is the marker of the previous release — commits newer than it are the unreleased diff.
- If the user supplies their own commit list or version number, use that instead of inferring from git — they've already done the thinking.
- Don't include commit hashes or internal refactor noise in the bullets.
