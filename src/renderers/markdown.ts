/**
 * @fileoverview Markdown file renderer.
 * Converts markdown files to PDF using pandoc and Chrome.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { checkDependency, findChrome, execCommand } from "../utils.js";

const execAsync = promisify(exec);

/**
 * Renders a markdown file to PDF.
 * Uses pandoc to convert markdown to HTML, then Chrome to render HTML to PDF.
 * 
 * @param filePath - Path to the markdown file to render
 * @returns Path to the generated temporary PDF file
 * @throws {Error} If pandoc or Chrome is not found, or if rendering fails
 */
export async function renderMarkdownToPdf(filePath: string): Promise<string> {
  // Check dependencies
  await checkDependency("pandoc", "pandoc");
  const chromePath = await findChrome();
  if (!chromePath) {
    throw new Error("Chrome not found. Install Google Chrome or set MCP_PRINTER_CHROME_PATH environment variable.");
  }

  // Create temp files
  const tmpHtml = `/tmp/mcp-printer-${Date.now()}.html`;
  const tmpPdf = `/tmp/mcp-printer-${Date.now()}.pdf`;

  // Convert markdown to HTML
  await execCommand(`pandoc "${filePath}" -o "${tmpHtml}"`);
  
  // Convert HTML to PDF with Chrome
  // Note: Chrome outputs success messages to stderr, so we use execAsync directly
  try {
    await execAsync(`"${chromePath}" --headless --disable-gpu --print-to-pdf="${tmpPdf}" "${tmpHtml}"`);
  } catch (error: any) {
    // Chrome might output to stderr even on success, check if PDF was created
    const { stdout, stderr } = error;
    if (!stderr || !stderr.includes('written to file')) {
      throw new Error(`Failed to render PDF: ${error.message}`);
    }
    // Success - Chrome wrote the PDF and reported to stderr
  }
  
  // Clean up HTML file
  try {
    await execCommand(`rm -f "${tmpHtml}"`);
  } catch {
    // Ignore cleanup errors
  }

  return tmpPdf;
}

