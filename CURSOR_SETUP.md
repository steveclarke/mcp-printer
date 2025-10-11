# Cursor MCP Setup Guide

## Quick Setup (5 minutes)

### Step 1: Install

```bash
# npm
npm install -g mcp-printer

# or pnpm
pnpm add -g mcp-printer

# or yarn
yarn global add mcp-printer
```

### Step 2: Configure Cursor

1. Open Cursor Settings
2. Go to: **Features** → **Model Context Protocol**
3. Click **"Edit Config"**
4. Add this to your config:

```json
{
  "mcpServers": {
    "printer": {
      "command": "mcp-printer",
      "env": {
        "MCP_PRINTER_DEFAULT": "Your_Printer_Name",
        "MCP_PRINTER_DUPLEX": "true"
      }
    }
  }
}
```

💡 **Find your printer name:** Run `lpstat -p` in terminal

### Configuration Options

- **`MCP_PRINTER_DEFAULT`**: Default printer name (optional)
- **`MCP_PRINTER_DUPLEX`**: Set to `"true"` for double-sided printing by default
- **`MCP_PRINTER_OPTIONS`**: Additional CUPS options like `"fit-to-page"` or `"landscape"`

Example with all options:
```json
"env": {
  "MCP_PRINTER_DEFAULT": "HP_LaserJet_Pro",
  "MCP_PRINTER_DUPLEX": "true",
  "MCP_PRINTER_OPTIONS": "fit-to-page"
}
```

### Step 3: Restart Cursor

Completely quit and restart Cursor for the MCP server to load.

### Step 4: Test It!

Open a new chat and try:

```
"What printers do I have available?"
```

The AI should list your printers using the `list_printers` tool!

## Verification

Check if the server loaded:
1. Open Developer Tools (`Cmd+Shift+I`)
2. Go to **Console** tab
3. Look for: `MCP Printer Server running on stdio`

If you see errors, check:
- Path to `dist/index.js` is correct
- Server built successfully (`npm run build`)
- Node.js is accessible

## Example Commands

Once configured, you can ask the AI:

### Basic
- "What printers do I have?"
- "Print this file: /path/to/document.pdf"
- "What's my default printer?"

### Advanced
- "Print all markdown files in docs/ to my HP LaserJet"
- "Print README.md in landscape, 2 copies"
- "What's in my print queue?"
- "Cancel print job 123"

### Super Useful
- "Print these 5 documents to review"
- "Print the project structure docs"
- "Check if anything is printing and cancel it"

## Troubleshooting

### Server not loading
```bash
# Test the server manually
mcp-printer
# Should output: MCP Printer Server running on stdio

# Or check if installed
which mcp-printer
```

### Can't find printers
```bash
# List printers in terminal
lpstat -p

# If no printers, add one in System Settings → Printers & Scanners
```

### Permissions error
```bash
# Check CUPS status
lpstat -r
# Should say: "scheduler is running"
```

## Notes

- The server only runs when Cursor/AI needs it
- No background process - very lightweight
- Uses standard CUPS printing (macOS/Linux)
- Works with all printers configured in your system

---

**You're all set! Your AI can now print!** 🎉

