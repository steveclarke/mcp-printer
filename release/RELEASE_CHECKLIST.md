# Release Checklist for mcp-printer

## Pre-Release Verification

### Code Quality
- [x] Run all tests: `pnpm test` - **✅ 63 tests passed**
- [x] Verify no linting errors: `pnpm run build` - **✅ Clean build, no errors**
- [ ] Review README.md for accuracy and completeness - **IN PROGRESS**
- [x] Verify LICENSE file exists and is correct (MIT) - **✅ Confirmed**
- [x] Check that repository URL in package.json matches GitHub - **✅ https://github.com/steveclarke/mcp-printer.git**

### Build & Package
- [x] Clean build: `pnpm run clean && pnpm run build` - **✅ Complete**
- [x] Verify dist/ directory contains all necessary files - **✅ Verified**
- [x] Create test tarball: `pnpm pack` - **✅ mcp-printer-1.0.0.tgz created**

### Local Testing
- [x] Install from tarball globally: `pnpm add -g ./mcp-printer-1.0.0.tgz` - **✅ Installed**
- [x] Test binary works: `mcp-printer` - **✅ Server starts and responds to MCP messages**
- [x] Test with Cursor using global install - **✅ Works with "command": "mcp-printer"**

### Functional Testing
- [x] Test markdown rendering - **✅ markdown-test-short.md printed successfully**
- [x] Test code rendering (TypeScript, JavaScript, Python files) - **✅ Python, Java, JavaScript, COBOL**
- [x] Test printing various file types (PDF, text) - **✅ Verified**
- [x] Test configuration options (default printer, duplex, options) - **✅ Verified**
- [x] Test all tools: list_printers, print_file, get_print_queue, cancel_print_job, get/set_default_printer - **✅ All working**
- [x] Test security: verify dotfiles are blocked, allowed paths work correctly - **✅ Verified**
- [x] Test `/print-review-package` prompt - **✅ Verified**

## Publishing to npm

### 1. Pre-Publish Checks

```bash
cd /Users/steve/src/mcp-printer

# Ensure working tree is clean
git status

# Ensure all tests pass
pnpm test

# Clean build
pnpm run clean
pnpm run build

# Verify what will be published
pnpm publish --dry-run
```

### 2. Version & Git Tag

```bash
# Current version is 1.0.0 - skip if unchanged
# If you need to bump: pnpm version patch|minor|major

# Create tag locally (DON'T PUSH YET - we'll push after npm succeeds)
git tag -a v1.0.0 -m "Release v1.0.0"
```

### 3. npm Login

```bash
# Login to npm (if not already logged in)
npm login
# OR: pnpm login

# Verify you're logged in
npm whoami
```

### 4. Publish to npm (PERMANENT - do this before pushing to GitHub)

```bash
# Final dry run to see what will be published
pnpm publish --dry-run

# Publish (this is PERMANENT and cannot be undone after 72 hours!)
# Do this BEFORE pushing to GitHub so you can fix issues if it fails
pnpm publish --access public

# The --access public flag is required for unscoped packages
```

**⚠️ Important:** If publish fails, you can delete the local tag (`git tag -d v1.0.0`), fix the issue, and try again. Once npm publish succeeds, proceed to push to GitHub.

### 5. Push to GitHub (AFTER npm publish succeeds)

```bash
# Now that npm publish succeeded, push code and tag together
git push origin master
git push origin v1.0.0

# Or push both at once:
# git push origin master --follow-tags
```

### 6. Create GitHub Release

1. Go to: https://github.com/steveclarke/mcp-printer/releases
2. Click "Draft a new release"
3. Choose tag: v1.0.0
4. Release title: "v1.0.0 - Initial Release 🎉"
5. Description:
   ```markdown
   # MCP Printer - First Release! 🖨️

   An MCP server that gives AI assistants the ability to print documents.

   ## ✨ Features
   - 🖨️ Print files directly from AI conversations
   - 📝 Beautiful markdown rendering with Mermaid diagrams
   - 💻 Syntax-highlighted code printing
   - 📋 Manage print queues and printers
   - 🔒 Secure by default with path restrictions
   - 🎯 Works with Claude Desktop, Cursor, and other MCP clients

   ## 🚀 Quick Start
   
   Add to your MCP config (e.g., `~/.cursor/mcp.json`):
   ```json
   {
     "mcpServers": {
       "Printer": {
         "command": "npx",
         "args": ["-y", "mcp-printer"]
       }
     }
   }
   ```

   Or install globally:
   ```bash
   npm install -g mcp-printer
   ```

   ## 📚 Documentation
   See the [README](https://github.com/steveclarke/mcp-printer#readme) for full setup instructions and configuration options.

   ## 🖥️ Requirements
   - macOS or Linux (CUPS)
   - Node.js 22+
   - Chrome/Chromium (for markdown/code rendering)

   ## 🙏 Feedback Welcome
   This is the initial release. Please report bugs or suggest features via [GitHub Issues](https://github.com/steveclarke/mcp-printer/issues).
   ```
6. Click "Publish release"

## Post-Release Verification

### Verify Package Availability
- [ ] Wait 2-5 minutes for npm propagation
- [ ] Visit: https://www.npmjs.com/package/mcp-printer
- [ ] Test installation: `npm install -g mcp-printer` (in a fresh environment)
- [ ] Test npx approach: `npx -y mcp-printer` (should work immediately)

### Test Published Package
```bash
# Remove any local version
pnpm remove -g mcp-printer

# Install from npm
pnpm add -g mcp-printer

# Test binary
mcp-printer

# Test in Cursor with npx (recommended method from README)
# Update Cursor config to:
# "command": "npx",
# "args": ["-y", "mcp-printer"]
```

### Documentation & Cleanup
- [ ] Verify README renders correctly on npm: https://www.npmjs.com/package/mcp-printer
- [ ] Update any external documentation or links
- [ ] Remove the test tarball: `rm mcp-printer-1.0.0.tgz`
- [ ] Monitor GitHub issues for early bug reports

## Announce! 🚀

See **[RELEASE_ANNOUNCEMENT.md](./RELEASE_ANNOUNCEMENT.md)** for detailed announcement guide with templates for:
- Twitter/X
- Cursor Forum
- Reddit (r/ClaudeAI, r/MCP)

Quick checklist:
- [ ] Twitter/X
- [ ] Cursor Forum
- [ ] Reddit: r/ClaudeAI
- [ ] Reddit: r/MCP

## Package Metadata

- **Package name:** `mcp-printer`
- **Binary command:** `mcp-printer`
- **Current version:** 1.0.0
- **License:** MIT
- **Author:** Stephen Clarke
- **Repository:** https://github.com/steveclarke/mcp-printer
- **npm page:** https://www.npmjs.com/package/mcp-printer

## Common Issues & Solutions

### "Package name already exists"
If `mcp-printer` is taken, alternatives:
- `@steveclarke/mcp-printer` (scoped to your username)
- `mcp-cups-printer`
- `printer-mcp-server`

### "Need to authenticate"
```bash
npm login
# Enter username, password, email, and 2FA code
```

### "402 Payment Required"
Unscoped packages are free. If you see this:
- Use `--access public` flag (should be in step 4)
- OR use a scoped package: `@yourusername/mcp-printer`

### "403 Forbidden"
- Package name might be reserved/blocked
- Try a different name or scoped package
- Check npm status: https://status.npmjs.org/

### "Permission denied" when testing
Ensure CUPS is running: `lpstat -r`

### Binary not found after global install
- Verify npm global bin is in PATH: `npm config get prefix`
- Add to PATH if needed: `export PATH="$PATH:$(npm config get prefix)/bin"`

## Important Reminders

⚠️ **Publishing is permanent!** After 72 hours, you cannot unpublish. Only deprecate.

✅ **Test thoroughly** with the tarball before publishing to npm.

🔄 **pnpm/npm compatibility:** This project uses pnpm for development, but publishes to the standard npm registry. Users can install with npm, pnpm, or yarn.

📝 **Semver:** Follow semantic versioning for future releases:
- Patch (1.0.x): Bug fixes
- Minor (1.x.0): New features, backward compatible
- Major (x.0.0): Breaking changes

🏷️ **Tags:** Use git tags for all releases. They're used by GitHub releases and help track versions.

## Testing Summary

✅ **All pre-release testing complete!**

**Verified working from global npm install:**
- Binary starts correctly
- MCP server responds to messages
- Works in Cursor with `"command": "mcp-printer"`

**Security:**
- File path restrictions work (blocked paths outside allowed dirs)
- Path configuration works (`MCP_PRINTER_ALLOWED_PATHS`)
- Dotfile blocking confirmed

**Rendering:**
- Markdown rendering with Mermaid diagrams ✅
- Code syntax highlighting: Python, Java, JavaScript, COBOL ✅
- Auto-detection fallback works for unlisted languages ✅

**Configuration:**
- Auto-duplex works
- Default printer selection works
- Default options applied (prettyprint, wrap)

**All Tools Tested:**
- ✅ `list_printers` - Shows all printers with status
- ✅ `get_default_printer` - Returns system default
- ✅ `get_print_queue` - Shows queue status
- ✅ `get_config` - Displays all configuration
- ✅ `print_file` - Markdown & code files work perfectly
- ✅ `set_default_printer` - Successfully changed and restored
- ✅ `cancel_print_job` - Works correctly

---

## Future Automation Ideas

Once you're comfortable with the manual process, consider automating with:

**Local Scripts:**
- `scripts/release.sh` - Run pre-publish checks, build, pack, test
- `scripts/publish.sh` - Interactive script for npm login → publish → git push
- `scripts/verify-release.sh` - Test installation from npm after publishing

**GitHub Actions:**
- `.github/workflows/release.yml` - Automated testing on tag push
- `.github/workflows/npm-publish.yml` - Publish to npm on GitHub release
- `.github/workflows/pr-checks.yml` - Run tests on every PR

**Tools to Consider:**
- `release-it` - Automates versioning, tagging, and publishing
- `semantic-release` - Fully automated releases based on commit messages
- `np` - Interactive publish tool by Sindre Sorhus

**Start Simple:**
Start with local shell scripts to automate repetitive steps. Once those work well, move to GitHub Actions for CI/CD. The goal is to understand the process first (which you're doing!), then automate the boring parts.
