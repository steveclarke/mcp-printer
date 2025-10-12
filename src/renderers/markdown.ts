/**
 * @fileoverview Markdown file renderer.
 * Converts markdown files to PDF using pandoc and Chrome.
 */

import { mkdtempSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { checkDependency, findChrome, validateFilePath } from "../utils.js";
import { execa } from "execa";

/**
 * Renders a markdown file to PDF.
 * Uses pandoc to convert markdown to HTML, then Chrome to render HTML to PDF.
 * 
 * @param filePath - Path to the markdown file to render
 * @returns Path to the generated temporary PDF file
 * @throws {Error} If pandoc or Chrome is not found, or if rendering fails
 */
export async function renderMarkdownToPdf(filePath: string): Promise<string> {
  // Validate file path security
  validateFilePath(filePath);
  
  // Check dependencies
  await checkDependency("pandoc", "pandoc");
  const chromePath = await findChrome();

  // Create secure temp directory
  const tmpDir = mkdtempSync(join(tmpdir(), 'mcp-printer-'));
  const tmpHtml = join(tmpDir, 'input.html');
  const tmpPdf = join(tmpDir, 'output.pdf');

  try {
    // Convert markdown to HTML (with raw HTML disabled for security)
    await execa('pandoc', [
      '--from=markdown-raw_html',
      filePath, 
      '-o', 
      tmpHtml
    ]);
    
    // Convert HTML to PDF with Chrome (with JavaScript disabled for security)
    // Note: Chrome outputs success messages to stderr
    try {
      await execa(chromePath, [
        '--headless',
        '--disable-gpu',
        '--disable-javascript',
        `--print-to-pdf=${tmpPdf}`,
        tmpHtml
      ]);
    } catch (error: any) {
      // Chrome might output to stderr even on success, check if PDF was created
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
    // Clean up temp directory on error
    try {
      unlinkSync(tmpHtml);
    } catch {}
    try {
      unlinkSync(tmpPdf);
    } catch {}
    throw error;
  }
}

