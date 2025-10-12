/**
 * @fileoverview General utility functions for command execution, dependency checking,
 * file type detection, and print job handling for the MCP Printer server.
 */

import { execa } from "execa";
import { access } from "fs/promises";
import { constants } from "fs";
import { writeFileSync, mkdtempSync, unlinkSync } from "fs";
import { basename, join } from "path";
import { tmpdir } from "os";
import { config, MARKDOWN_EXTENSIONS } from "./config.js";

/**
 * Parse a delimited string into an array of strings.
 * Automatically trims whitespace and filters out empty strings.
 * 
 * @param value - String to parse (can be undefined)
 * @param delimiter - Delimiter to split on (string or regex)
 * @param transform - Optional transform function to apply to each item (e.g., toLowerCase)
 * @returns Array of parsed strings, or empty array if value is undefined
 * 
 * @example
 * parseDelimitedString('foo:bar:baz', ':') // ['foo', 'bar', 'baz']
 * parseDelimitedString('Foo, Bar, Baz', ',', s => s.toLowerCase()) // ['foo', 'bar', 'baz']
 * parseDelimitedString('opt1 opt2  opt3', /\s+/) // ['opt1', 'opt2', 'opt3']
 */
export function parseDelimitedString(
  value: string | undefined,
  delimiter: string | RegExp,
  transform?: (item: string) => string
): string[] {
  if (!value) {
    return [];
  }
  
  return value
    .split(delimiter)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => transform ? transform(item) : item);
}

/**
 * Executes a command safely without spawning a shell.
 * 
 * @param command - The command binary to execute
 * @param args - Array of arguments to pass to the command
 * @returns The trimmed stdout output from the command
 * @throws {Error} If the command fails or returns an error
 */
export async function execCommand(command: string, args: string[] = []): Promise<string> {
  try {
    const { stdout } = await execa(command, args);
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

/**
 * Checks if a file exists at the given path.
 * 
 * @param filePath - Path to check
 * @returns True if file exists and is accessible, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a command-line tool is available in the system PATH.
 * 
 * @param command - The command to check (e.g., "pandoc")
 * @param name - Human-readable name for error messages
 * @throws {Error} If the command is not found, with installation instructions
 */
export async function checkDependency(command: string, name: string): Promise<void> {
  try {
    await execCommand('which', [command]);
  } catch {
    throw new Error(`${name} not found. Install with: brew install ${command}`);
  }
}

/**
 * Locates a Chrome or Chromium installation on the system.
 * First checks the MCP_PRINTER_CHROME_PATH environment variable,
 * then searches common macOS and Linux installation paths.
 * 
 * @returns Path to Chrome/Chromium executable
 * @throws {Error} If Chrome is not found
 */
export async function findChrome(): Promise<string> {
  // Check environment variable first
  if (config.chromePath) {
    if (await fileExists(config.chromePath)) {
      return config.chromePath;
    }
    // If specified path doesn't exist, continue to auto-detection
  }

  // Check macOS paths
  if (process.platform === "darwin") {
    const macPaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    ];

    for (const path of macPaths) {
      if (await fileExists(path)) {
        return path;
      }
    }
  }

  // Check Linux paths
  if (process.platform === "linux") {
    const linuxCommands = ["google-chrome", "chromium", "chromium-browser"];
    for (const cmd of linuxCommands) {
      try {
        const path = await execCommand('which', [cmd]);
        if (path) return path;
      } catch {
        // Continue to next command
      }
    }
  }

  throw new Error("Chrome not found. Install Google Chrome or set MCP_PRINTER_CHROME_PATH environment variable.");
}

/**
 * Converts HTML content to PDF using Chrome headless.
 * Handles Chrome detection, temp file creation, execution, error handling, and cleanup.
 * 
 * @param htmlContent - HTML content to convert to PDF
 * @param options - Optional configuration
 * @param options.chromeFlags - Additional Chrome flags (e.g., ['--disable-javascript'])
 * @param options.tempDirPrefix - Prefix for temp directory name (default: 'mcp-printer-')
 * @returns Path to the generated temporary PDF file
 * @throws {Error} If Chrome is not found or PDF generation fails
 */
export async function convertHtmlToPdf(
  htmlContent: string,
  options: { chromeFlags?: string[]; tempDirPrefix?: string } = {}
): Promise<string> {
  const { chromeFlags = [], tempDirPrefix = 'mcp-printer-' } = options;
  
  // Find Chrome/Chromium executable
  const chromePath = await findChrome();
  
  // Create secure temp directory
  const tmpDir = mkdtempSync(join(tmpdir(), tempDirPrefix));
  const tmpHtml = join(tmpDir, 'input.html');
  const tmpPdf = join(tmpDir, 'output.pdf');
  
  try {
    // Write HTML to temp file
    writeFileSync(tmpHtml, htmlContent, 'utf-8');
    
    // Convert HTML to PDF with Chrome headless
    try {
      await execa(chromePath, [
        '--headless',
        '--disable-gpu',
        ...chromeFlags,
        `--print-to-pdf=${tmpPdf}`,
        tmpHtml
      ]);
    } catch (error: any) {
      // Chrome outputs success messages to stderr, check if PDF was actually created
      if (!error.stderr || !error.stderr.includes('written to file')) {
        throw new Error(`Failed to render PDF: ${error.message}`);
      }
      // Success - Chrome wrote the PDF and reported to stderr
    }
    
    // Clean up HTML file
    try {
      unlinkSync(tmpHtml);
    } catch {
      // Ignore cleanup errors
    }

    return tmpPdf;
  } catch (error) {
    // Clean up temp files on error
    try {
      unlinkSync(tmpHtml);
    } catch {}
    try {
      unlinkSync(tmpPdf);
    } catch {}
    throw error;
  }
}

/**
 * Determines if a file should be automatically rendered to PDF before printing.
 * Checks autoRenderMarkdown setting and standard markdown extensions (.md, .markdown).
 * 
 * @param filePath - Path to the file to check
 * @returns True if the file should be rendered to PDF, false otherwise
 */
export function shouldRenderToPdf(filePath: string): boolean {
  if (!config.autoRenderMarkdown) {
    return false;
  }
  const ext = filePath.split('.').pop()?.toLowerCase() || "";
  return MARKDOWN_EXTENSIONS.includes(ext as any);
}

/**
 * Execute a print job with the given file and options.
 * Handles copy validation, lpr argument building, and execution.
 * 
 * @param filePath - Path to the file to print
 * @param printer - Optional printer name
 * @param copies - Number of copies to print
 * @param options - Optional CUPS options string
 * @returns Object with printer name and formatted options
 */
export async function executePrintJob(
  filePath: string,
  printer?: string,
  copies: number = 1,
  options?: string
): Promise<{ printerName: string; allOptions: string[] }> {
  // Validate copy count against configured maximum
  if (config.maxCopies > 0 && copies > config.maxCopies) {
    throw new Error(
      `Copy count (${copies}) exceeds maximum allowed (${config.maxCopies}). ` +
      `Set MCP_PRINTER_MAX_COPIES environment variable to increase or use 0 for unlimited.`
    );
  }

  const args: string[] = [];
  
  // Use configured default printer if none specified
  const targetPrinter = printer || config.defaultPrinter;
  if (targetPrinter) {
    args.push('-P', targetPrinter);
  }
  
  if (copies > 1) {
    args.push(`-#${copies}`);
  }
  
  // Build options with defaults
  let allOptions = [];
  
  // Add default duplex if auto-enabled in config and not already specified
  if (config.autoDuplex && !options?.includes("sides=")) {
    allOptions.push("sides=two-sided-long-edge");
  }
  
  // Add default options if configured
  if (config.defaultOptions.length > 0) {
    allOptions.push(...config.defaultOptions);
  }
  
  // Add user-specified options (these override defaults, split by spaces)
  if (options) {
    allOptions.push(...options.split(/\s+/));
  }
  
  // Add each option with -o flag
  for (const option of allOptions) {
    args.push('-o', option);
  }
  
  // Add file path
  args.push(filePath);

  await execa('lpr', args);
  
  // Determine the printer name used
  const printerName = targetPrinter || (await execCommand('lpstat', ['-d'])).split(": ")[1] || "default";
  
  return { printerName, allOptions };
}

/**
 * Format a print job response message.
 * 
 * @param printerName - Name of the printer used
 * @param copies - Number of copies printed
 * @param allOptions - Array of print options used
 * @param sourceFile - Original file path to display
 * @param renderType - Optional rendering description (e.g., "markdown → PDF")
 * @returns Formatted MCP response object
 */
export function formatPrintResponse(
  printerName: string,
  copies: number,
  allOptions: string[],
  sourceFile: string,
  renderType?: string
) {
  let optionsInfo = "";
  if (allOptions.length > 0) {
    optionsInfo = `\n  Options: ${allOptions.join(", ")}`;
  }

  const renderedNote = renderType ? `\n  Rendered: ${renderType}` : "";
  
  return {
    content: [
      {
        type: "text" as const,
        text: `✓ File sent to printer: ${printerName}\n` +
              `  Copies: ${copies}${optionsInfo}\n` +
              `  File: ${sourceFile}${renderedNote}`,
      },
    ],
  };
}

