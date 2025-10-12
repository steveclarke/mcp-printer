/**
 * @fileoverview Markdown file renderer.
 * Converts markdown files to PDF using crossnote (primary) or pandoc (fallback).
 */

import { mkdtempSync, unlinkSync, readFileSync } from "fs";
import { join, dirname, basename } from "path";
import { tmpdir } from "os";
import { checkDependency, convertHtmlToPdf, findChrome } from "../utils.js";
import { validateFilePath } from "../file-security.js";
import { config } from "../config.js";
import { execa } from "execa";
import { Notebook } from "crossnote";

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

/**
 * Renders a markdown file to PDF using crossnote.
 * Provides beautiful Markdown Preview Enhanced-quality output with Mermaid diagram support.
 * 
 * @param filePath - Path to the markdown file to render
 * @returns Path to the generated temporary PDF file
 * @throws {Error} If Chrome is not found or rendering fails
 */
export async function renderMarkdownToPdfWithCrossnote(filePath: string): Promise<string> {
  // Validate file path security
  validateFilePath(filePath);
  
  // Get the directory and filename
  const notebookPath = dirname(filePath);
  const fileName = basename(filePath);
  
  // Find Chrome executable (required by crossnote/puppeteer)
  const chromePath = config.chromePath || await findChrome();
  
  try {
    // Initialize crossnote notebook with configuration
    const notebook = await Notebook.init({
      notebookPath,
      config: {
        // Theme configuration (will add env vars for these later)
        previewTheme: 'github-light.css',
        codeBlockTheme: 'github.css',
        mermaidTheme: 'default',
        
        // Math rendering
        mathRenderingOption: 'KaTeX',
        
        // Rendering options
        printBackground: true,
        breakOnSingleNewLine: true,
        enableEmojiSyntax: true,
        enableWikiLinkSyntax: false,
        enableExtendedTableSyntax: false,
        
        // Chrome configuration
        chromePath,
        
        // Security: disable script execution
        enableScriptExecution: false,
      },
    });
    
    // Get the markdown engine for this specific file
    const engine = notebook.getNoteMarkdownEngine(fileName);
    
    // Export to PDF using Chrome/Puppeteer
    // crossnote returns the path to the generated PDF
    const outputPath = await engine.chromeExport({ 
      fileType: 'pdf',
      runAllCodeChunks: false, // Don't execute code chunks for security
    });
    
    return outputPath;
  } catch (error: any) {
    throw new Error(`Failed to render markdown with crossnote: ${error.message}`);
  }
}

