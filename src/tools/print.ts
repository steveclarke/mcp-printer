/**
 * @fileoverview File printing tool implementation.
 * Handles printing of various file types with optional rendering for markdown and code files.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { unlinkSync } from "fs";
import { execCommand, shouldRenderToPdf, shouldRenderCode, validateFilePath } from "../utils.js";
import { config } from "../config.js";
import { renderMarkdownToPdf } from "../renderers/markdown.js";
import { renderCodeToPdf } from "../renderers/code.js";
import { execa } from "execa";

/**
 * Registers the print_file tool with the MCP server.
 * Supports automatic rendering of markdown and code files to PDF before printing.
 * 
 * @param server - The McpServer instance to register the tool with
 */
export function registerPrintTools(server: McpServer) {
  server.registerTool(
    "print_file",
    {
      title: "Print File",
      description: "Print a file to a specified printer. Supports PDF, text, and other common formats. Can specify number of copies and print options.",
      inputSchema: {
        file_path: z.string().describe("Full path to the file to print"),
        printer: z.string().optional().describe("Printer name (use list_printers to see available printers). Optional if default printer is set."),
        copies: z.number().optional().default(1).describe("Number of copies to print (default: 1)"),
        options: z.string().optional().describe("Additional CUPS options (e.g., 'landscape', 'sides=two-sided-long-edge')"),
        line_numbers: z.boolean().optional().describe("Show line numbers when rendering code files (overrides global setting)"),
        color_scheme: z.string().optional().describe("Syntax highlighting color scheme for code files (e.g., 'github', 'monokai', 'atom-one-light')"),
        font_size: z.string().optional().describe("Font size for code files (e.g., '8pt', '10pt', '12pt')"),
        line_spacing: z.string().optional().describe("Line spacing for code files (e.g., '1', '1.5', '2')")
      }
    },
    async ({ file_path, printer, copies = 1, options, line_numbers, color_scheme, font_size, line_spacing }) => {
      // Validate file path security
      validateFilePath(file_path);
      
      let actualFilePath = file_path;
      let renderedPdf: string | null = null;
      let renderType = "";

      // Check if file should be auto-rendered to PDF (markdown)
      if (shouldRenderToPdf(file_path)) {
        try {
          renderedPdf = await renderMarkdownToPdf(file_path);
          actualFilePath = renderedPdf;
          renderType = "markdown → PDF";
        } catch (error) {
          // If fallback is enabled, print original file; otherwise throw error
          if (config.fallbackOnRenderError) {
            console.error(`Warning: Failed to render ${file_path}, printing as-is:`, error);
          } else {
            throw error;
          }
        }
      }
      // Check if file should be rendered as code with syntax highlighting
      else if (shouldRenderCode(file_path)) {
        try {
          renderedPdf = await renderCodeToPdf(file_path, line_numbers, color_scheme, font_size, line_spacing);
          actualFilePath = renderedPdf;
          renderType = "code → PDF (syntax highlighted)";
        } catch (error) {
          // If fallback is enabled, print original file; otherwise throw error
          if (config.fallbackOnRenderError) {
            console.error(`Warning: Failed to render code ${file_path}, printing as-is:`, error);
          } else {
            throw error;
          }
        }
      }

      try {
        const args: string[] = [];
        
        // Use configured default printer if none specified
        const targetPrinter = printer || config.defaultPrinter;
        if (targetPrinter) {
          args.push('-P', targetPrinter);
        }
        
        if (copies > 1) {
          args.push(`-#${copies}`);
        }
        
        // Build options with defaults
        let allOptions = [];
        
        // Add default duplex if configured and not overridden
        if (config.enableDuplex && !options?.includes("sides=")) {
          allOptions.push("sides=two-sided-long-edge");
        }
        
        // Add default options if configured (split by spaces to handle multiple options)
        if (config.defaultOptions) {
          allOptions.push(...config.defaultOptions.split(/\s+/));
        }
        
        // Add user-specified options (these override defaults, split by spaces)
        if (options) {
          allOptions.push(...options.split(/\s+/));
        }
        
        // Add each option with -o flag
        for (const option of allOptions) {
          args.push('-o', option);
        }
        
        // Add file path
        args.push(actualFilePath);

        await execa('lpr', args);
        
        // Determine the printer name used: prefer the specified targetPrinter, else
        // get the system default printer via 'lpstat -d', else fallback to
        // 'default'
        const printerName = targetPrinter || (await execCommand('lpstat', ['-d'])).split(": ")[1] || "default";
        
        // Construct a string that lists all print options if any are specified.
        // This will be displayed to inform the user about what options were used in
        // the print job.
        let optionsInfo = "";
        if (allOptions.length > 0) {
          optionsInfo = `\n  Options: ${allOptions.join(", ")}`;
        }

        // If a renderType is provided, note what kind of rendering (e.g.,
        // "markdown", "code") was performed before printing.
        const renderedNote = renderType ? `\n  Rendered: ${renderType}` : "";
        
        return {
          content: [
            {
              type: "text",
              text: `✓ File sent to printer: ${printerName}\n` +
                    `  Copies: ${copies}${optionsInfo}\n` +
                    `  File: ${file_path}${renderedNote}`,
            },
          ],
        };
      } finally {
        // Clean up rendered PDF if it was created
        if (renderedPdf) {
          try {
            unlinkSync(renderedPdf);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    }
  );
}
