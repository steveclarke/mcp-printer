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
- [Security](#security)
- [Development](#development)
- [Requirements](#requirements)
- [Contributing](#contributing)

## Features

- 📄 **Print files** - PDF, text, and other formats
- 📝 **Render markdown** - Convert markdown to beautifully formatted PDFs before printing
- 💻 **Syntax-highlighted code** - Automatically render code files with syntax highlighting, line numbers, and proper formatting
- 🖨️ **List printers** - See all available printers and their status
- 📋 **Manage queue** - View and cancel print jobs
- ⚙️ **Configure** - Set default printers
- 🎯 **Smart** - Supports multiple copies, landscape, duplex, and more

## Installation

Add to your MCP configuration file (e.g., `~/.cursor/mcp.json` for Cursor):

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

That's it! The package will be automatically downloaded from npm on first use.

> **⚠️ Security:** This server allows AI assistants to print files from within allowed directories. Only use with trusted AI assistants on your local machine. The server attempts to block common sensitive directories (`.ssh`, `.aws`, etc.) by default, but this is not exhaustive. Configure additional restrictions as needed. See [Security](#security) for details.

## Configuration

All configuration is optional. Add an `env` object to customize behavior:

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_PRINTER_DEFAULT_PRINTER` | _(none)_ | Default printer to use when none specified (falls back to system default) |
| `MCP_PRINTER_ENABLE_DUPLEX` | `false` | Set to `"true"` to print double-sided by default |
| `MCP_PRINTER_DEFAULT_OPTIONS` | _(none)_ | Additional CUPS options (e.g., `"fit-to-page"`, `"landscape"`) |
| `MCP_PRINTER_CHROME_PATH` | _(auto-detected)_ | Path to Chrome/Chromium for PDF rendering (override if auto-detection fails) |
| `MCP_PRINTER_MARKDOWN_EXTENSIONS` | _(none)_ | File extensions to auto-render to PDF (e.g., `"md,markdown"`) |
| `MCP_PRINTER_ENABLE_MANAGEMENT` | `false` | Management operations are **disabled by default** for security. Set to `"true"` to enable `set_default_printer` and `cancel_print_job` |
| `MCP_PRINTER_ALLOWED_PATHS` | _(home directory)_ | Colon-separated paths allowed for printing. **Merged with** home directory default (e.g., `"/mnt/shared:/opt/documents"`) |
| `MCP_PRINTER_DENIED_PATHS` | _(sensitive dirs)_ | Colon-separated paths denied for printing. **Merged with** defaults like `.ssh`, `.aws`, etc. (e.g., `"/home/user/private"`) |
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
      "command": "npx",
      "args": ["-y", "mcp-printer"],
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
MCP_PRINTER_ENABLE_MANAGEMENT: false
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
- `line_numbers` (optional) - Show line numbers when rendering code files (boolean, overrides global setting)
- `color_scheme` (optional) - Syntax highlighting theme for code files (e.g., `github`, `monokai`, `atom-one-light`)
- `font_size` (optional) - Font size for code files (e.g., `8pt`, `10pt`, `12pt`)
- `line_spacing` (optional) - Line spacing for code files (e.g., `1`, `1.5`, `2`)

**Note:** The code rendering parameters (`line_numbers`, `color_scheme`, `font_size`, `line_spacing`) only apply when printing code files that are automatically rendered to PDF with syntax highlighting.

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
Get the system's default printer (not the MCP_PRINTER_DEFAULT_PRINTER config setting).

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
- ✅ **Code files** (common languages automatically detected and rendered with syntax highlighting via highlight.js)

### Auto-Rendered Code Languages

Common languages that are automatically syntax-highlighted include:
JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, Swift, Kotlin, Ruby, PHP, Scala, Shell/Bash, SQL, R, Perl, Lua, HTML, CSS, SCSS, JSON, YAML, XML, and many more.

To disable code rendering for specific extensions, use `MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS`. To disable all code rendering, set `MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS="all"`.

### Code Color Schemes

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
3. Verify `MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS` is not set to `"all"` or does not include your file's extension
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

## Security

MCP Printer includes multiple security protections to prevent unauthorized file access and system modifications:

### File Access Control

By default, the server only allows printing files within your home directory and blocks access to well-known sensitive subdirectories:

**Default Allowed:**
- All files under your home directory (`~`)

**Default Blocked:**
- `~/.ssh` (SSH keys)
- `~/.gnupg` (GPG keys)
- `~/.aws` (AWS credentials)
- `~/.config/gcloud` (Google Cloud credentials)
- Any files named `.env*` (environment variables)
- System directories: `/etc`, `/var`, `/root`, `/sys`, `/proc`, `/private/etc`, `/private/var`

### Custom Security Configuration

You can add custom allowed or denied paths using environment variables. Your custom paths are **merged with** the defaults (not replaced), so you never lose the built-in protections.

**Example:**
```json
"env": {
  "MCP_PRINTER_ALLOWED_PATHS": "/mnt/shared:/opt/documents",
  "MCP_PRINTER_DENIED_PATHS": "/home/user/private:/home/user/secrets"
}
```

Use colon (`:`) to separate multiple paths, just like the Unix `PATH` variable.

**Note:** Your custom paths are merged with the built-in defaults, so the default protections (home directory access and blocked sensitive directories) remain active.

### Management Operations

Management operations (`set_default_printer` and `cancel_print_job`) are **disabled by default** for security. These operations can affect other users' print jobs and system settings.

To enable them, set the environment variable:
```json
{
  "mcpServers": {
    "Printer": {
      "command": "npx",
      "args": ["-y", "mcp-printer"],
      "env": {
        "MCP_PRINTER_ENABLE_MANAGEMENT": "true"
      }
    }
  }
}
```

**Note:** Only enable management operations if you understand the implications, as they can affect system-wide printer settings and other users' print jobs.

### Other Security Features

- **Secure temporary files:** All temporary files are created in randomly-named directories to prevent race conditions and symlink attacks
- **HTML injection protection:** File paths are properly escaped when rendered to prevent script injection
- **Symlink protection:** File paths are resolved to their real paths before validation to prevent bypassing security checks

## Development

### Setup

```bash
git clone https://github.com/steveclarke/mcp-printer.git
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

Configure your MCP client to run from your local development directory:

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

### Alternative Installation Methods

If you prefer not to use the `npx` approach in your MCP config, you can install the package globally first:

```bash
# npm
npm install -g mcp-printer

# pnpm
pnpm add -g mcp-printer

# yarn
yarn global add mcp-printer
```

Then reference it directly in your MCP config (without npx):
```json
{
  "mcpServers": {
    "Printer": {
      "command": "mcp-printer"
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

## Contributing

Contributions welcome! Areas for improvement:
- Windows support (using Windows Print Spooler)
- More print options and formats
- Better error handling
- Testing on various Linux distributions

## License

MIT
