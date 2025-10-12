/**
 * @fileoverview Markdown rendering and printing tool implementation.
 * Explicitly renders markdown files to PDF and prints them.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executePrintJob, formatPrintResponse } from "../utils.js";
import { renderMarkdownToPdf } from "../renderers/markdown.js";
import { execa } from "execa";

/**
 * Registers the render_and_print_markdown tool with the MCP server.
 * Uses pandoc and Chrome for high-quality PDF rendering.
 * 
 * @param server - The McpServer instance to register the tool with
 */
export function registerRenderTools(server: McpServer) {
  server.registerTool(
    "render_and_print_markdown",
    {
      title: "Render and Print Markdown",
      description: "Render a markdown file to PDF and print it. Uses pandoc and Chrome for high-quality rendering. Requires pandoc and Chrome/Chromium to be installed.",
      inputSchema: {
        file_path: z.string().describe("Full path to the markdown file to render and print"),
        printer: z.string().optional().describe("Printer name (optional, uses default if not specified)"),
        copies: z.number().min(1).optional().default(1).describe("Number of copies to print (default: 1)"),
        options: z.string().optional().describe("Additional CUPS options (e.g., 'landscape', 'sides=two-sided-long-edge')")
      }
    },
    async ({ file_path, printer, copies = 1, options }) => {
      let renderedPdf: string | null = null;

      try {
        // Render markdown to PDF
        renderedPdf = await renderMarkdownToPdf(file_path);
        
        // Print the PDF using shared function
        const { printerName, allOptions } = await executePrintJob(renderedPdf, printer, copies, options);
        return formatPrintResponse(printerName, copies, allOptions, file_path, "markdown → PDF");
      } finally {
        // Clean up temp files
        if (renderedPdf) {
          try {
            await execa('rm', ['-f', renderedPdf]);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    }
  );
}
