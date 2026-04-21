# CLAUDE.md

## After making changes

After finishing any code change requested by the user, always run both commands in sequence from the project root:

```
npm run format
deno check .
```

- `npm run format` runs Prettier over the repo to apply the project's formatting (including import sorting via `@trivago/prettier-plugin-sort-imports`).
- `deno check .` type-checks the whole project.

If either command reports errors, fix them before reporting the task as done.
