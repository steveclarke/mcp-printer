/**
 * @fileoverview Code file renderer with syntax highlighting.
 * Converts source code files to PDF with syntax highlighting using highlight.js and Chrome.
 */

import { readFileSync, writeFileSync, mkdtempSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import hljs from "highlight.js";
import he from "he";
import { findChrome, getLanguageFromExtension, fixMultilineSpans, validateFilePath } from "../utils.js";
import { config } from "../config.js";
import { execa } from "execa";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Renders a source code file to PDF with syntax highlighting.
 * Uses highlight.js for syntax highlighting and Chrome for PDF generation.
 * Supports configurable color schemes, line numbers, font size, and line spacing.
 * 
 * @param filePath - Path to the source code file to render
 * @returns Path to the generated temporary PDF file
 * @throws {Error} If Chrome is not found or PDF generation fails
 */
export async function renderCodeToPdf(filePath: string): Promise<string> {
  // Validate file path security
  validateFilePath(filePath);
  
  const chromePath = await findChrome();
  if (!chromePath) {
    throw new Error("Chrome not found. Install Google Chrome or set MCP_PRINTER_CHROME_PATH environment variable.");
  }

  // Read source code file
  const sourceCode = readFileSync(filePath, 'utf-8');
  
  // Get file extension and language
  const ext = filePath.split('.').pop()?.toLowerCase() || "";
  const language = getLanguageFromExtension(ext);
  
  // Syntax highlight the code
  let highlightedCode = "";
  try {
    highlightedCode = hljs.highlight(sourceCode, { language }).value;
    // If no keywords were highlighted, try auto-detect
    if (!highlightedCode.includes('hljs-')) {
      highlightedCode = hljs.highlightAuto(sourceCode).value;
    }
  } catch (error) {
    // Fall back to auto-detect
    highlightedCode = hljs.highlightAuto(sourceCode).value;
  }
  
  // Fix multiline spans
  highlightedCode = fixMultilineSpans(highlightedCode);
  
  // Build table rows with optional line numbers
  let tableRows = "";
  const lines = highlightedCode.split("\n");
  
  if (config.code.enableLineNumbers) {
    tableRows = lines
      .map(line => line || "&nbsp;")
      .map((line, i) => `<tr><td class="line-number">${i + 1}</td><td class="line-text">${line}</td></tr>`)
      .join("\n");
  } else {
    tableRows = lines
      .map(line => line || "&nbsp;")
      .map(line => `<tr><td class="line-text">${line}</td></tr>`)
      .join("\n");
  }
  
  // Get color scheme CSS
  let colorSchemeCSS = "";
  try {
    // Find highlight.js styles directory (node_modules relative to this module)
    const stylesDir = join(__dirname, '../../node_modules/highlight.js/styles');
    const themeFileName = config.code.colorScheme + '.css';
    const themePath = join(stylesDir, themeFileName);
    
    try {
      colorSchemeCSS = readFileSync(themePath, 'utf-8');
    } catch {
      // Try .min.css version
      const minThemePath = join(stylesDir, `${config.code.colorScheme}.min.css`);
      colorSchemeCSS = readFileSync(minThemePath, 'utf-8');
    }
  } catch (error) {
    // Fall back to default if theme not found
    try {
      const defaultPath = join(__dirname, '../../node_modules/highlight.js/styles/default.css');
      colorSchemeCSS = readFileSync(defaultPath, 'utf-8');
    } catch {
      // If all else fails, use minimal inline CSS
      colorSchemeCSS = `
        .hljs { display: block; overflow-x: auto; padding: 0.5em; background: #f0f0f0; }
        .hljs-keyword { color: #0000ff; font-weight: bold; }
        .hljs-string { color: #008000; }
        .hljs-comment { color: #808080; font-style: italic; }
        .hljs-number { color: #ff0000; }
        .hljs-function { color: #0000ff; }
      `;
    }
  }
  
  // Build complete HTML document
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* Print page setup - standard margins */
    @page {
      margin: 0.5in;
    }
    
    /* Highlight.js color scheme */
    ${colorSchemeCSS}
    
    /* Custom styling */
    * {
      box-sizing: border-box;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      font-family: Menlo, Monaco, 'Courier New', monospace;
      font-size: ${config.code.fontSize};
      line-height: ${config.code.lineSpacing}em;
    }
    
    table {
      border-collapse: collapse;
    }
    
    .hljs {
      background: transparent !important;
      background-color: transparent !important;
    }
    
    .line-number {
      border-right: thin solid silver;
      padding-right: 0.3em;
      text-align: right;
      vertical-align: top;
    }
    
    .line-text {
      padding-left: 0.7em;
      white-space: pre-wrap;
    }
    
    h3.filepath {
      margin: 0 0 1em 0;
      font-weight: normal;
    }
  </style>
</head>
<body>
  <h3 class="filepath">${he.encode(filePath)}</h3>
  <table class="hljs">
    ${tableRows}
  </table>
</body>
</html>`;

  // Create secure temp directory
  const tmpDir = mkdtempSync(join(tmpdir(), 'mcp-printer-code-'));
  const tmpHtml = join(tmpDir, 'input.html');
  const tmpPdf = join(tmpDir, 'output.pdf');
  
  try {
    // Write HTML to temp file
    writeFileSync(tmpHtml, html, 'utf-8');
    
    // Convert HTML to PDF with Chrome
    try {
      await execa(chromePath, [
        '--headless',
        '--disable-gpu',
        `--print-to-pdf=${tmpPdf}`,
        tmpHtml
      ]);
    } catch (error: any) {
      // Chrome might output to stderr even on success
      if (!error.stderr || !error.stderr.includes('written to file')) {
        throw new Error(`Failed to render PDF: ${error.message}`);
      }
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

