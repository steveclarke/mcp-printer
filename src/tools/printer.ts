/**
 * @fileoverview Printer management tools implementation.
 * Provides tools for querying printers, managing print queues, and configuring defaults.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { execCommand } from "../utils.js"
import { config } from "../config.js"
import { execa } from "execa"

/**
 * Registers printer management tools with the MCP server.
 * Includes read-only tools (list, query, get) and optionally write tools (cancel, set default)
 * based on the MCP_PRINTER_ENABLE_MANAGEMENT configuration.
 *
 * @param server - The McpServer instance to register tools with
 */
export function registerPrinterTools(server: McpServer) {
  // get_config - Get current configuration settings
  server.registerTool(
    "get_config",
    {
      title: "Get Configuration",
      description:
        "Get the current MCP Printer configuration settings. Returns environment variables and their current values.",
      inputSchema: {},
    },
    () => {
      const configData = {
        MCP_PRINTER_DEFAULT_PRINTER: config.defaultPrinter || "(not set)",
        MCP_PRINTER_AUTO_DUPLEX: config.autoDuplex ? "true" : "false",
        MCP_PRINTER_DEFAULT_OPTIONS:
          config.defaultOptions.length > 0 ? config.defaultOptions.join(" ") : "(not set)",
        MCP_PRINTER_CHROME_PATH: config.chromePath || "(auto-detected)",
        MCP_PRINTER_AUTO_RENDER_MARKDOWN: config.autoRenderMarkdown ? "true" : "false",
        MCP_PRINTER_AUTO_RENDER_CODE: config.autoRenderCode ? "true" : "false",
        MCP_PRINTER_ENABLE_MANAGEMENT: config.enableManagement ? "true" : "false",
        MCP_PRINTER_ENABLE_PROMPTS: config.enablePrompts ? "true" : "false",
        MCP_PRINTER_CONFIRM_IF_OVER_PAGES:
          config.confirmIfOverPages > 0 ? String(config.confirmIfOverPages) : "0 (disabled)",
        MCP_PRINTER_ALLOWED_PATHS: config.allowedPaths.join(":"),
        MCP_PRINTER_DENIED_PATHS: config.deniedPaths.join(":"),
        MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS:
          config.code.excludeExtensions.length > 0
            ? config.code.excludeExtensions.join(", ")
            : "(not set)",
        MCP_PRINTER_CODE_COLOR_SCHEME: config.code.colorScheme,
        MCP_PRINTER_CODE_AUTO_LINE_NUMBERS: config.code.autoLineNumbers ? "true" : "false",
        MCP_PRINTER_CODE_FONT_SIZE: config.code.fontSize,
        MCP_PRINTER_CODE_LINE_SPACING: config.code.lineSpacing,
      }

      const configText = Object.entries(configData)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")

      return {
        content: [
          {
            type: "text",
            text: `Current MCP Printer Configuration:\n\n${configText}`,
          },
        ],
      }
    }
  )

  // list_printers - List all available printers
  server.registerTool(
    "list_printers",
    {
      title: "List Printers",
      description:
        "List all available printers on the system with their status. Returns printer names, states, and whether they're accepting jobs.",
      inputSchema: {},
    },
    async () => {
      const output = await execCommand("lpstat", ["-p", "-d"])
      return {
        content: [
          {
            type: "text",
            text: output || "No printers found",
          },
        ],
      }
    }
  )

  // get_print_queue - Check print queue
  server.registerTool(
    "get_print_queue",
    {
      title: "Get Print Queue",
      description:
        "Check the print queue for a specific printer or all printers. Shows pending and active print jobs.",
      inputSchema: {
        printer: z
          .string()
          .optional()
          .describe("Printer name to check queue for (optional, checks all if not specified)"),
      },
    },
    async ({ printer }) => {
      const lpqArgs: string[] = []
      if (printer) {
        lpqArgs.push("-P", printer)
      }

      const output = await execCommand("lpq", lpqArgs)
      return {
        content: [
          {
            type: "text",
            text: output || "No print jobs in queue",
          },
        ],
      }
    }
  )

  // get_default_printer - Get the default printer
  server.registerTool(
    "get_default_printer",
    {
      title: "Get Default Printer",
      description: "Get the name of the default printer",
      inputSchema: {},
    },
    async () => {
      const output = await execCommand("lpstat", ["-d"])
      const defaultPrinter = output.split(": ")[1] || "No default printer set"
      return {
        content: [
          {
            type: "text",
            text: `Default printer: ${defaultPrinter}`,
          },
        ],
      }
    }
  )

  // cancel_print_job - Only register if management is enabled
  if (config.enableManagement) {
    server.registerTool(
      "cancel_print_job",
      {
        title: "Cancel Print Job",
        description: "Cancel a specific print job by job ID or cancel all jobs for a printer.",
        inputSchema: {
          jobs: z
            .array(
              z.object({
                job_id: z
                  .string()
                  .optional()
                  .describe("Job ID to cancel (get from get_print_queue)"),
                printer: z
                  .string()
                  .optional()
                  .describe("Printer name (required if canceling all jobs)"),
                cancel_all: z
                  .boolean()
                  .optional()
                  .default(false)
                  .describe("Cancel all jobs for the specified printer"),
              })
            )
            .describe("Array of job cancellations (use single-element array for one job)"),
        },
      },
      async ({ jobs }) => {
        // Process each cancellation in the batch
        const results: CancelJobResult[] = []
        for (const jobSpec of jobs) {
          const result = await processSingleCancellation(jobSpec)
          results.push(result)
        }

        return formatBatchCancelResponse(results)
      }
    )
  }

  // set_default_printer - Only register if management is enabled
  if (config.enableManagement) {
    server.registerTool(
      "set_default_printer",
      {
        title: "Set Default Printer",
        description: "Set a printer as the default printer",
        inputSchema: {
          printer: z.string().describe("Printer name to set as default"),
        },
      },
      async ({ printer }) => {
        await execa("lpoptions", ["-d", printer])
        return {
          content: [
            {
              type: "text",
              text: `✓ Set default printer to: ${printer}`,
            },
          ],
        }
      }
    )
  }
}

/**
 * Type for a single job cancellation specification.
 */
interface JobCancelSpec {
  job_id?: string
  printer?: string
  cancel_all?: boolean
}

/**
 * Type for job cancellation result.
 */
interface CancelJobResult {
  success: boolean
  message: string
  error?: string
}

/**
 * Process a single job cancellation operation.
 */
async function processSingleCancellation(spec: JobCancelSpec): Promise<CancelJobResult> {
  const { job_id, printer, cancel_all = false } = spec

  try {
    const lprmArgs: string[] = []

    if (cancel_all && printer) {
      lprmArgs.push("-P", printer, "-")
    } else if (job_id) {
      if (printer) {
        lprmArgs.push("-P", printer)
      }
      lprmArgs.push(job_id)
    } else {
      return {
        success: false,
        message: "Invalid parameters",
        error: "Must provide either job_id or set cancel_all=true with printer",
      }
    }

    await execa("lprm", lprmArgs)

    return {
      success: true,
      message: cancel_all
        ? `Cancelled all jobs for printer: ${printer}`
        : `Cancelled job: ${job_id}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      message: cancel_all
        ? `Failed to cancel jobs for printer: ${printer}`
        : `Failed to cancel job: ${job_id}`,
      error: message,
    }
  }
}

/**
 * Format batch job cancellation results into a readable response.
 */
function formatBatchCancelResponse(results: CancelJobResult[]): {
  content: Array<{ type: "text"; text: string }>
} {
  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  let text = `Cancel Results: ${successful.length}/${results.length} successful`
  if (failed.length > 0) {
    text += `, ${failed.length} failed`
  }
  text += "\n\n"

  // Show successful cancellations
  for (const result of successful) {
    text += `✓ ${result.message}\n\n`
  }

  // Show failed cancellations
  for (const result of failed) {
    text += `✗ ${result.message}`
    if (result.error) {
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
