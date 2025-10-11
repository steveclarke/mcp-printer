/**
 * @fileoverview Code file renderer with syntax highlighting.
 * Converts source code files to PDF with syntax highlighting using highlight.js and Chrome.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import hljs from "highlight.js";
import { findChrome, getLanguageFromExtension, fixMultilineSpans, execCommand } from "../utils.js";
import { config } from "../config.js";

const execAsync = promisify(exec);

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
  
  if (config.CODE_LINE_NUMBERS) {
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
    const themeFileName = config.CODE_COLOR_SCHEME + '.css';
    const themePath = join(stylesDir, themeFileName);
    
    try {
      colorSchemeCSS = readFileSync(themePath, 'utf-8');
    } catch {
      // Try .min.css version
      const minThemePath = join(stylesDir, `${config.CODE_COLOR_SCHEME}.min.css`);
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
      font-size: ${config.CODE_FONT_SIZE};
      line-height: ${config.CODE_LINE_SPACING}em;
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
  <h3 class="filepath">${filePath}</h3>
  <table class="hljs">
    ${tableRows}
  </table>
</body>
</html>`;

  // Create temp files
  const tmpHtml = `/tmp/mcp-printer-code-${Date.now()}.html`;
  const tmpPdf = `/tmp/mcp-printer-code-${Date.now()}.pdf`;
  
  // Write HTML to temp file
  await execCommand(`cat > "${tmpHtml}" << 'EOFHTML'\n${html}\nEOFHTML`);
  
  // Convert HTML to PDF with Chrome
  try {
    await execAsync(`"${chromePath}" --headless --disable-gpu --print-to-pdf="${tmpPdf}" "${tmpHtml}"`);
  } catch (error: any) {
    // Chrome might output to stderr even on success
    const { stderr } = error;
    if (!stderr || !stderr.includes('written to file')) {
      throw new Error(`Failed to render PDF: ${error.message}`);
    }
  }
  
  // Clean up HTML file
  try {
    await execCommand(`rm -f "${tmpHtml}"`);
  } catch {
    // Ignore cleanup errors
  }

  return tmpPdf;
}

