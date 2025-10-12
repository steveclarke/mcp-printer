/**
 * @fileoverview Markdown file renderer.
 * Converts markdown files to PDF using crossnote.
 * Provides beautiful Markdown Preview Enhanced-quality output with Mermaid diagram support.
 * Automatically adds page numbering to all rendered PDFs.
 */

import { dirname, basename, join } from "path";
import { readFileSync, writeFileSync, mkdtempSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { findChrome } from "../utils.js";
import { validateFilePath } from "../file-security.js";
import { config } from "../config.js";
import { Notebook } from "crossnote";

/**
 * Page numbering configuration object for Puppeteer PDF generation.
 */
const PAGE_NUMBER_CHROME_CONFIG = {
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="font-size:9px; text-align:center; width:100%; margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Helvetica\', \'Arial\', sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  margin: {
    top: '1cm',
    bottom: '1.5cm',
    left: '1cm',
    right: '1cm',
  },
};

/**
 * Extracts YAML front-matter from markdown content.
 * @param content - Markdown file content
 * @returns Object with frontMatter (parsed YAML) and body (rest of content), or null if no front-matter
 */
function extractFrontMatter(content: string): { frontMatter: any; body: string } | null {
  const trimmed = content.trimStart();
  
  // Check if file starts with YAML front-matter (---)
  if (!trimmed.startsWith('---')) {
    return null;
  }
  
  // Find the closing --- (must be at start of line after at least one character)
  const frontMatterEnd = trimmed.indexOf('\n---', 3);
  if (frontMatterEnd === -1) {
    return null;
  }
  
  // Extract the YAML content (between the --- markers)
  const yamlContent = trimmed.substring(3, frontMatterEnd).trim();
  const body = trimmed.substring(frontMatterEnd + 4); // +4 to skip "\n---"
  
  try {
    const frontMatter = parseYaml(yamlContent) || {};
    return { frontMatter, body };
  } catch (error) {
    // If YAML parsing fails, treat it as if there's no front-matter
    return null;
  }
}

/**
 * Injects page numbering configuration into markdown content.
 * Properly merges with existing front-matter if present.
 * @param content - Original markdown content
 * @returns Markdown content with page numbering front-matter added/merged
 */
function injectPageNumbering(content: string): string {
  const extracted = extractFrontMatter(content);
  
  if (extracted === null) {
    // No front-matter exists, add it
    const yamlString = stringifyYaml({ chrome: PAGE_NUMBER_CHROME_CONFIG });
    return `---\n${yamlString}---\n\n${content}`;
  }
  
  const { frontMatter, body } = extracted;
  
  // Check if user already has chrome or puppeteer config - respect their settings
  if (frontMatter.chrome || frontMatter.puppeteer) {
    return content; // Don't modify user's existing config
  }
  
  // Merge in the chrome config with existing front-matter
  const mergedFrontMatter = {
    ...frontMatter,
    chrome: PAGE_NUMBER_CHROME_CONFIG,
  };
  
  const yamlString = stringifyYaml(mergedFrontMatter);
  return `---\n${yamlString}---${body}`;
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
  validateFilePath(filePath);
  
  // Read the original markdown content
  const originalContent = readFileSync(filePath, 'utf-8');
  
  // Inject page numbering configuration if not already present
  const contentWithPageNumbers = injectPageNumbering(originalContent);
  
  // Create a temporary directory for the modified markdown file
  const tempDir = mkdtempSync(join(tmpdir(), 'mcp-printer-markdown-'));
  const tempFileName = basename(filePath);
  const tempFilePath = join(tempDir, tempFileName);
  
  // Write the modified content to temp file
  writeFileSync(tempFilePath, contentWithPageNumbers, 'utf-8');
  
  // Find Chrome executable (required by crossnote/puppeteer)
  const chromePath = config.chromePath || await findChrome();
  
  let outputPath: string;
  
  try {
    // Initialize crossnote notebook with configuration, pointing to temp directory
    const notebook = await Notebook.init({
      notebookPath: tempDir,
      config: {
        // Hardcoded themes optimized for printing (light background, clean styling)
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
    
    // Get the markdown engine for the temp file
    const engine = notebook.getNoteMarkdownEngine(tempFileName);
    
    // Export to PDF using Chrome/Puppeteer
    // crossnote returns the path to the generated PDF
    outputPath = await engine.chromeExport({ 
      fileType: 'pdf',
      runAllCodeChunks: false, // Don't execute code chunks for security
    });
  } catch (error: any) {
    // Clean up temp file before throwing
    try {
      unlinkSync(tempFilePath);
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(`Failed to render markdown with crossnote: ${error.message}`);
  }
  
  // Clean up temp markdown file (PDF is in a different location)
  try {
    unlinkSync(tempFilePath);
  } catch {
    // Ignore cleanup errors - temp files will be cleaned up by OS eventually
  }
  
  return outputPath;
}
