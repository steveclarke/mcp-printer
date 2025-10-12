# Release Announcement Guide

After successfully publishing to npm and GitHub, announce the release to the community.

## Where to Announce

- [ ] **Twitter/X** - Tag @AnthropicAI and use #MCP #ClaudeAI
- [ ] **Cursor Forum** - Post in relevant category (MCP servers or Show & Tell)
- [ ] **Reddit: r/ClaudeAI** - "MCP server for printing"
- [ ] **Reddit: r/MCP** - Cross-post or create new post

## Announcement Templates

### Twitter/X
```
🎉 Just released MCP Printer v1.0.0!

A Model Context Protocol server that lets AI assistants print documents.

✨ Features:
- Print from Claude/Cursor conversations
- Beautiful markdown & code rendering
- Manage print queues
- Works on macOS/Linux

🚀 Get started: npm install -g mcp-printer

GitHub: https://github.com/steveclarke/mcp-printer
npm: https://www.npmjs.com/package/mcp-printer

#MCP #AI #ClaudeAI #Printing
```

### Reddit (Long Form)

**Title:** MCP Printer - Give AI assistants the ability to print documents

**Body:**
```markdown
I built an MCP server that lets AI assistants like Claude print documents directly from conversations.

## What is it?

MCP Printer is a Model Context Protocol server that connects to your system printers via CUPS (macOS/Linux). It gives AI assistants the ability to print files, manage print queues, and control printers.

## Why?

When working with AI on complex projects, I found myself constantly generating documentation, specs, and code that I wanted to review offline on paper. Instead of manually exporting and printing everything, I wanted to just ask the AI: "Print all the markdown files you just created" or "Print the README with syntax highlighting."

## Key Features

- 📄 **Print any file** - PDF, text, markdown, code
- 📝 **Beautiful markdown rendering** - Converts markdown to formatted PDFs with Mermaid diagrams
- 💻 **Syntax-highlighted code** - Automatically renders code files with proper highlighting and line numbers
- 🖨️ **Printer management** - List printers, view queues, cancel jobs
- 🔒 **Secure by default** - Restricts file access to safe directories (configurable)
- ⚙️ **Highly configurable** - Default printer, duplex, color schemes, and more

## Quick Start

Add to your MCP config (e.g., `~/.cursor/mcp.json`):

\`\`\`json
{
  "mcpServers": {
    "Printer": {
      "command": "npx",
      "args": ["-y", "mcp-printer"]
    }
  }
}
\`\`\`

That's it! Then just ask your AI: "Print the README file"

## Installation

\`\`\`bash
npm install -g mcp-printer
\`\`\`

Or use npx (recommended) - shown in config above.

## Requirements

- macOS or Linux (uses CUPS)
- Node.js 22+
- Chrome/Chromium (for markdown/code rendering)

## Links

- **GitHub:** https://github.com/steveclarke/mcp-printer
- **npm:** https://www.npmjs.com/package/mcp-printer
- **Documentation:** Full README with examples and configuration options

## Feedback Welcome!

This is the initial release. Let me know if you run into any issues or have suggestions for improvements.
```

### Cursor Forum

**Title:** [MCP Server] Printer - Print documents from AI conversations

**Body:**
```markdown
I've published an MCP server that gives Claude/Cursor the ability to print documents.

**What it does:**
- Print files directly from AI conversations
- Automatically renders markdown to beautiful PDFs (with Mermaid diagrams!)
- Syntax-highlights code files for printing
- Manage print queues and printers

**Quick setup:**

Add to your `~/.cursor/mcp.json`:

\`\`\`json
{
  "mcpServers": {
    "Printer": {
      "command": "npx",
      "args": ["-y", "mcp-printer"]
    }
  }
}
\`\`\`

Then just ask Cursor: "Print the README file" or "Print all TypeScript files in src/"

**Why I built this:**

When working with AI on complex projects, I generate a lot of documentation and code that I want to review offline on paper. This tool makes it effortless to print AI-generated artifacts.

**Links:**
- GitHub: https://github.com/steveclarke/mcp-printer
- npm: https://www.npmjs.com/package/mcp-printer

Works on macOS/Linux (CUPS). Feedback welcome!
```

## Tips for Announcing

1. **Timing:** Post on weekday mornings (9-11 AM in your timezone) for best visibility
2. **Engagement:** Respond to comments and questions promptly
3. **Visuals:** Consider adding a screenshot or demo GIF (optional for v1.0.0)
4. **Cross-posting:** Wait a few hours between posts to different communities
5. **Follow-up:** Monitor for 24-48 hours after posting for questions/issues

## Post-Announcement

- Monitor GitHub issues for bug reports
- Respond to comments on Reddit/Cursor Forum
- Track npm download stats: https://www.npmjs.com/package/mcp-printer
- Note any common questions for FAQ updates

---

**Remember:** Be helpful and humble. Focus on the problem it solves rather than technical details. Let people discover the depth of features on their own.

