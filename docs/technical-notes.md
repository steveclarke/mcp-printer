# Technical Notes

This document captures implementation details, quirks, and important technical decisions for the MCP Printer project.

## Table of Contents

- [Printing Library Integration](#printing-library-integration)
- [File Rendering](#file-rendering)

---

## Printing Library Integration

### Overview

As of October 2025, the project migrated from direct CUPS command-line tools (`lpr`, `lpstat`, etc.) to the `@printers/printers` npm library for better cross-platform support and performance.

### Critical: waitForCompletion Setting

**Issue:** The `waitForCompletion` parameter in the printing library controls whether the print function waits for the file to be fully sent to CUPS before returning.

**Configuration:** Currently set to `true` (default).

**Why this matters:**
- When printing markdown or code files, the server renders them to temporary PDF files
- These temp files are cleaned up in a `finally` block after printing
- If `waitForCompletion: false`, the function returns immediately and the temp file gets deleted
- CUPS then tries to read a file that no longer exists, resulting in failed print jobs
- Plain text files work fine because they don't create temp files

**History:**
1. Initially set to `false` to match `lpr` behavior and avoid blocking
2. This caused HP LaserJet printer lockups in some cases
3. Changed back to `true` to fix the temp file cleanup race condition
4. If printer lockups occur again, consider alternative solutions:
   - Add a delay before cleanup instead of full completion wait
   - Use a background cleanup task
   - Keep temp files in a dedicated directory with periodic cleanup

**Location:** `src/adapters/printers-lib.ts` line ~172

**Related code:**
- `src/tools/print.ts` - cleanup in `finally` block
- `src/utils.ts` - `prepareFileForPrinting()` creates temp files
- `src/utils.ts` - `cleanupRenderedPdf()` deletes temp files

### Printer Name Handling

**Issue:** The `@printers/printers` library exposes two name properties:
- `name`: Display name (e.g., "HP LaserJet 4001" with spaces)
- `systemName`: CUPS internal name (e.g., "HP_LaserJet_4001" with underscores)

**Solution:** Use `systemName` when calling CUPS commands directly (like `cancel` and `lpoptions`), but use the `name` when working with the library's API.

**Location:** `src/adapters/printers-lib.ts` - various functions

---

## File Rendering

### Temporary File Management

Markdown and code files are rendered to temporary PDFs before printing using Chrome headless.

**Temp file pattern:** `/tmp/mcp-printer-XXXXXX/output.pdf`

**Cleanup strategy:** 
- Synchronous cleanup in `finally` blocks after successful print submission
- Files are deleted immediately after `printFile()` completes
- Relies on `waitForCompletion: true` to ensure CUPS has received the file first

**Future considerations:**
- Could implement async cleanup with a delay
- Could use a dedicated temp directory with TTL-based cleanup
- Could monitor CUPS job status before cleanup

---

## Notes for Contributors

When modifying printing code, keep these points in mind:

1. **Always test with rendered files** (markdown/code), not just plain text
2. **Check both job submission and actual output** - CUPS may accept jobs that fail silently
3. **Monitor temp file creation/cleanup** to catch race conditions
4. **Test with different printer types** - behavior varies between models
5. **Check CUPS logs** at `/var/log/cups/` for detailed error information

---

*Last updated: October 15, 2025*

