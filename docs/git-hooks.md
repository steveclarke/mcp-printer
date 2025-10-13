# Git Hooks with Husky

This project uses Husky and lint-staged to automatically lint and format code before commits.

## How It Works

```
┌─────────────────────────┐
│   git commit -m "..."   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Git pre-commit hook    │
│  (installed by Husky)   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  .husky/pre-commit      │
│  runs: lint-staged      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  .lintstagedrc.json     │
│  defines what to run    │
└───────────┬─────────────┘
            │
            ├─────────────────┬──────────────┐
            ▼                 ▼              ▼
      ┌─────────┐      ┌──────────┐   ┌──────────┐
      │ ESLint  │      │ Prettier │   │ Prettier │
      │  --fix  │      │  --write │   │  --write │
      └────┬────┘      └────┬─────┘   └────┬─────┘
        .ts files      .ts files      .json/.md
            │                 │              │
            └─────────────────┴──────────────┘
                          │
            ┌─────────────┴──────────────┐
            ▼                            ▼
       ✅ Success                    ❌ Errors
    Commit proceeds              Commit blocked
```

## Setup (Automatic)

When you run `pnpm install`, the `prepare` script automatically runs `husky`, which:
1. Installs Git hooks into `.git/hooks/`
2. Links them to the scripts in `.husky/` directory

This means all developers get the hooks automatically - no manual setup required.

## What Happens on Commit

1. You run `git commit`
2. Git triggers `.husky/pre-commit` hook
3. The hook runs `lint-staged`
4. `lint-staged` processes only staged files according to `.lintstagedrc.json`:
   - **TypeScript files**: ESLint (auto-fix) → Prettier (format)
   - **Config/doc files**: Prettier (format)
5. **If errors remain** (e.g., `any` types): Commit is blocked
6. **If all pass**: Auto-fixed files are added to commit, commit proceeds

## Configuration Files

- **`.husky/pre-commit`**: Runs `lint-staged` before each commit
- **`.lintstagedrc.json`**: Defines which tools run on which file types
- **`eslint.config.js`**: ESLint rules (including `no-explicit-any`)
- **`.prettierrc.json`**: Code formatting rules (double quotes, no semicolons, 2-space indent)

## Bypassing Hooks (Emergency Only)

```bash
git commit --no-verify -m "Emergency fix"
```

## Benefits

- **Fast**: Only lints changed files, not entire codebase
- **Automatic**: Works for all developers on `pnpm install`
- **Prevents issues**: Catches problems before they reach the repository
- **Consistent**: Everyone's code is formatted the same way

