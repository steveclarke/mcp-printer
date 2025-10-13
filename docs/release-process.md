# Release Process

This document describes the ongoing release process for `mcp-printer` using the `np` release tool.

## Prerequisites

Before you can release, make sure you have:

- [ ] All changes are committed and pushed
- [ ] All tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm run build`
- [ ] You've updated `CHANGELOG.md` with new version changes
- [ ] README is up to date if there are new features
- [ ] You're on the `master` branch
- [ ] Your branch is up to date: `git pull`
- [ ] You're logged in to npm: `npm whoami`

## Quick Start

Once you've completed the prerequisites above, releasing is simple:

```bash
pnpm release
```

The `np` tool will guide you through an interactive release process that handles version bumping, testing, building, tagging, publishing, and creating a GitHub release.

## Version Selection

When you run `pnpm release`, you'll be prompted to select a version bump type:

| Option         | Example           | Use Case                          |
| -------------- | ----------------- | --------------------------------- |
| **patch**      | 1.0.0 → 1.0.1     | Bug fixes, minor improvements     |
| **minor**      | 1.0.0 → 1.1.0     | New features, backward compatible |
| **major**      | 1.0.0 → 2.0.0     | Breaking changes                  |
| **prepatch**   | 1.0.0 → 1.0.1-0   | Prerelease patch version          |
| **preminor**   | 1.0.0 → 1.1.0-0   | Prerelease minor version          |
| **premajor**   | 1.0.0 → 2.0.0-0   | Prerelease major version          |
| **prerelease** | 1.0.1-0 → 1.0.1-1 | Increment prerelease version      |
| **custom**     | 1.0.0 → X.Y.Z     | Type any version you want         |

Follow [Semantic Versioning](https://semver.org/) guidelines when choosing a version.

## Interactive Workflow

Here's what happens when you run `pnpm release`:

### 1. Pre-flight Checks
`np` automatically verifies:
- ✅ Working directory is clean (no uncommitted changes)
- ✅ Current branch is `master`
- ✅ Local branch is up to date with remote
- ✅ npm credentials are valid

### 2. Version Selection
- You choose the version bump type (or enter a custom version)
- `np` shows you a preview of what will change

### 3. Test Suite
- Runs `pnpm test` to ensure all tests pass
- Release is aborted if any tests fail

### 4. Build
- Runs `prepublishOnly` script (`pnpm run build`)
- Ensures the `dist/` directory is up to date

### 5. Version Bump & Commit
- Updates version in `package.json`
- Creates a git commit with message like "1.0.1"
- Creates a git tag like `v1.0.1`

### 6. npm Publish
- Publishes the package to npm registry
- Uses `--access public` for public packages

### 7. Push to GitHub
- Pushes commits and tags to the remote repository

### 8. GitHub Release
- Automatically creates a GitHub release for the new version
- You can edit the release notes afterward

### 9. Success!
- `np` shows a summary of what was published
- Provides links to npm package and GitHub release

## Common Commands

### Dry Run (Preview Mode)
Test the release process without actually publishing:

```bash
pnpm release --preview
```

This shows you exactly what will happen without making any changes.

### Release from Non-Master Branch
By default, releases must be from `master`. To release from another branch:

```bash
pnpm release --any-branch
```

⚠️ **Warning:** Only use this for testing or emergency hotfixes.

### Skip Cleanup on Error
If the release fails and you want to inspect the temporary files:

```bash
pnpm release --no-cleanup
```

### Skip Tests
Not recommended, but if you need to skip tests:

```bash
pnpm release --no-tests
```

### Tag Only (No Publish)
Create a git tag without publishing to npm:

```bash
pnpm release --tag --no-publish
```

## What np Does Automatically

`np` handles all of these tasks for you:

| Task           | Manual Process                   | With np                        |
| -------------- | -------------------------------- | ------------------------------ |
| Version bump   | Edit package.json manually       | ✅ Interactive prompt           |
| Run tests      | Remember to run `pnpm test`      | ✅ Automatic                    |
| Build          | Remember to run `pnpm run build` | ✅ Automatic via prepublishOnly |
| Git commit     | `git commit -m "version"`        | ✅ Automatic                    |
| Git tag        | `git tag -a v1.0.1 -m "..."`     | ✅ Automatic                    |
| Push commits   | `git push origin master`         | ✅ Automatic                    |
| Push tags      | `git push origin v1.0.1`         | ✅ Automatic                    |
| npm publish    | `npm publish --access public`    | ✅ Automatic                    |
| GitHub release | Create manually on GitHub        | ✅ Automatic                    |

## Troubleshooting

### "Couldn't find npm binary"
Make sure npm is installed and in your PATH:
```bash
npm --version
```

### "Git working directory not clean"
You have uncommitted changes. Either commit them or stash them:
```bash
git status
git add .
git commit -m "Your changes"
```

### "Current branch is not master"
Switch to master branch:
```bash
git checkout master
git pull
```

### "Not logged in to npm"
Login to npm:
```bash
npm login
# Enter username, password, email, and 2FA code
```

Verify you're logged in:
```bash
npm whoami
```

### "Tests failed"
Fix the failing tests before releasing:
```bash
pnpm test
```

Or skip tests (not recommended):
```bash
pnpm release --no-tests
```

### "Permission denied" or "403 Forbidden"
- Verify you're logged in: `npm whoami`
- Check if you have publish rights to the package
- For first publish, use `--access public` (already configured in `.np-config.json`)

### "Package already exists at this version"
You cannot republish the same version. Bump to a new version instead.

### Release failed partway through
`np` is designed to be safe. If it fails:
1. It will attempt to rollback changes
2. Check `git status` and `git log` to see what happened
3. If a tag was created locally but not pushed, delete it: `git tag -d v1.0.1`
4. Fix the issue and try again

## Configuration

The release process is configured in `.np-config.json`:

```json
{
  "git": {
    "requireBranch": "master",              // Must be on master branch
    "requireCleanWorkingDirectory": true,   // No uncommitted changes
    "requireUpToDate": true,                // Must be synced with remote
    "tagName": "v${version}"                // Git tag format
  },
  "npm": {
    "publish": true,                        // Publish to npm
    "publishTag": "latest"                  // npm dist-tag
  },
  "github": {
    "release": true                         // Create GitHub release
  },
  "tests": true,                            // Run tests before publish
  "anyBranch": false,                       // Enforce master branch
  "preview": false                          // Don't default to preview mode
}
```

You can modify this file to change the default behavior.

## Before np vs After np

### Before (Manual Process)
1. Manually edit `package.json` version
2. Run `pnpm test` (hope you remember!)
3. Run `pnpm run build`
4. Create git commit
5. Create git tag: `git tag -a v1.0.1 -m "Release v1.0.1"`
6. Push commits: `git push origin master`
7. Push tags: `git push origin v1.0.1`
8. Login to npm: `npm login`
9. Publish: `npm publish --access public`
10. Go to GitHub and manually create a release
11. Copy/paste release notes

**Time:** ~10-15 minutes, many opportunities for mistakes

### After (With np)
1. Run `pnpm release`
2. Choose version
3. Confirm

**Time:** ~2-3 minutes, everything automated and verified

## Tips

- **Complete all prerequisites** before starting a release (see Prerequisites section above)
- **Use preview mode** when learning: `pnpm release --preview`
- **Follow semantic versioning** for version numbers
- **Don't rush** - the interactive prompts give you time to verify each step

## Additional Resources

- [np Documentation](https://github.com/sindresorhus/np)
- [Semantic Versioning](https://semver.org/)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v10/commands/npm-publish)

---

**Note:** For historical reference, see [`release/RELEASE_CHECKLIST.md`](../release/RELEASE_CHECKLIST.md) which documents the manual process used for the initial v1.0.0 release.

