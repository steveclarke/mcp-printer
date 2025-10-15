/**
 * @fileoverview File printing tool implementation.
 * Handles printing of various file types with optional rendering for markdown and code files.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  executePrintJob,
  formatPrintResponse,
  getPdfPageCount,
  calculatePhysicalSheets,
  shouldTriggerConfirmation,
  formatPreviewResponse,
  prepareFileForPrinting,
  isDuplexEnabled,
  cleanupRenderedPdf,
} from "../utils.js"
import { config } from "../config.js"

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
          .describe("Additional print options (e.g., 'landscape', 'sides=two-sided-long-edge')"),
        skip_confirmation: z
          .boolean()
          .optional()
          .describe(
            "Skip page count confirmation check (bypasses MCP_PRINTER_CONFIRM_IF_OVER_PAGES threshold)"
          ),
        ...renderingParametersSchema,
      },
    },
    async ({
      file_path,
      printer,
      copies = 1,
      options,
      skip_confirmation,
      line_numbers,
      color_scheme,
      font_size,
      line_spacing,
      force_markdown_render,
      force_code_render,
    }) => {
      // Use shared rendering function
      const { actualFilePath, renderedPdf, renderType } = await prepareFileForPrinting({
        filePath: file_path,
        lineNumbers: line_numbers,
        colorScheme: color_scheme,
        fontSize: font_size,
        lineSpacing: line_spacing,
        forceMarkdownRender: force_markdown_render,
        forceCodeRender: force_code_render,
      })

      try {
        // Check if we need to trigger page count confirmation
        // Try to parse as PDF - if it works, do the page count check. If it fails, it's not a PDF.
        if (!skip_confirmation && config.confirmIfOverPages > 0) {
          try {
            const pdfPages = await getPdfPageCount(actualFilePath)
            const isDuplex = isDuplexEnabled(options)
            const physicalSheets = calculatePhysicalSheets(pdfPages, isDuplex)

            // If exceeds threshold, return preview instead of printing
            if (shouldTriggerConfirmation(physicalSheets)) {
              return formatPreviewResponse(
                pdfPages,
                physicalSheets,
                isDuplex,
                file_path,
                renderType,
                true
              )
            }
          } catch {
            // Not a PDF or failed to parse - just continue with normal print
            // (This is expected for plain text files, images, etc.)
          }
        }

        // Execute print job
        const { printerName, allOptions } = await executePrintJob(
          actualFilePath,
          printer,
          copies,
          options
        )
        return formatPrintResponse(printerName, copies, allOptions, file_path, renderType)
      } finally {
        // Clean up rendered PDF if it was created
        cleanupRenderedPdf(renderedPdf)
      }
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
        file_path: z.string().describe("Full path to the file to get page metadata for"),
        options: z
          .string()
          .optional()
          .describe(
            "Additional print options for duplex detection (e.g., 'sides=two-sided-long-edge')"
          ),
        ...renderingParametersSchema,
      },
    },
    async ({
      file_path,
      options,
      line_numbers,
      color_scheme,
      font_size,
      line_spacing,
      force_markdown_render,
      force_code_render,
    }) => {
      // Use shared rendering function
      const { actualFilePath, renderedPdf, renderType } = await prepareFileForPrinting({
        filePath: file_path,
        lineNumbers: line_numbers,
        colorScheme: color_scheme,
        fontSize: font_size,
        lineSpacing: line_spacing,
        forceMarkdownRender: force_markdown_render,
        forceCodeRender: force_code_render,
      })

      try {
        // Get page count from the file
        const pdfPages = await getPdfPageCount(actualFilePath)
        const isDuplex = isDuplexEnabled(options)
        const physicalSheets = calculatePhysicalSheets(pdfPages, isDuplex)

        // Return preview info (without threshold warning)
        return formatPreviewResponse(pdfPages, physicalSheets, isDuplex, file_path, renderType)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to get page metadata: ${message}`)
      } finally {
        // Clean up rendered PDF if it was created
        cleanupRenderedPdf(renderedPdf)
      }
    }
  )
}
