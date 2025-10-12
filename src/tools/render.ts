/**
 * @fileoverview Markdown rendering and printing tool implementation.
 * Explicitly renders markdown files to PDF and prints them.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execCommand } from "../utils.js";
import { config } from "../config.js";
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
      // Validate copy count against configured maximum
      if (config.maxCopies > 0 && copies > config.maxCopies) {
        throw new Error(
          `Copy count (${copies}) exceeds maximum allowed (${config.maxCopies}). ` +
          `Set MCP_PRINTER_MAX_COPIES environment variable to increase or use 0 for unlimited.`
        );
      }
      
      let renderedPdf: string | null = null;

      try {
        // Render markdown to PDF
        renderedPdf = await renderMarkdownToPdf(file_path);
        
        // Print the PDF
        const targetPrinter = printer || config.defaultPrinter;
        const args: string[] = [];
        
        if (targetPrinter) {
          args.push('-P', targetPrinter);
        }
        
        if (copies > 1) {
          args.push(`-#${copies}`);
        }
        
        let allOptions = [];
        if (config.enableDuplex && !options?.includes("sides=")) {
          allOptions.push("sides=two-sided-long-edge");
        }
        if (config.defaultOptions.length > 0) {
          allOptions.push(...config.defaultOptions);
        }
        if (options) {
          allOptions.push(...options.split(/\s+/));
        }
        
        // Add each option with -o flag
        for (const option of allOptions) {
          args.push('-o', option);
        }
        
        args.push(renderedPdf);
        await execa('lpr', args);
        
        const printerName = targetPrinter || (await execCommand('lpstat', ['-d'])).split(": ")[1] || "default";
        
        let optionsInfo = "";
        if (allOptions.length > 0) {
          optionsInfo = `\n  Options: ${allOptions.join(", ")}`;
        }
        
        return {
          content: [{
            type: "text",
            text: `✓ Rendered and printed markdown file\n` +
                  `  Printer: ${printerName}\n` +
                  `  Copies: ${copies}${optionsInfo}\n` +
                  `  Source: ${file_path}`,
          }],
        };
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
