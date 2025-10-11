# Release Checklist for mcp-printer

## Pre-Release Testing

- [ ] Test `pnpm pack` to see what will be published
- [ ] Test local installation: `pnpm add -g ./mcp-printer-1.0.0.tgz`
- [ ] Verify binary works: `mcp-printer` (should output: "MCP Printer Server running on stdio")
- [ ] Test in Cursor with the installed global package
- [ ] Test printing various file types (PDF, text, markdown)
- [ ] Test all configuration options (default printer, duplex, options)
- [ ] Test all tools (list, print, queue, cancel, get/set default)

## Publishing to npm

### 1. Test Package Locally

```bash
cd /Users/steve/src/mcp-printer

# Create tarball to see what will be published
pnpm pack

# Test install from tarball
pnpm add -g ./mcp-printer-1.0.0.tgz

# Test the command
mcp-printer
# Should output: MCP Printer Server running on stdio

# Verify it works in Cursor
# Update Cursor config to use: "command": "mcp-printer"
```

### 2. Login to npm

```bash
# Login to npm (if not already)
pnpm login
# Enter username, password, email, and 2FA code
```

### 3. Publish

```bash
# Dry run first (see what would be published)
pnpm publish --dry-run

# Actually publish (this is PERMANENT!)
pnpm publish

# If this is your first public package, you might need:
pnpm publish --access public
```

### 4. Commit to GitHub

```bash
git add .
git commit -m "Initial release v1.0.0"
git push origin master

# Tag the release
git tag v1.0.0
git push origin v1.0.0
```

### 5. Create GitHub Release

1. Go to: https://github.com/myunio/mcp-printer/releases
2. Click "Create a new release"
3. Select tag: v1.0.0
4. Title: "v1.0.0 - Initial Release 🎉"
5. Description:
   ```markdown
   # MCP Printer - First Release! 🖨️

   The world's first MCP server for printing!

   ## Features
   - Print files from AI assistants
   - Manage print queues
   - Control printers
   - macOS/Linux support (CUPS)

   ## Installation
   ```bash
   npm install -g mcp-printer
   ```

   See README for full setup instructions.
   ```

### 6. Announce! 🚀

Share on:
- [ ] Twitter/X
- [ ] Reddit (r/ClaudeAI, r/LocalLLaMA)
- [ ] MCP community Discord
- [ ] Hacker News (Show HN: First MCP server for printing)
- [ ] Product Hunt (optional)

## Post-Release

- [ ] Test installation: `pnpm add -g mcp-printer` (or `npm install -g mcp-printer`)
- [ ] Verify it appears on npm: https://www.npmjs.com/package/mcp-printer
- [ ] Update any external docs/links
- [ ] Monitor GitHub issues for bug reports

## Notes

- npm package name: `mcp-printer`
- Binary command: `mcp-printer`
- Current version: 1.0.0
- License: MIT
- Author: Stephen Clarke
- Repository: https://github.com/myunio/mcp-printer

## Common Issues

**"Package name taken"**
If `mcp-printer` is taken, try:
- `@yourusername/mcp-printer` (scoped)
- `mcp-cups-printer`
- `printer-mcp-server`

**"Need to be logged in"**
Run: `pnpm login` and enter credentials

**"402 Payment Required"**
You need to upgrade npm account or use scoped package `@username/mcp-printer`

**Note:** pnpm publishes to the same npm registry, so all npm packages work with pnpm!

**"Forbidden"**
Package name might be reserved. Try a different name.

---

**Remember:** Publishing is permanent! You can't unpublish after 72 hours.
Test thoroughly before publishing!

**Using pnpm:** This project uses pnpm, but publishes to npm registry. Users can install with npm, pnpm, or yarn.

