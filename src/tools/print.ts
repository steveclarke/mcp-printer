/**
 * @fileoverview File printing tool implementation.
 * Handles printing of various file types with optional rendering for markdown and code files.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { unlinkSync } from "fs"
import { shouldRenderToPdf, executePrintJob, formatPrintResponse } from "../utils.js"
import { validateFilePath } from "../file-security.js"
import { config, MARKDOWN_EXTENSIONS } from "../config.js"
import { renderMarkdownToPdf } from "../renderers/markdown.js"
import { renderCodeToPdf, shouldRenderCode } from "../renderers/code.js"

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
          .describe("Additional CUPS options (e.g., 'landscape', 'sides=two-sided-long-edge')"),
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
      },
    },
    async ({
      file_path,
      printer,
      copies = 1,
      options,
      line_numbers,
      color_scheme,
      font_size,
      line_spacing,
      force_markdown_render,
      force_code_render,
    }) => {
      // Validate file path security
      validateFilePath(file_path)

      let actualFilePath = file_path
      let renderedPdf: string | null = null
      let renderType = ""

      // Check if file should be auto-rendered to PDF (markdown)
      // When forcing, check if it's a markdown file by extension
      const shouldRenderMarkdown =
        force_markdown_render !== undefined
          ? force_markdown_render &&
            MARKDOWN_EXTENSIONS.some((ext) => file_path.toLowerCase().endsWith(`.${ext}`))
          : shouldRenderToPdf(file_path)

      if (shouldRenderMarkdown) {
        try {
          renderedPdf = await renderMarkdownToPdf(file_path)
          actualFilePath = renderedPdf
          renderType = "markdown → PDF"
        } catch (error) {
          // If fallback is enabled, print original file; otherwise throw error
          if (config.fallbackOnRenderError) {
            console.error(`Warning: Failed to render ${file_path}, printing as-is:`, error)
          } else {
            throw error
          }
        }
      }
      // Check if file should be rendered as code with syntax highlighting
      else if (force_code_render !== undefined ? force_code_render : shouldRenderCode(file_path)) {
        try {
          renderedPdf = await renderCodeToPdf(file_path, {
            lineNumbers: line_numbers,
            colorScheme: color_scheme,
            fontSize: font_size,
            lineSpacing: line_spacing,
          })
          actualFilePath = renderedPdf
          renderType = "code → PDF (syntax highlighted)"
        } catch (error) {
          // If fallback is enabled, print original file; otherwise throw error
          if (config.fallbackOnRenderError) {
            console.error(`Warning: Failed to render code ${file_path}, printing as-is:`, error)
          } else {
            throw error
          }
        }
      }

      try {
        const { printerName, allOptions } = await executePrintJob(
          actualFilePath,
          printer,
          copies,
          options
        )
        return formatPrintResponse(printerName, copies, allOptions, file_path, renderType)
      } finally {
        // Clean up rendered PDF if it was created
        if (renderedPdf) {
          try {
            unlinkSync(renderedPdf)
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    }
  )
}
