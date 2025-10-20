/**
 * @fileoverview File printing tool implementation.
 * Handles printing of various file types with optional rendering for markdown and code files.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  executePrintJob,
  getPdfPageCount,
  calculatePhysicalSheets,
  shouldTriggerConfirmation,
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
 * Type for a single file print specification.
 */
interface FilePrintSpec {
  file_path: string
  printer?: string
  copies?: number
  options?: string
  skip_confirmation?: boolean
  line_numbers?: boolean
  color_scheme?: string
  font_size?: string
  line_spacing?: string
  force_markdown_render?: boolean
  force_code_render?: boolean
}

/**
 * Type for print operation result.
 */
interface PrintResult {
  success: boolean
  file_path: string
  message: string
  error?: string
}

/**
 * Process a single file print operation.
 */
async function processSinglePrint(spec: FilePrintSpec): Promise<PrintResult> {
  const {
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
  } = spec

  try {
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

          // If exceeds threshold, return error indicating confirmation needed
          if (shouldTriggerConfirmation(physicalSheets)) {
            return {
              success: false,
              file_path,
              message: `Confirmation required: ${pdfPages} pages (${physicalSheets} sheets${isDuplex ? ", duplex" : ""})`,
              error: "PAGE_COUNT_CONFIRMATION_REQUIRED",
            }
          }
        } catch {
          // Not a PDF or failed to parse - just continue with normal print
          // (This is expected for plain text files, images, etc.)
        }
      }

      // Execute print job
      const { printerName } = await executePrintJob(actualFilePath, printer, copies, options)

      const renderInfo = renderType ? ` (rendered: ${renderType})` : ""
      const copiesInfo = copies > 1 ? ` × ${copies} copies` : ""
      return {
        success: true,
        file_path,
        message: `Printed to ${printerName}${copiesInfo}${renderInfo}`,
      }
    } finally {
      // Clean up rendered PDF if it was created
      cleanupRenderedPdf(renderedPdf)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      file_path,
      message: `Failed to print`,
      error: message,
    }
  }
}

/**
 * Format batch print results into a readable response.
 */
function formatBatchPrintResponse(results: PrintResult[]): {
  content: Array<{ type: "text"; text: string }>
} {
  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  let text = `Print Results: ${successful.length}/${results.length} successful`
  if (failed.length > 0) {
    text += `, ${failed.length} failed`
  }
  text += "\n\n"

  // Show successful prints
  for (const result of successful) {
    text += `✓ ${result.file_path}\n  ${result.message}\n\n`
  }

  // Show failed prints
  for (const result of failed) {
    text += `✗ ${result.file_path}\n  ${result.message}`
    if (result.error && result.error !== "PAGE_COUNT_CONFIRMATION_REQUIRED") {
      text += `: ${result.error}`
    }
    text += "\n\n"
  }

  return {
    content: [
      {
        type: "text" as const,
        text: text.trim(),
      },
    ],
  }
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
      // Process each file in the batch
      const results: PrintResult[] = []
      for (const fileSpec of files) {
        const result = await processSinglePrint(fileSpec)
        results.push(result)
      }

      return formatBatchPrintResponse(results)
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
      // Process each file in the batch
      const results: PageMetaResult[] = []
      for (const fileSpec of files) {
        const result = await processSinglePageMeta(fileSpec)
        results.push(result)
      }

      return formatBatchPageMetaResponse(results)
    }
  )
}

/**
 * Type for a single file page metadata specification.
 */
interface FilePageMetaSpec {
  file_path: string
  options?: string
  line_numbers?: boolean
  color_scheme?: string
  font_size?: string
  line_spacing?: string
  force_markdown_render?: boolean
  force_code_render?: boolean
}

/**
 * Type for page metadata result.
 */
interface PageMetaResult {
  success: boolean
  file_path: string
  pages?: number
  sheets?: number
  duplex?: boolean
  renderType?: string
  error?: string
}

/**
 * Process a single file page metadata operation.
 */
async function processSinglePageMeta(spec: FilePageMetaSpec): Promise<PageMetaResult> {
  const {
    file_path,
    options,
    line_numbers,
    color_scheme,
    font_size,
    line_spacing,
    force_markdown_render,
    force_code_render,
  } = spec

  try {
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

      return {
        success: true,
        file_path,
        pages: pdfPages,
        sheets: physicalSheets,
        duplex: isDuplex,
        renderType,
      }
    } finally {
      // Clean up rendered PDF if it was created
      cleanupRenderedPdf(renderedPdf)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      file_path,
      error: message,
    }
  }
}

/**
 * Format batch page metadata results into a readable response.
 */
function formatBatchPageMetaResponse(results: PageMetaResult[]): {
  content: Array<{ type: "text"; text: string }>
} {
  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  let text = `Page Metadata Results: ${successful.length}/${results.length} successful`
  if (failed.length > 0) {
    text += `, ${failed.length} failed`
  }
  text += "\n\n"

  // Show successful metadata
  for (const result of successful) {
    const duplexInfo = result.duplex ? ", duplex" : ""
    const renderInfo = result.renderType ? ` (rendered: ${result.renderType})` : ""
    text += `✓ ${result.file_path}\n  ${result.pages} pages (${result.sheets} sheets${duplexInfo})${renderInfo}\n\n`
  }

  // Show failed metadata
  for (const result of failed) {
    text += `✗ ${result.file_path}\n  Failed to get page metadata: ${result.error}\n\n`
  }

  return {
    content: [
      {
        type: "text" as const,
        text: text.trim(),
      },
    ],
  }
}
