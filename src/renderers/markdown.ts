/**
 * @fileoverview Markdown file renderer.
 * Converts markdown files to PDF using pandoc and Chrome.
 */

import { mkdtempSync, unlinkSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { checkDependency, convertHtmlToPdf } from "../utils.js";
import { validateFilePath } from "../file-security.js";
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
  
  // Check that pandoc is available
  await checkDependency("pandoc", "pandoc");

  // Create secure temp directory for pandoc output
  const tmpDir = mkdtempSync(join(tmpdir(), 'mcp-printer-md-'));
  const tmpHtml = join(tmpDir, 'input.html');

  try {
    // Convert markdown to HTML (with raw HTML disabled for security)
    await execa('pandoc', [
      '--from=markdown-raw_html',
      filePath, 
      '-o', 
      tmpHtml
    ]);
    
    // Read the pandoc-generated HTML
    const htmlContent = readFileSync(tmpHtml, 'utf-8');
    
    // Clean up the pandoc temp file
    try {
      unlinkSync(tmpHtml);
    } catch {
      // Ignore cleanup errors
    }
    
    // Convert HTML to PDF with Chrome (with JavaScript disabled for security)
    return await convertHtmlToPdf(htmlContent, {
      chromeFlags: ['--disable-javascript'],
      tempDirPrefix: 'mcp-printer-md-'
    });
  } catch (error) {
    // Clean up temp file on error
    try {
      unlinkSync(tmpHtml);
    } catch {}
    throw error;
  }
}

