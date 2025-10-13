/**
 * @fileoverview Markdown file renderer.
 * Converts markdown files to PDF using crossnote.
 * Provides beautiful Markdown Preview Enhanced-quality output with Mermaid diagram support.
 * Automatically adds page numbering to all rendered PDFs.
 */

import { dirname, basename, join } from "path"
import { readFileSync, writeFileSync, mkdtempSync, unlinkSync } from "fs"
import { tmpdir } from "os"
import matter from "gray-matter"
import he from "he"
import { findChrome } from "../utils.js"
import { validateFilePath } from "../file-security.js"
import { config } from "../config.js"
import { Notebook } from "crossnote"

/**
 * Page numbering configuration function for Puppeteer PDF generation.
 * Generates header/footer templates with inline styles (required by Puppeteer).
 * Filename is HTML-escaped to prevent XSS and rendering issues.
 *
 * @param filename - The name of the file being rendered (displayed in footer)
 * @returns Configuration object with header/footer templates
 */
function getPageNumberConfig(filename: string) {
  // Puppeteer PDF headers/footers require inline styles (no external CSS support)
  const footerStyles = {
    container: [
      "font-size: 9px",
      "width: 100%",
      "margin: 0",
      "padding: 0 1cm",
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      "display: flex",
      "justify-content: space-between",
      "align-items: center",
    ].join("; "),
    filename: "font-size: 8px; color: #666;",
  }

  return {
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate: `
      <div style="${footerStyles.container}">
        <span style="${footerStyles.filename}">${he.encode(filename)}</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: "1cm",
      bottom: "1.5cm",
      left: "1cm",
      right: "1cm",
    },
  }
}

/**
 * Injects page numbering configuration into markdown content.
 * Properly merges with existing front-matter if present.
 * Uses gray-matter's stringify for robust formatting.
 * @param content - Original markdown content
 * @param filename - Name of the file being rendered (displayed in footer)
 * @returns Markdown content with page numbering front-matter added/merged
 */
function injectPageNumbering(content: string, filename: string): string {
  const { data, content: body } = matter(content)

  // Check if user already has chrome or puppeteer config - respect their settings
  if (data.chrome || data.puppeteer) {
    return content // Don't modify user's existing config
  }

  // Merge in the chrome config with existing front-matter (even if empty)
  const mergedFrontMatter = {
    ...data,
    chrome: getPageNumberConfig(filename),
  }

  // Use gray-matter's stringify to properly format the document
  return matter.stringify(body, mergedFrontMatter)
}

/**
 * Renders a markdown file to PDF using crossnote.
 * Provides beautiful Markdown Preview Enhanced-quality output with comprehensive diagram support.
 * Automatically adds page numbering (Page X / Y) to the footer of each page.
 *
 * @param filePath - Path to the markdown file to render
 * @returns Path to the generated temporary PDF file
 * @throws {Error} If Chrome is not found or rendering fails
 */
export async function renderMarkdownToPdf(filePath: string): Promise<string> {
  // Validate file path security
  validateFilePath(filePath)

  // Read the original markdown content
  const originalContent = readFileSync(filePath, "utf-8")

  // Inject page numbering configuration if not already present
  const contentWithPageNumbers = injectPageNumbering(originalContent, basename(filePath))

  // Create a temporary directory for the modified markdown file
  const tempDir = mkdtempSync(join(tmpdir(), "mcp-printer-markdown-"))
  const tempFileName = basename(filePath)
  const tempFilePath = join(tempDir, tempFileName)

  // Write the modified content to temp file
  writeFileSync(tempFilePath, contentWithPageNumbers, "utf-8")

  // Find Chrome executable (required by crossnote/puppeteer)
  const chromePath = config.chromePath || (await findChrome())

  let outputPath: string

  try {
    // Initialize crossnote notebook with configuration, pointing to temp directory
    const notebook = await Notebook.init({
      notebookPath: tempDir,
      config: {
        // Hardcoded themes optimized for printing (light background, clean styling)
        previewTheme: "github-light.css",
        codeBlockTheme: "github.css",
        mermaidTheme: "default",

        // Math rendering
        mathRenderingOption: "KaTeX",

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
    })

    // Get the markdown engine for the temp file
    const engine = notebook.getNoteMarkdownEngine(tempFileName)

    // Export to PDF using Chrome/Puppeteer
    // crossnote returns the path to the generated PDF
    outputPath = await engine.chromeExport({
      fileType: "pdf",
      runAllCodeChunks: false, // Don't execute code chunks for security
    })
  } catch (error: any) {
    // Clean up temp file before throwing
    try {
      unlinkSync(tempFilePath)
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(`Failed to render markdown with crossnote: ${error.message}`)
  }

  // Clean up temp markdown file (PDF is in a different location)
  try {
    unlinkSync(tempFilePath)
  } catch {
    // Ignore cleanup errors - temp files will be cleaned up by OS eventually
  }

  return outputPath
}
