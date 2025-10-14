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
- [CUPS Options](#cups-options)
- [Supported File Types](#supported-file-types)
- [Code Rendering](#code-rendering)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Development](#development)
- [Requirements](#requirements)
- [Contributing](#contributing)

## Features

- 📄 **Print files** - PDF, text, and other formats
- 📝 **Render markdown** - Convert markdown to beautifully formatted PDFs
- 📊 **Mermaid diagrams** - Flowcharts, sequence diagrams, and more render as visual graphics in markdown
- 💻 **Syntax-highlighted code** - Automatically render code files with syntax highlighting, line numbers, and proper formatting
- 🔍 **Page count preview** - Check how many pages a document will print before sending to printer (prevents accidental 200-page printouts!)
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

> **🖥️ Platform Support:** This server currently supports **macOS and Linux only**. Windows is not currently supported (contributions welcome!).

> **📋 Requirements:** Google Chrome or Chromium is required for rendering markdown and code files to PDF. The server will auto-detect Chrome/Chromium installations on macOS/Linux. See [Requirements](#requirements) for details.

> **⚠️ Security:** This server allows AI assistants to print files from allowed directories (`~/Documents`, `~/Downloads`, `~/Desktop` by default, customizable via `MCP_PRINTER_ALLOWED_PATHS`). Dotfiles and hidden directories are always blocked. Only use with trusted AI assistants on your local machine. See [Security](#security) for configuration options.

## Configuration

All configuration is optional. Add an `env` object to customize behavior:

| Variable                               | Default                                   | Description                                                                                                                                                        |
| -------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MCP_PRINTER_DEFAULT_PRINTER`          | _(none)_                                  | Default printer to use when none specified (falls back to system default)                                                                                          |
| `MCP_PRINTER_AUTO_DUPLEX`              | `false`                                   | Set to `"true"` to automatically print double-sided by default (can be overridden per-call)                                                                        |
| `MCP_PRINTER_DEFAULT_OPTIONS`          | _(none)_                                  | Additional CUPS options (e.g., `"fit-to-page"`, `"landscape"`)                                                                                                     |
| `MCP_PRINTER_CHROME_PATH`              | _(auto-detected)_                         | Path to Chrome/Chromium for PDF rendering (override if auto-detection fails)                                                                                       |
| `MCP_PRINTER_AUTO_RENDER_MARKDOWN`     | `true`                                    | Automatically render markdown files (`.md`, `.markdown`) to PDF (can be overridden with `force_markdown_render`)                                                   |
| `MCP_PRINTER_AUTO_RENDER_CODE`         | `true`                                    | Automatically render code files to PDF with syntax highlighting (can be overridden with `force_code_render`)                                                       |
| `MCP_PRINTER_ENABLE_MANAGEMENT`        | `false`                                   | Management operations are **disabled by default** for security. Set to `"true"` to enable `set_default_printer` and `cancel_print_job` tools                       |
| `MCP_PRINTER_ENABLE_PROMPTS`           | `true`                                    | Enable prompts (workflow templates). Set to `"false"` to disable prompt registration if you don't want prompts in your MCP client                                  |
| `MCP_PRINTER_ALLOWED_PATHS`            | `~/Documents`, `~/Downloads`, `~/Desktop` | Colon-separated paths allowed for printing. **Overrides** default allowed directories when set (e.g., `"$HOME/Documents:$HOME/src"`)                               |
| `MCP_PRINTER_DENIED_PATHS`             | _(system dirs)_                           | Colon-separated paths denied for printing. **Merged with** system directory defaults like `/etc`, `/var`, etc. (e.g., `"/home/user/private"`)                      |
| `MCP_PRINTER_FALLBACK_ON_RENDER_ERROR` | `false`                                   | Set to `"true"` to print original file if PDF rendering fails (markdown/code). When false, errors will be thrown instead                                           |
| `MCP_PRINTER_MAX_COPIES`               | `10`                                      | Maximum copies allowed per print job (set to `0` for unlimited)                                                                                                    |
| `MCP_PRINTER_CONFIRM_IF_OVER_PAGES`    | `10`                                      | If set > 0, print jobs exceeding this many physical sheets will trigger a confirmation prompt from the AI before printing. Set to `0` to disable. (PDF files only) |
| `MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS`  | _(none)_                                  | Extensions to exclude from code rendering (e.g., `"json,yaml,html"`) - only applies when code rendering is enabled                                                 |
| `MCP_PRINTER_CODE_COLOR_SCHEME`        | `"atom-one-light"`                        | Syntax highlighting color scheme (see [Available Themes](#code-color-schemes))                                                                                     |
| `MCP_PRINTER_CODE_AUTO_LINE_NUMBERS`   | `true`                                    | Automatically show line numbers in code printouts (can be overridden per-call with the `line_numbers` parameter)                                                   |
| `MCP_PRINTER_CODE_FONT_SIZE`           | `"10pt"`                                  | Font size for code (e.g., `"8pt"`, `"12pt"`)                                                                                                                       |
| `MCP_PRINTER_CODE_LINE_SPACING`        | `"1.5"`                                   | Line spacing multiplier for code (e.g., `"1"`, `"1.5"`, `"2"`)                                                                                                     |

**Example configuration:**
```json
{
  "mcpServers": {
    "Printer": {
      "command": "npx",
      "args": ["-y", "mcp-printer"],
      "env": {
        "MCP_PRINTER_DEFAULT_PRINTER": "HP_LaserJet_Pro",
        "MCP_PRINTER_AUTO_DUPLEX": "true",
        "MCP_PRINTER_DEFAULT_OPTIONS": "fit-to-page",
        "MCP_PRINTER_AUTO_RENDER_MARKDOWN": "true",
        "MCP_PRINTER_AUTO_RENDER_CODE": "true",
        "MCP_PRINTER_ENABLE_PROMPTS": "true",
        "MCP_PRINTER_CODE_COLOR_SCHEME": "github",
        "MCP_PRINTER_CODE_FONT_SIZE": "9pt",
        "MCP_PRINTER_ALLOWED_PATHS": "/Users/myname/Documents:/Users/myname/Downloads:/Users/myname/projects"
      }
    }
  }
}
```

💡 **Note:** The `MCP_PRINTER_ALLOWED_PATHS` example above **replaces** the default allowed directories. If you set this variable, you must explicitly include any default directories you want to keep (like Documents, Downloads, Desktop) plus any additional directories like your projects folder. Use colon-separated absolute paths (`:`).

💡 **Tip:** You can use the `list_printers` tool to see all available printers and their exact names.

User-specified options in prompts always override these defaults.

## Available Tools

### `get_config`
Get the current MCP Printer configuration settings. Only returns non-sensitive configuration values.

**Example:**
```
User: What are my printer settings?
AI: Current MCP Printer Configuration:

MCP_PRINTER_DEFAULT_PRINTER: HP_LaserJet_4001
MCP_PRINTER_AUTO_DUPLEX: true
MCP_PRINTER_DEFAULT_OPTIONS: (not set)
MCP_PRINTER_CHROME_PATH: (auto-detected)
MCP_PRINTER_AUTO_RENDER_MARKDOWN: true
MCP_PRINTER_AUTO_RENDER_CODE: true
MCP_PRINTER_ENABLE_MANAGEMENT: false
MCP_PRINTER_ENABLE_PROMPTS: true
```

### `list_printers`
List all available printers with their status.

**Example:**
```
User: What printers do I have available?
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
- `skip_confirmation` (optional) - Skip page count confirmation check (bypasses `MCP_PRINTER_CONFIRM_IF_OVER_PAGES` threshold)
- `line_numbers` (optional) - Show line numbers when rendering code files (boolean, overrides global setting)
- `color_scheme` (optional) - Syntax highlighting theme for code files (e.g., `github`, `monokai`, `atom-one-light`)
- `font_size` (optional) - Font size for code files (e.g., `8pt`, `10pt`, `12pt`)
- `line_spacing` (optional) - Line spacing for code files (e.g., `1`, `1.5`, `2`)
- `force_markdown_render` (optional) - Force markdown rendering to PDF (boolean: `true`=always render, `false`=never render, `undefined`=use config)
- `force_code_render` (optional) - Force code rendering to PDF with syntax highlighting (boolean: `true`=always render, `false`=never render, `undefined`=use config)

**Note:** The code rendering parameters (`line_numbers`, `color_scheme`, `font_size`, `line_spacing`) only apply when printing code files that are automatically rendered to PDF with syntax highlighting.

**Page Count Confirmation:** By default, print jobs exceeding 10 physical sheets will trigger a confirmation prompt from the AI before printing. You can adjust this threshold with `MCP_PRINTER_CONFIRM_IF_OVER_PAGES` or set it to `0` to disable. If you confirm, the AI will automatically retry the print with the confirmation bypassed. This feature only works for PDF files (including auto-rendered markdown and code files).

**Example:**
```
User: Print README.md to my HP LaserJet, 2 copies
AI: *prints file*
✓ File sent to printer: HP_LaserJet_4001
  Copies: 2
  File: /path/to/README.md
```

### `preview_print_job`
Preview how many pages a file would print without actually printing. This tool pre-renders files (markdown, code) if needed and returns page count and physical sheet information.

**Parameters:**
- `file_path` (required) - Full path to file
- `options` (optional) - CUPS options for duplex detection (e.g., `sides=two-sided-long-edge`)
- `line_numbers` (optional) - Show line numbers when rendering code files (boolean, overrides global setting)
- `color_scheme` (optional) - Syntax highlighting theme for code files
- `font_size` (optional) - Font size for code files (e.g., `8pt`, `10pt`, `12pt`)
- `line_spacing` (optional) - Line spacing for code files (e.g., `1`, `1.5`, `2`)
- `force_markdown_render` (optional) - Force markdown rendering to PDF
- `force_code_render` (optional) - Force code rendering to PDF with syntax highlighting

**Note:** Page counting only works for PDF files, including:
- Markdown files (auto-rendered to PDF)
- Code files with syntax highlighting (auto-rendered to PDF)  
- Existing PDF files

Plain text files, images, and other non-PDF formats cannot be previewed and will print immediately without page count information.

**Example:**
```
User: How many pages would README.md be?
AI: *previews file*
📄 Preview: 32 pages (16 sheets, duplex)
  File: /path/to/README.md
  Rendered: markdown → PDF
```

**Use cases:**
- Check page count before printing large documents
- Estimate paper usage for duplex vs single-sided printing
- Preview rendered output of markdown or code files

### `get_print_queue`
Check the print queue for pending jobs.

**Parameters:**
- `printer` (optional) - Specific printer to check

**Example:**
```
User: What's in my print queue?
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
User: What's my default printer?
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

### Print Documentation

```
User: Print all the markdown files in docs/
AI: Let me do that for you...
*prints setup.md (rendered to PDF)*
*prints guide.md (rendered to PDF)*
*prints reference.md (rendered to PDF)*
✓ Printed 3 files to HP_LaserJet_Pro
```

### Force Rendering

```
User: Print this .ts file without syntax highlighting
AI: *prints with force_code_render=false*
✓ File sent as plain text

User: Print this README.md with formatting even though I don't have auto-render enabled
AI: *prints with force_markdown_render=true*
✓ Rendered markdown → PDF
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

### Page Count Preview and Confirmation

```
User: How many pages would this markdown file be?
AI: *previews file*
📄 Preview: 32 pages (16 sheets, duplex)
  File: /path/to/document.md
  Rendered: markdown → PDF

# With MCP_PRINTER_CONFIRM_IF_OVER_PAGES=10 set:
User: Print document.md
AI: *checks page count before printing*
📄 Preview: This document will print 32 pages (16 sheets, duplex)
  File: /path/to/document.md
  Rendered: markdown → PDF

⚠️  This exceeds the configured page threshold.
This is a large document. Are you sure you want to print 32 pages?

User: Yes, print it
AI: *automatically retries print with confirmation bypassed*
✓ File sent to printer: HP_LaserJet_4001
  File: /path/to/document.md
  Rendered: markdown → PDF
```

## CUPS Options

Any valid CUPS/lpr options can be passed via the `options` parameter. Common examples:

- `landscape` - Print in landscape orientation
- `sides=two-sided-long-edge` - Double-sided (long edge)
- `sides=two-sided-short-edge` - Double-sided (short edge)
- `page-ranges=1-5` - Print specific pages (e.g., `page-ranges=3-5,7,10-12`)
- `media=Letter` or `media=A4` - Paper size
- `fit-to-page` - Scale to fit page
- `number-up=2` - Print multiple pages per sheet

**Natural Language Requests:** Thanks to the flexibility of the underlying CUPS printing system and the AI's knowledge of print options, you don't need to memorize these options. Simply ask naturally—*"print pages 3 to 5 in landscape on letter size paper"* or *"print this double-sided"*—and the AI will translate your request into the appropriate CUPS options automatically. Feel free to experiment with common printing scenarios; the AI is smart enough to figure out what you need.

For a complete list of available options:
- Run `lpoptions -l` in your terminal to see printer-specific options
- See the [CUPS documentation](https://www.cups.org/doc/options.html) for standard printing options
- Check `man lpr` for command-line options

## Supported File Types

The server uses CUPS, which supports:
- ✅ PDF
- ✅ Plain text
- ✅ Images (JPEG, PNG)
- ✅ Markdown
- ✅ Code files (see [Code Rendering](#code-rendering) for details)
- ⚠️ PostScript (printer-dependent - some printers may not support it)

Other document formats may need conversion to PDF first.

## Markdown Rendering

Markdown files are rendered to beautifully formatted PDFs using [crossnote](https://github.com/shd101wyy/crossnote).

### Features

- ✨ **Beautiful styling** - Clean, modern GitHub-style theme optimized for printing
- 🔢 **Automatic page numbers** - Every page shows "Page X / Y" at the bottom
- 📊 **Mermaid diagrams** - Flowcharts, sequence diagrams, class diagrams render as visual graphics
- 🎨 **Syntax highlighting** - Code blocks within markdown are beautifully highlighted
- ➕ **Math rendering** - KaTeX support for mathematical expressions
- 📐 **Tables & formatting** - Table styling, blockquotes, and all standard markdown features

### Diagram Support

Markdown rendering includes support for:
- **Mermaid** - Flowcharts, sequence diagrams, class diagrams, state diagrams, etc.
- **WaveDrom** - Digital timing diagrams  
- **GraphViz** - Graph visualizations
- **Vega & Vega-Lite** - Data visualizations

All diagrams render as visual graphics in the PDF output, not code blocks.

### Configuration

- To enable/disable markdown rendering: Set `MCP_PRINTER_AUTO_RENDER_MARKDOWN` to `"true"` or `"false"` (default: true)
- To force rendering on a per-call basis: Use the `force_markdown_render` parameter in `print_file`

### Custom Page Numbering

Page numbers are automatically added to the footer of every rendered markdown PDF. If you want to customize or disable page numbering for a specific file, you can add YAML front-matter:

```markdown
---
chrome:
  displayHeaderFooter: false
---

# Your Document

Content without page numbers...
```

Or customize the footer template:

```markdown
---
chrome:
  displayHeaderFooter: true
  footerTemplate: '<div style="font-size:10px; text-align:right; width:100%; padding-right:1cm; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Page <span class="pageNumber"></span></div>'
---

# Your Document

Content with custom page numbers...
```

## Code Rendering

Code files are automatically rendered to PDF with syntax highlighting, line numbers, and proper formatting for optimal printing quality.

### Supported Languages

The system uses a **strict whitelist approach** - only files with recognized extensions are automatically rendered as code. This prevents false positives on plain text files like LICENSE or README.

**Programming Languages:**
JavaScript (`.js`, `.jsx`), TypeScript (`.ts`, `.tsx`), Python (`.py`), Java (`.java`), C (`.c`, `.h`), C++ (`.cpp`, `.cc`, `.cxx`, `.hpp`), C# (`.cs`), Go (`.go`), Rust (`.rs`), Swift (`.swift`), Kotlin (`.kt`), Ruby (`.rb`), PHP (`.php`), Scala (`.scala`), Perl (`.pl`, `.perl`), Lua (`.lua`), R (`.r`)

**Shell/Scripts:**
Bash/Shell (`.sh`, `.bash`, `.zsh`, `.fish`), PowerShell (`.ps1`), Vim (`.vim`)

**Markup/Data:**
HTML (`.html`), CSS (`.css`), SCSS (`.scss`), Sass (`.sass` - uses SCSS highlighting), Less (`.less`), JSON (`.json`), YAML (`.yaml`, `.yml`), XML (`.xml`), Markdown (`.md`), SQL (`.sql`)

**Special Files (no extension):**
`Makefile`, `Dockerfile`, `Gemfile`, `Rakefile`, `Vagrantfile`

**Unknown Extensions:**
Files with unknown extensions (like `.txt`, `.bak`, `.weird`) will NOT be automatically rendered. To render these files with syntax highlighting, the AI can use the `force_code_render=true` parameter in the `print_file` tool call.

**Configuration:**
- To enable/disable automatic code rendering: Set `MCP_PRINTER_AUTO_RENDER_CODE` to `"true"` or `"false"` (default: true)
- To disable automatic code rendering for specific extensions: `MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS="json,yaml,html"`
- To force code rendering for a specific file: Use the `force_code_render` parameter in `print_file`

### Color Schemes

The following light themes are recommended for printing (set via `MCP_PRINTER_CODE_COLOR_SCHEME`):

- `atom-one-light` (default)
- `github`
- `googlecode`
- `xcode`
- `vs`
- `stackoverflow-light`
- `gruvbox-light`
- `solarized-light`

## Troubleshooting

### "Printer not found"
Run `lpstat -p` in terminal to see exact printer names. They often have underscores instead of spaces.

### "Permission denied"
Ensure CUPS is running: `sudo cupsctl`

### "File format not supported"
Some file formats need to be converted to PDF before printing. Export to PDF from the original application or use a conversion tool.

### "Chrome not found"
Chrome/Chromium is required for PDF rendering (markdown and code files). It should be auto-detected, but you can specify the path:
```json
{
  "env": {
    "MCP_PRINTER_CHROME_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  }
}
```

### Code not rendering with syntax highlighting
1. Ensure Chrome/Chromium is installed (required for PDF generation)
2. Verify `MCP_PRINTER_AUTO_RENDER_CODE` is set to `"true"` (it's enabled by default)
3. Check that the file extension is recognized (see [Code Rendering](#code-rendering))
4. Verify `MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS` does not include your file's extension
5. Try setting a different color scheme if the current one isn't working

### Code prints but with wrong colors/theme
The color scheme might not exist. Try these reliable options:
- `atom-one-light` (default)
- `github`
- `vs`
- `xcode`

## Security

MCP Printer includes multiple security protections to prevent unauthorized file access and system modifications:

### File Access Control

The server uses a secure-by-default approach with multiple layers of protection:

#### Default Allowed Directories

By default, printing is only allowed from these directories:
- `~/Documents`
- `~/Downloads`
- `~/Desktop`

This default configuration covers common use cases while being restrictive. You can configure additional directories as needed.

#### Universal Dotfile/Dotdir Blocking

**All dotfiles and hidden directories are blocked** from printing, with no way to override. This prevents access to:
- `~/.ssh` (SSH keys)
- `~/.gnupg` (GPG keys)
- `~/.aws` (AWS credentials)
- `~/.config` (application configurations)
- `.env` files (environment variables)
- Any file or directory starting with `.` (except `.` and `..`)

This rule applies even if the path is within an allowed directory or specified via symlink. For example:
- ❌ `~/Documents/.secrets.txt` (blocked - dotfile)
- ❌ `~/Documents/link` → `~/.ssh/id_rsa` (blocked - resolves to dotfile)
- ✅ `~/Documents/report.pdf` (allowed)

#### System Directory Protection

Common system directories are always blocked regardless of configuration, including:
- `/etc`, `/var`, `/root`, `/sys`, `/proc`, `/bin`, `/boot`, `/tmp`, and more
- `/System`, `/Library`, `/private/etc`, `/private/var` (macOS)

### Custom Security Configuration

You can configure additional allowed paths for specific workflows using environment variables.

**Important:** When you set `MCP_PRINTER_ALLOWED_PATHS`, it **completely overrides** the default allowed directories. You must re-specify them if you want to keep them.

**Environment Variable Expansion:**

The `MCP_PRINTER_ALLOWED_PATHS` and `MCP_PRINTER_DENIED_PATHS` variables support environment variable expansion:
- `~`, `$HOME`, or `${HOME}` expand to your home directory

**Examples:**

```json
// Developer workflow - allow printing from source code directory
"env": {
  "MCP_PRINTER_ALLOWED_PATHS": "$HOME/Documents:$HOME/Downloads:$HOME/Desktop:$HOME/src"
}
```

```json
// Shared workspace - print from external mount
"env": {
  "MCP_PRINTER_ALLOWED_PATHS": "$HOME/Documents:$HOME/Downloads:/mnt/shared"
}
```

Use colon (`:`) to separate multiple paths, just like the Unix `PATH` variable.

**Additional denied paths** can be specified and will be merged with system directory defaults:
```json
"env": {
  "MCP_PRINTER_DENIED_PATHS": "/home/user/private:/home/user/secrets"
}
```

### Management Operations

Management operations (`set_default_printer` and `cancel_print_job`) are **disabled by default**.

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

### Testing Markdown Rendering

The repository includes reference documents for testing markdown rendering:

**Quick test (1 page):**
```bash
# Print markdown-test-short.md
# Fast iteration during development
# Tests: formatting, code blocks, Mermaid, tables, math, page numbers
```

**Comprehensive test (2-3 pages):**
```bash
# Print markdown-reference.md
# Full feature verification
# Tests: all text formatting, multiple diagram types, complex code blocks,
#        blockquotes, nested lists, emoji, math equations, page numbering
```

Use these files to verify markdown rendering quality after making changes to the rendering pipeline.

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
        "MCP_PRINTER_AUTO_DUPLEX": "true"
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
- **Google Chrome or Chromium** - Required for both code and markdown PDF rendering (auto-detected)
  - Both Chrome and Chromium work equally well (same browser engine)
  - Auto-detection searches for: Chrome, Chromium, chromium-browser (Linux), Chrome Canary
  - Linux users: `chromium` or `chromium-browser` are fully supported
  - You can specify a custom path by setting `MCP_PRINTER_CHROME_PATH`
- Printers configured in your system

## Contributing

Contributions welcome! Areas for improvement:
- Windows support (using Windows Print Spooler)
- More print options

## License

MIT
