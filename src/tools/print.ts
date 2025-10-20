/**
 * @fileoverview File printing tool registration.
 * Registers print_file and get_page_meta tools with the MCP server.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  handlePrint,
  formatPrintResults,
  handlePageMeta,
  formatPageMetaResults,
  checkBatchSizeLimit,
  type PrintResult,
  type PageMetaResult,
} from "./batch-helpers.js"

/**
 * Shared parameter schema for rendering options used by both print_file and get_page_meta.
 */
const renderingParametersSchema = {
  line_numbers: z
    .boolean()
    .optional()
    .describe("Show line numbers when rendering code files (overrides global setting)"),
  color_scheme: z
    .string()
    .optional()
    .describe(
      "Syntax highlighting color scheme for code files (e.g., 'github', 'monokai', 'atom-one-light')"
    ),
  font_size: z
    .string()
    .optional()
    .describe("Font size for code files (e.g., '8pt', '10pt', '12pt')"),
  line_spacing: z
    .string()
    .optional()
    .describe("Line spacing for code files (e.g., '1', '1.5', '2')"),
  force_markdown_render: z
    .boolean()
    .optional()
    .describe(
      "Force markdown rendering to PDF (true=always render, false=never render, undefined=use config)"
    ),
  force_code_render: z
    .boolean()
    .optional()
    .describe(
      "Force code rendering to PDF with syntax highlighting (true=always render, false=never render, undefined=use config)"
    ),
}

/**
 * Registers the print_file tool with the MCP server.
 * Supports automatic rendering of markdown and code files to PDF before printing.
 * Accepts an array of files to print in batch operations.
 *
 * @param server - The McpServer instance to register the tool with
 */
export function registerPrintTools(server: McpServer) {
  server.registerTool(
    "print_file",
    {
      title: "Print File",
      description:
        "Print a file to a specified printer. Supports PDF, text, and other common formats. Can specify number of copies and print options.",
      inputSchema: {
        files: z
          .array(
            z.object({
              file_path: z.string().describe("Full path to the file to print"),
              printer: z
                .string()
                .optional()
                .describe(
                  "Printer name (use list_printers to see available printers). Optional if default printer is set."
                ),
              copies: z
                .number()
                .min(1)
                .optional()
                .default(1)
                .describe("Number of copies to print (default: 1)"),
              options: z
                .string()
                .optional()
                .describe(
                  "Additional CUPS options (e.g., 'landscape', 'sides=two-sided-long-edge')"
                ),
              skip_confirmation: z
                .boolean()
                .optional()
                .describe(
                  "Skip page count confirmation check (bypasses MCP_PRINTER_CONFIRM_IF_OVER_PAGES threshold)"
                ),
              ...renderingParametersSchema,
            })
          )
          .describe("Array of files to print (use single-element array for one file)"),
      },
    },
    async ({ files }) => {
      // Check for large batch size
      const batchSizeWarning = checkBatchSizeLimit(files.length, "files")
      if (batchSizeWarning) {
        return batchSizeWarning
      }

      // Process each file in the batch
      const results: PrintResult[] = []
      for (const fileSpec of files) {
        const result = await handlePrint(fileSpec)
        results.push(result)
      }

      return formatPrintResults(results)
    }
  )

  // Register get_page_meta tool
  server.registerTool(
    "get_page_meta",
    {
      title: "Get Page Metadata",
      description:
        "Get page count and physical sheet information for a file before printing. Pre-renders the file (if needed) and returns page metadata including page count and physical sheets required.",
      inputSchema: {
        files: z
          .array(
            z.object({
              file_path: z.string().describe("Full path to the file to get page metadata for"),
              options: z
                .string()
                .optional()
                .describe(
                  "Additional CUPS options for duplex detection (e.g., 'sides=two-sided-long-edge')"
                ),
              ...renderingParametersSchema,
            })
          )
          .describe("Array of files to get metadata for (use single-element array for one file)"),
      },
    },
    async ({ files }) => {
      // Check for large batch size
      const batchSizeWarning = checkBatchSizeLimit(files.length, "files")
      if (batchSizeWarning) {
        return batchSizeWarning
      }

      // Process each file in the batch
      const results: PageMetaResult[] = []
      for (const fileSpec of files) {
        const result = await handlePageMeta(fileSpec)
        results.push(result)
      }

      return formatPageMetaResults(results)
    }
  )
}
