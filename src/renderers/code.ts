/**
 * @fileoverview Code file renderer with syntax highlighting.
 * 
 * This module converts source code files to print-ready PDFs through a multi-step pipeline:
 * 
 * 1. **Syntax Highlighting**: Uses highlight.js to analyze the source code and wrap tokens
 *    (keywords, strings, comments, etc.) in <span> elements with CSS classes for coloring.
 * 
 * 2. **Multiline Span Fixes**: Ensures syntax highlighting spans don't break across line 
 *    boundaries, which would interfere with line-by-line table rendering.
 * 
 * 3. **HTML Table Structure**: Builds an HTML table where each line of code is a table row.
 *    Optionally adds line numbers in a separate column with configurable visibility.
 * 
 * 4. **CSS Styling**: Loads the selected color scheme from highlight.js styles directory
 *    and applies print-optimized CSS (fonts, spacing, margins, page setup).
 * 
 * 5. **PDF Generation**: Uses Chrome headless to convert the styled HTML to PDF format,
 *    which preserves syntax colors and formatting for printing.
 * 
 * The approach of manually building HTML structure (rather than using browser-focused 
 * plugins) is necessary for server-side Node.js rendering without DOM APIs.
 */

import { readFileSync } from "fs";
import { basename, dirname, extname, join } from "path";
import { fileURLToPath } from "url";
import hljs from "highlight.js";
import he from "he";
import { convertHtmlToPdf } from "../utils.js";
import { validateFilePath } from "../file-security.js";
import { config } from "../config.js";

/**
 * Determines if a file should be rendered with syntax highlighting.
 * Uses strict whitelist approach - only known extensions and special extensionless
 * files will be auto-rendered. Unknown extensions require force_code_render=true.
 * 
 * @param filePath - Path to the file to check
 * @returns True if the file should be syntax-highlighted, false otherwise
 */
export function shouldRenderCode(filePath: string): boolean {
  // Master switch check
  if (!config.autoRenderCode) {
    return false;
  }
  
  // Extract extension (for files without extension, use the basename itself)
  const fileExt = extname(filePath);
  const ext = fileExt ? fileExt.slice(1).toLowerCase() : basename(filePath).toLowerCase();
  
  // Check if extension is in the exclusion list
  if (ext && config.code.excludeExtensions.includes(ext)) {
    return false;
  }
  
  // Check if language is recognized (whitelist check)
  const language = getLanguageFromExtension(filePath);
  return language !== "";
}

// Get the directory of the current module for resolving relative paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Maps file extensions to highlight.js language names.
 * 
 * This is a strict whitelist - only files with these extensions will be automatically
 * rendered as code. Files with unknown extensions will not be rendered unless
 * force_code_render=true is explicitly passed.
 * 
 * Benefits of strict whitelist:
 * - 100% predictable (no false positives on plain text files)
 * - Fast (no content scanning required)
 * - Reliable for similar languages (won't confuse TypeScript with JavaScript)
 * - Safe for printing LICENSE, README, and other plain text files
 * 
 * Note: Files without extensions (like "Makefile") use the basename as the extension.
 * For example, "Makefile" → "makefile" → maps to 'makefile' language.
 * 
 * @param filePath - Path to the file (extension will be extracted using path.extname)
 * @returns Highlight.js language identifier, or empty string if not in whitelist
 */
export function getLanguageFromExtension(filePath: string): string {
  // Extract extension (for files without extension, use the basename itself)
  const fileExt = extname(filePath);
  const ext = fileExt ? fileExt.slice(1).toLowerCase() : basename(filePath).toLowerCase();
  
  // Map common file extensions to their highlight.js language names
  const languageMap: { [key: string]: string } = {
    // Programming Languages
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'lua': 'lua',
    'perl': 'perl',
    'pl': 'perl',
    'r': 'r',
    // Shell/Scripts
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'fish': 'bash',
    'ps1': 'powershell',
    'vim': 'vim',
    // Markup/Data
    'yaml': 'yaml',
    'yml': 'yaml',
    'json': 'json',
    'xml': 'xml',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss', // Sass uses SCSS highlighting
    'less': 'less',
    'md': 'markdown',
    'sql': 'sql',
    // Special extensionless files (lowercase filename treated as extension)
    'makefile': 'makefile',
    'dockerfile': 'dockerfile',
    'gemfile': 'ruby',
    'rakefile': 'ruby',
    'vagrantfile': 'ruby',
  };
  
  // Return language if in whitelist, empty string otherwise (strict whitelist)
  return languageMap[ext] || "";
}

/**
 * Fixes multiline HTML span elements by ensuring spans don't break across lines.
 * 
 * **Problem:** Highlight.js creates single spans for multiline constructs (strings, comments):
 * ```html
 * <span class="hljs-string">"multiline
 * string"</span>
 * ```
 * 
 * When split into table rows, this creates invalid HTML:
 * ```html
 * <tr><td><span class="hljs-string">"multiline</td></tr>     <!-- ❌ Unclosed span -->
 * <tr><td>string"</span></td></tr>                           <!-- ❌ Orphaned close tag -->
 * ```
 * 
 * **Solution:** This function closes spans at line end and reopens them at line start:
 * ```html
 * <tr><td><span class="hljs-string">"multiline</span></td></tr>     <!-- ✅ Complete -->
 * <tr><td><span class="hljs-string">string"</span></td></tr>        <!-- ✅ Complete -->
 * ```
 * 
 * @param text - HTML text with span elements from highlight.js
 * @returns HTML text with spans properly closed and reopened at line boundaries
 * @internal Exported for testing purposes
 */
export function fixMultilineSpans(text: string): string {
  let classes: string[] = [];
  const spanRegex = /<(\/?)span(.*?)>/g;
  const tagAttrRegex = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/g;

  return text.split("\n").map(line => {
    const pre = classes.map(classVal => `<span class="${classVal}">`);

    let spanMatch;
    spanRegex.lastIndex = 0;
    while ((spanMatch = spanRegex.exec(line)) !== null) {
      if (spanMatch[1] !== "") {
        classes.pop();
        continue;
      }
      let attrMatch;
      tagAttrRegex.lastIndex = 0;
      while ((attrMatch = tagAttrRegex.exec(spanMatch[2])) !== null) {
        if (attrMatch[1].toLowerCase().trim() === "class") {
          classes.push(attrMatch[2]);
        }
      }
    }

    return `${pre.join("")}${line}${"</span>".repeat(classes.length)}`;
  }).join("\n");
}

/**
 * Applies syntax highlighting to source code using highlight.js.
 * 
 * Strategy: Prefers extension-based language detection over auto-detection for accuracy.
 * If the specified language fails or produces no highlighted tokens, falls back to auto-detection.
 * 
 * @param sourceCode - Raw source code to highlight
 * @param language - Language identifier from file extension
 * @returns HTML string with syntax highlighting span elements
 */
function applySyntaxHighlighting(sourceCode: string, language: string): string {
  try {
    const highlighted = hljs.highlight(sourceCode, { language }).value;
    
    // Check if highlighting actually worked (should have 'hljs-' CSS classes)
    if (!highlighted.includes('hljs-')) {
      // No tokens were highlighted, try auto-detect instead
      return hljs.highlightAuto(sourceCode).value;
    }
    
    return highlighted;
  } catch (error) {
    // Language not recognized by highlight.js, fall back to auto-detect
    return hljs.highlightAuto(sourceCode).value;
  }
}

/**
 * Loads the CSS for a highlight.js color scheme.
 * Tries the specified theme, falls back to default, then to minimal inline CSS.
 */
function loadColorSchemeCSS(colorScheme: string): string {
  try {
    const stylesDir = join(__dirname, '../../node_modules/highlight.js/styles');
    const themeFileName = colorScheme + '.css';
    const themePath = join(stylesDir, themeFileName);
    
    try {
      return readFileSync(themePath, 'utf-8');
    } catch {
      // Try .min.css version
      const minThemePath = join(stylesDir, `${colorScheme}.min.css`);
      return readFileSync(minThemePath, 'utf-8');
    }
  } catch (error) {
    // Fall back to default theme
    try {
      const defaultPath = join(__dirname, '../../node_modules/highlight.js/styles/default.css');
      return readFileSync(defaultPath, 'utf-8');
    } catch {
      // If all else fails, use minimal inline CSS
      return `
        .hljs { display: block; overflow-x: auto; padding: 0.5em; background: #f0f0f0; }
        .hljs-keyword { color: #0000ff; font-weight: bold; }
        .hljs-string { color: #008000; }
        .hljs-comment { color: #808080; font-style: italic; }
        .hljs-number { color: #ff0000; }
        .hljs-function { color: #0000ff; }
      `;
    }
  }
}

/**
 * Builds HTML table rows for code lines with optional line numbers.
 * 
 * Creates a table structure where each line of code is a separate row:
 * 
 * **With line numbers** (two columns):
 * ```html
 * <tr><td class="line-number">1</td><td class="line-text">const x = 5;</td></tr>
 * <tr><td class="line-number">2</td><td class="line-text">console.log(x);</td></tr>
 * ```
 * 
 * **Without line numbers** (single column):
 * ```html
 * <tr><td class="line-text">const x = 5;</td></tr>
 * <tr><td class="line-text">console.log(x);</td></tr>
 * ```
 * 
 * Empty lines are replaced with `&nbsp;` to preserve vertical spacing.
 * Line numbers are 1-indexed (start at 1, not 0).
 * 
 * @param lines - Array of code lines (already syntax-highlighted HTML)
 * @param showLineNumbers - Whether to include line numbers in a separate column
 * @returns HTML string of table rows ready to insert into a <table> element
 */
function buildTableRows(lines: string[], showLineNumbers: boolean): string {
  const sanitizedLines = lines.map(line => line || "&nbsp;");
  
  if (showLineNumbers) {
    return sanitizedLines
      .map((line, i) => 
        `<tr><td class="line-number">${i + 1}</td><td class="line-text">${line}</td></tr>`
      )
      .join("\n");
  } else {
    return sanitizedLines
      .map(line => `<tr><td class="line-text">${line}</td></tr>`)
      .join("\n");
  }
}

/**
 * Generates the complete HTML document with embedded CSS for printing.
 */
function generateHTML(
  filePath: string,
  tableRows: string,
  colorSchemeCSS: string,
  fontSize: string,
  lineSpacing: string
): string {
  return `<!DOCTYPE html>
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
      font-size: ${fontSize};
      line-height: ${lineSpacing}em;
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
}

/**
 * Renders a source code file to PDF with syntax highlighting.
 * Uses highlight.js for syntax highlighting and Chrome for PDF generation.
 * Supports configurable color schemes, line numbers, font size, and line spacing.
 * 
 * @param filePath - Path to the source code file to render
 * @param lineNumbers - Optional override for line numbers display; falls back to config if not provided
 * @param colorScheme - Optional override for syntax highlighting color scheme; falls back to config if not provided
 * @param fontSize - Optional override for font size; falls back to config if not provided
 * @param lineSpacing - Optional override for line spacing; falls back to config if not provided
 * @returns Path to the generated temporary PDF file
 * @throws {Error} If Chrome is not found or PDF generation fails
 */
export async function renderCodeToPdf(
  filePath: string,
  lineNumbers?: boolean,
  colorScheme?: string,
  fontSize?: string,
  lineSpacing?: string
): Promise<string> {
  // Step 1: Validate file path
  validateFilePath(filePath);
  
  // Step 2: Read source code and identify language
  const sourceCode = readFileSync(filePath, 'utf-8');
  const language = getLanguageFromExtension(filePath);
  
  // Step 3: Apply syntax highlighting with extension-based language, fallback to auto-detect
  const highlightedCode = applySyntaxHighlighting(sourceCode, language);
  
  // Step 4: Fix multiline spans and split into lines
  const lines = fixMultilineSpans(highlightedCode).split("\n");
  
  // Step 5: Build HTML structure with configuration
  const showLineNumbers = lineNumbers ?? config.code.autoLineNumbers;
  const tableRows = buildTableRows(lines, showLineNumbers);
  
  const selectedColorScheme = colorScheme ?? config.code.colorScheme;
  const colorSchemeCSS = loadColorSchemeCSS(selectedColorScheme);
  
  const html = generateHTML(
    filePath,
    tableRows,
    colorSchemeCSS,
    fontSize ?? config.code.fontSize,
    lineSpacing ?? config.code.lineSpacing
  );
  
  // Step 6: Convert HTML to PDF
  return await convertHtmlToPdf(html, {
    tempDirPrefix: 'mcp-printer-code-'
  });
}

