# MCP Printer Server 🖨️

The **first** MCP server for printing documents on macOS/Linux! Provides AI assistants with the ability to print files, manage print queues, and control printers via the CUPS printing system.

## Features

- 📄 **Print files** - PDF, text, and other formats
- 🖨️ **List printers** - See all available printers and their status
- 📋 **Manage queue** - View and cancel print jobs
- ⚙️ **Configure** - Set default printers
- 🎯 **Smart** - Supports multiple copies, landscape, duplex, and more

## Installation

### Option 1: Package Manager (Recommended)

```bash
# npm
npm install -g mcp-printer

# pnpm
pnpm add -g mcp-printer

# yarn
yarn global add mcp-printer
```

### Option 2: From Source

```bash
git clone https://github.com/myunio/mcp-printer.git
cd mcp-printer
pnpm install
pnpm run build
```

## Configuration

Add to your MCP settings file:

**Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Cursor**: Settings → Features → MCP Servers → Edit Config

### If installed globally (recommended):

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

### If running from source:

```json
{
  "mcpServers": {
    "printer": {
      "command": "node",
      "args": ["/path/to/mcp-printer/dist/index.js"],
      "env": {
        "MCP_PRINTER_DEFAULT": "Your_Printer_Name",
        "MCP_PRINTER_DUPLEX": "true"
      }
    }
  }
}
```

### Configuration Options

Configure via environment variables (all optional):

- **`MCP_PRINTER_DEFAULT`**: Default printer to use when none specified
- **`MCP_PRINTER_DUPLEX`**: Set to `"true"` to print double-sided by default
- **`MCP_PRINTER_OPTIONS`**: Additional CUPS options (e.g., `"fit-to-page"`, `"landscape"`)

**Example with all options:**
```json
"env": {
  "MCP_PRINTER_DEFAULT": "HP_LaserJet_Pro",
  "MCP_PRINTER_DUPLEX": "true",
  "MCP_PRINTER_OPTIONS": "fit-to-page"
}
```

💡 **Tip:** Run `lpstat -p` in your terminal to see your exact printer names.

User-specified options in prompts always override these defaults.

## Available Tools

### `list_printers`
List all available printers with their status.

**Example:**
```
AI: Let me check what printers you have...
→ HP_LaserJet_4001 is idle and accepting jobs
→ Canon_Pixma is disabled
```

### `print_file`
Print a file to a specified printer.

**Parameters:**
- `file_path` (required) - Full path to file
- `printer` (optional) - Printer name
- `copies` (optional) - Number of copies (default: 1)
- `options` (optional) - CUPS options like `landscape`, `sides=two-sided-long-edge`

**Example:**
```
User: Print README.md to my HP LaserJet, 2 copies
AI: *prints file*
✓ File sent to printer: HP_LaserJet_4001
  Copies: 2
  File: /path/to/README.md
```

### `get_print_queue`
Check the print queue for pending jobs.

**Parameters:**
- `printer` (optional) - Specific printer to check

**Example:**
```
AI: Let me check your print queue...
→ Job 123: document.pdf (active)
→ Job 124: notes.txt (pending)
```

### `cancel_print_job`
Cancel a print job.

**Parameters:**
- `job_id` (optional) - Specific job to cancel
- `printer` (optional) - Printer name
- `cancel_all` (optional) - Cancel all jobs for printer

**Example:**
```
User: Cancel job 123
AI: ✓ Cancelled job: 123
```

### `get_default_printer`
Get the current default printer.

**Example:**
```
AI: Your default printer is: HP_LaserJet_4001
```

### `set_default_printer`
Set a printer as the default.

**Parameters:**
- `printer` (required) - Printer name

**Example:**
```
User: Make HP LaserJet my default printer
AI: ✓ Set default printer to: HP_LaserJet_4001
```

## Usage Examples

### Print Documentation

```
User: Print all the markdown files in docs/
AI: Let me do that for you...
*prints setup.md*
*prints guide.md*
*prints reference.md*
✓ Printed 3 files to HP_LaserJet_Pro
```

### Print with Options

```
User: Print this PDF in landscape, double-sided
AI: *prints with options: landscape, sides=two-sided-long-edge*
```

### Manage Queue

```
User: What's in my print queue?
AI: You have 2 jobs:
- Job 125: report.pdf (printing)
- Job 126: invoice.pdf (pending)

User: Cancel job 126
AI: ✓ Cancelled job: 126
```

## Supported File Types

The server uses CUPS, which supports:
- ✅ PDF
- ✅ Plain text
- ✅ PostScript
- ✅ Images (JPEG, PNG via conversion)
- ⚠️ Office docs (may need conversion to PDF first)

## CUPS Options

Common options you can pass via the `options` parameter:

- `landscape` - Print in landscape orientation
- `sides=two-sided-long-edge` - Double-sided (long edge)
- `sides=two-sided-short-edge` - Double-sided (short edge)
- `page-ranges=1-5` - Print specific pages
- `media=Letter` or `media=A4` - Paper size
- `fit-to-page` - Scale to fit page

## Troubleshooting

### "Printer not found"
Run `lpstat -p` in terminal to see exact printer names. They often have underscores instead of spaces.

### "Permission denied"
Ensure CUPS is running: `sudo cupsctl`

### "File format not supported"
Convert to PDF first: `cupsfilter -i application/pdf -o output.pdf input.docx`

### Server not showing in Cursor
1. Restart Cursor after updating MCP config
2. Check Developer Tools → Console for errors
3. Verify the path to `dist/index.js` is correct

## Development

```bash
# Watch mode
pnpm run dev

# Build
pnpm run build

# Test locally
echo "Hello from MCP Printer Server!" > test.txt
# Then ask AI to print test.txt
```

## Requirements

- **macOS or Linux** - Uses CUPS printing system
  - macOS: CUPS is built-in
  - Linux: Install CUPS if not present (`sudo apt install cups` on Ubuntu/Debian)
- **Node.js** 18+
- Printers configured in your system

## Security Note

This server executes system print commands. Only use with trusted AI assistants in secure environments.

## License

MIT

## Contributing

This is the first MCP printer server! Contributions welcome:
- Windows support (using Windows Print Spooler)
- More print options
- Better error handling
- Testing on various Linux distributions

---

**You're now the first person with an AI that can print!** 🎉🖨️

