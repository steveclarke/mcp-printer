# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- **BREAKING:** Replaced `print-code-review` prompt with simpler `print-changed` prompt
- New `print-changed` prompt focuses on batch printing changed files (staged, uncommitted, branch)
- Removed complex code review document generation from prompts (stayed printer-focused)

### Added
- `code-review-prompt.md` - sophisticated code review prompt saved for personal use outside MCP printer

## [1.3.0] - 2025-10-15

### Added
- Shebang detection for automatic code file identification
- Files without standard extensions that contain shebangs (`#!/bin/bash`, `#!/usr/bin/env python`, etc.) are now automatically rendered with syntax highlighting
- Support for all line ending types: Unix (`\n`), Windows (`\r\n`), and old Mac (`\r`)
- Four new test fixture files for shebang detection testing

### Enhanced
- `shouldRenderCode()` now checks for shebangs in the first 1024 bytes of files with unknown extensions
- Code rendering now works seamlessly with shell scripts, Python scripts, and other executables without file extensions

## [1.2.0] - 2025-10-14

### Added
- New `get_page_meta` tool to get page count and metadata before printing
- Page count confirmation prompt when print jobs exceed configurable threshold
- `MCP_PRINTER_CONFIRM_IF_OVER_PAGES` environment variable (default: 10 physical sheets)

### Fixed
- Markdown PDF footer layout regression where filename and page numbers were misaligned
- Footer font now matches GitHub's markdown rendering font stack for consistent typography

## [1.1.0] - 2025-10-13

### Added
- New `MCP_PRINTER_ENABLE_PROMPTS` environment variable to enable/disable prompt registration
- Prompts can now be disabled by setting `MCP_PRINTER_ENABLE_PROMPTS=false` in configuration
- Prompts are enabled by default

### Changed
- Updated `get_config` tool to display `MCP_PRINTER_ENABLE_PROMPTS` status

## [1.0.0] - 2025-10-13

### Added
- Initial release of MCP Printer
- Print files directly from AI conversations via MCP protocol
- Beautiful markdown rendering with Mermaid diagram support
- Syntax-highlighted code printing for multiple languages
- Print queue management tools
- Printer configuration and management
- Security features with path restrictions and dotfile blocking
- Support for macOS and Linux (CUPS)
- Configuration via environment variables
- Tools: `print_file`, `list_printers`, `get_default_printer`, `set_default_printer`, `get_print_queue`, `cancel_print_job`, `get_config`
- Automatic duplex printing support
- Code rendering with configurable syntax highlighting, line numbers, and color schemes
- Markdown rendering with GitHub-style formatting

### Documentation
- Comprehensive README with setup instructions
- Configuration guide with all environment variables
- Security documentation
- MIT License

[1.0.0]: https://github.com/steveclarke/mcp-printer/releases/tag/v1.0.0

