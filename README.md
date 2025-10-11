# MCP Printer Server 🖨️

An MCP server for printing documents on macOS/Linux. Provides AI assistants with the ability to print files, manage print queues, and control printers via the CUPS printing system.

## Why?

In the era of AI-assisted development, we're generating more documentation, specs, guides, and code than ever before. When working with AI on complex projects, it's often valuable to review generated artifacts offline on paper. This tool makes it effortless to ask your AI assistant: *"Print all the markdown files you just created"* or *"Print the README and all TypeScript files in this directory"* — streamlining the workflow from AI generation to offline review.

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Available Tools](#available-tools)
- [Available Prompts](#available-prompts)
- [Usage Examples](#usage-examples)
- [Supported File Types](#supported-file-types)
- [CUPS Options](#cups-options)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Requirements](#requirements)
- [Contributing](#contributing)


> **Note:** This tool requires a local MCP client (e.g., Claude Desktop, Cursor) and cannot be used with web-based AI interfaces.

## Features

- 📄 **Print files** - PDF, text, and other formats
- 📝 **Render markdown** - Convert markdown to beautifully formatted PDFs before printing
- 💻 **Syntax-highlighted code** - Automatically render code files with syntax highlighting, line numbers, and proper formatting
- 🖨️ **List printers** - See all available printers and their status
- 📋 **Manage queue** - View and cancel print jobs
- ⚙️ **Configure** - Set default printers
- 🎯 **Smart** - Supports multiple copies, landscape, duplex, and more

## Installation

```bash
# npm
npm install -g mcp-printer

# pnpm
pnpm add -g mcp-printer

# yarn
yarn global add mcp-printer
```

## Configuration

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "Printer": {
      "command": "mcp-printer"
    }
  }
}
```

### Configuration Options

All configuration is optional. Add an `env` object to customize behavior:

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_PRINTER_DEFAULT_PRINTER` | _(none)_ | Default printer to use when none specified |
| `MCP_PRINTER_ENABLE_DUPLEX` | `false` | Set to `"true"` to print double-sided by default |
| `MCP_PRINTER_DEFAULT_OPTIONS` | _(none)_ | Additional CUPS options (e.g., `"fit-to-page"`, `"landscape"`) |
| `MCP_PRINTER_CHROME_PATH` | _(auto-detected)_ | Full path to Chrome/Chromium executable |
| `MCP_PRINTER_MARKDOWN_EXTENSIONS` | _(none)_ | File extensions to auto-render to PDF (e.g., `"md,markdown"`) |
| `MCP_PRINTER_DISABLE_MANAGEMENT` | `false` | Set to `"true"` to disable write operations (`set_default_printer`, `cancel_print_job`) |
| `MCP_PRINTER_FALLBACK_ON_RENDER_ERROR` | `false` | Set to `"true"` to print original file if PDF rendering fails (markdown/code). When false, errors will be thrown instead |
| `MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS` | _(none)_ | Extensions to exclude from code rendering, or `"all"` to disable |
| `MCP_PRINTER_CODE_COLOR_SCHEME` | `"atom-one-light"` | Syntax highlighting color scheme (see [Available Themes](#code-color-schemes)) |
| `MCP_PRINTER_CODE_ENABLE_LINE_NUMBERS` | `true` | Show line numbers in code printouts (set to `"false"` to disable) |
| `MCP_PRINTER_CODE_FONT_SIZE` | `"10pt"` | Font size for code (e.g., `"8pt"`, `"12pt"`) |
| `MCP_PRINTER_CODE_LINE_SPACING` | `"1.5"` | Line spacing multiplier for code (e.g., `"1"`, `"1.5"`, `"2"`) |

**Example configuration:**
```json
{
  "mcpServers": {
    "Printer": {
      "command": "mcp-printer",
      "env": {
        "MCP_PRINTER_DEFAULT_PRINTER": "HP_LaserJet_Pro",
        "MCP_PRINTER_ENABLE_DUPLEX": "true",
        "MCP_PRINTER_DEFAULT_OPTIONS": "fit-to-page",
        "MCP_PRINTER_MARKDOWN_EXTENSIONS": "md,markdown",
        "MCP_PRINTER_CODE_COLOR_SCHEME": "github",
        "MCP_PRINTER_CODE_FONT_SIZE": "9pt"
      }
    }
  }
}
```

💡 **Tip:** Run `lpstat -p` in your terminal to see your exact printer names.

User-specified options in prompts always override these defaults.

## Available Tools

### `get_config`
Get the current MCP Printer configuration settings. Only returns non-sensitive configuration values.

**Example:**
```
User: What are my printer settings?
AI: Current MCP Printer Configuration:

MCP_PRINTER_DEFAULT_PRINTER: HP_LaserJet_4001
MCP_PRINTER_ENABLE_DUPLEX: true
MCP_PRINTER_DEFAULT_OPTIONS: (not set)
MCP_PRINTER_CHROME_PATH: (auto-detected)
MCP_PRINTER_MARKDOWN_EXTENSIONS: md, markdown
MCP_PRINTER_DISABLE_MANAGEMENT: false
```

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

### `render_and_print_markdown`
Render a markdown file to PDF and print it with proper formatting.

**Requirements:**
- `pandoc` - Install with `brew install pandoc`
- Google Chrome or Chromium browser

**Parameters:**
- `file_path` (required) - Full path to markdown file
- `printer` (optional) - Printer name
- `copies` (optional) - Number of copies (default: 1)
- `options` (optional) - CUPS options

**Example:**
```
User: Render and print README.md
AI: *converts markdown → HTML → PDF → prints*
✓ Rendered and printed markdown file
  Printer: HP_LaserJet_4001
  Copies: 1
  Source: /path/to/README.md
```

**Auto-rendering:**
If you set `MCP_PRINTER_MARKDOWN_EXTENSIONS="md,markdown"` in your config, calling `print_file` on `.md` files will automatically render them to PDF first!

## Available Prompts

Prompts are workflow templates that appear as slash commands in your AI assistant (e.g., Cursor). They provide guided workflows for common printing tasks.

### `/print-review-package`
Print a complete code review package for offline review.

**What it does:**
- Finds all source code and documentation files in a directory
- Organizes them logically (docs first, then source files)
- Prints everything with proper syntax highlighting and formatting
- Perfect for reviewing code on paper or away from your computer

**Parameters:**
- `directory` - Directory to review (default: current directory `.`)
- `include_source` - Include source code files (default: yes)
- `include_docs` - Include documentation files (default: yes)
- `include_tests` - Include test files (default: no)
- `copies` - Number of copies to print (default: 1)

**Example:**
```
User: /print-review-package
[Form appears with defaults]
directory: .
include_source: yes
include_docs: yes
copies: 1

AI: [Finds all files, prints README.md, then all .ts files with syntax highlighting]
✓ Printed 15 files: 2 docs + 13 source files
```

**Use cases:**
- Review your entire codebase before release
- Prepare documentation for offline reading
- Create review packages for code reviews
- Print feature code for offline debugging

## Usage Examples

### Print Code with Syntax Highlighting

```
User: Print src/index.ts
AI: *automatically renders with syntax highlighting*
✓ File sent to printer: HP_LaserJet_Pro
  Rendered: code → PDF (syntax highlighted)
```

Code files are automatically rendered with:
- Syntax highlighting based on file type
- Line numbers
- Professional monospace font
- Configurable color scheme and font size

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

The server uses CUPS, which natively supports:
- ✅ PDF
- ✅ Plain text
- ✅ PostScript
- ✅ Images (JPEG, PNG via conversion)
- ✅ Markdown (rendered to PDF with `render_and_print_markdown` or via `MCP_PRINTER_MARKDOWN_EXTENSIONS`)
- ✅ **Code files** (190+ languages automatically detected and rendered with syntax highlighting)

### Auto-Rendered Code Languages

Common languages that are automatically syntax-highlighted include:
JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, Swift, Kotlin, Ruby, PHP, Scala, Shell/Bash, SQL, R, Perl, Lua, HTML, CSS, SCSS, JSON, YAML, XML, and many more.

To disable code rendering for specific extensions, use `MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS`. To disable all code rendering, set `MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS="all"`.

Other document formats may need conversion to PDF first.

## CUPS Options

Any valid CUPS/lpr options can be passed via the `options` parameter. Common examples:

- `landscape` - Print in landscape orientation
- `sides=two-sided-long-edge` - Double-sided (long edge)
- `sides=two-sided-short-edge` - Double-sided (short edge)
- `page-ranges=1-5` - Print specific pages
- `media=Letter` or `media=A4` - Paper size
- `fit-to-page` - Scale to fit page

For a complete list of available options:
- Run `lpoptions -l` in your terminal to see printer-specific options
- See the [CUPS documentation](https://www.cups.org/doc/options.html) for standard printing options
- Check `man lpr` for command-line options

## Code Color Schemes

The following syntax highlighting themes are available (set via `MCP_PRINTER_CODE_COLOR_SCHEME`):

**Light themes (good for printing):**
- `atom-one-light` (default)
- `github`
- `googlecode`
- `xcode`
- `vs`
- `stackoverflow-light`
- `ascetic`

**Dark themes:**
- `atom-one-dark`
- `monokai`
- `github-dark`
- `vs2015`
- `tomorrow-night`
- `nord`

**Other popular themes:**
- `gruvbox-light`, `gruvbox-dark`
- `solarized-light`, `solarized-dark`
- `dracula`
- `tokyo-night`

For a complete list of available themes, see the [highlight.js demo](https://highlightjs.org/static/demo/).

## Troubleshooting

### "Printer not found"
Run `lpstat -p` in terminal to see exact printer names. They often have underscores instead of spaces.

### "Permission denied"
Ensure CUPS is running: `sudo cupsctl`

### "File format not supported"
Some file formats need to be converted to PDF before printing. Export to PDF from the original application or use a conversion tool.

### "pandoc not found" or "Chrome not found"
For markdown rendering, install dependencies:
```bash
# Install pandoc
brew install pandoc

# Chrome should be auto-detected, but you can specify the path:
# Set MCP_PRINTER_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### Code not rendering with syntax highlighting
1. Ensure Chrome/Chromium is installed (required for PDF generation)
2. Check that the file extension is recognized (see [Auto-Rendered Code Languages](#auto-rendered-code-languages))
3. Verify `MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS` is not set to `"all"`
4. Try setting a different color scheme if the current one isn't working

### Code prints but with wrong colors/theme
The color scheme might not exist. Try these reliable options:
- `atom-one-light` (default)
- `github`
- `vs`
- `xcode`

### Want to disable code rendering
Set `MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS` to `"all"` to disable all code rendering, or specify extensions to exclude (e.g., `"ts,js,py"`). See [Configuration Options](#configuration-options) for details.

### Server not showing in Cursor
1. Restart Cursor after updating MCP config
2. Check Developer Tools → Console for errors
3. Verify the path to `dist/index.js` is correct

## Development

### Setup

```bash
git clone https://github.com/myunio/mcp-printer.git
cd mcp-printer
pnpm install
pnpm run build
```

### Commands

```bash
# Watch mode for development
pnpm run dev

# Build
pnpm run build

# Test locally
echo "Hello from MCP Printer Server!" > test.txt
# Then ask AI to print test.txt
```

### Running Locally in MCP

Configure your MCP client to run from your local directory:

```json
{
  "mcpServers": {
    "Printer": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-printer/dist/index.js"],
      "env": {
        "MCP_PRINTER_DEFAULT_PRINTER": "Your_Printer_Name",
        "MCP_PRINTER_ENABLE_DUPLEX": "true"
      }
    }
  }
}
```

## Requirements

- **macOS or Linux** - Uses CUPS printing system
  - macOS: CUPS is built-in
  - Linux: Install CUPS if not present (`sudo apt install cups` on Ubuntu/Debian)
  - **Windows is not currently supported** (contributions welcome!)
- **Node.js** 22+
- **Google Chrome or Chromium** - Required for rendering markdown and code to PDF (auto-detected)
- **pandoc** - Optional, only needed for markdown rendering (`brew install pandoc`)
- Printers configured in your system

## ⚠️ Security Note

**This server executes system print commands.** Only use with trusted AI assistants in secure environments.

## Contributing

Contributions welcome! Areas for improvement:
- Windows support (using Windows Print Spooler)
- More print options and formats
- Better error handling
- Testing on various Linux distributions

## License

MIT
