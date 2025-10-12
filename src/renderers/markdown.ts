/**
 * @fileoverview Markdown file renderer.
 * Converts markdown files to PDF using crossnote.
 * Provides beautiful Markdown Preview Enhanced-quality output with Mermaid diagram support.
 */

import { dirname, basename } from "path";
import { findChrome } from "../utils.js";
import { validateFilePath } from "../file-security.js";
import { config } from "../config.js";
import { Notebook, PreviewTheme, CodeBlockTheme, MermaidTheme } from "crossnote";

/**
 * Renders a markdown file to PDF using crossnote.
 * Provides beautiful Markdown Preview Enhanced-quality output with comprehensive diagram support.
 * 
 * @param filePath - Path to the markdown file to render
 * @returns Path to the generated temporary PDF file
 * @throws {Error} If Chrome is not found or rendering fails
 */
export async function renderMarkdownToPdf(filePath: string): Promise<string> {
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
        // Theme configuration from environment variables
        previewTheme: `${config.markdown.theme}.css` as PreviewTheme,
        codeBlockTheme: `${config.markdown.codeTheme}.css` as CodeBlockTheme,
        mermaidTheme: config.markdown.mermaidTheme as MermaidTheme,
        
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
