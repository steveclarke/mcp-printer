/**
 * @fileoverview Printer management tools implementation.
 * Provides tools for querying printers, managing print queues, and configuring defaults.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { execCommand } from "../utils.js";
import { config } from "../config.js";

/**
 * Array of MCP tool definitions for printer management operations.
 * Includes tools for listing printers, managing queues, and configuration.
 */
export const printerTools: Tool[] = [
  {
    name: "get_config",
    description:
      "Get the current MCP Printer configuration settings. Returns environment variables and their current values.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_printers",
    description:
      "List all available printers on the system with their status. Returns printer names, states, and whether they're accepting jobs.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_print_queue",
    description:
      "Check the print queue for a specific printer or all printers. Shows pending and active print jobs.",
    inputSchema: {
      type: "object",
      properties: {
        printer: {
          type: "string",
          description:
            "Printer name to check queue for (optional, checks all if not specified)",
        },
      },
    },
  },
  {
    name: "cancel_print_job",
    description: "Cancel a specific print job by job ID or cancel all jobs for a printer.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: {
          type: "string",
          description: "Job ID to cancel (get from get_print_queue)",
        },
        printer: {
          type: "string",
          description: "Printer name (required if canceling all jobs)",
        },
        cancel_all: {
          type: "boolean",
          description: "Cancel all jobs for the specified printer",
          default: false,
        },
      },
    },
  },
  {
    name: "get_default_printer",
    description: "Get the name of the default printer",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "set_default_printer",
    description: "Set a printer as the default printer",
    inputSchema: {
      type: "object",
      properties: {
        printer: {
          type: "string",
          description: "Printer name to set as default",
        },
      },
      required: ["printer"],
    },
  },
];

/**
 * Handles printer management tool invocations.
 * Routes to appropriate CUPS commands for printer operations.
 * 
 * @param name - The printer tool name to invoke
 * @param args - Tool-specific arguments
 * @returns Tool result with requested printer information or confirmation
 * @throws {Error} If the tool name is unknown or the operation fails
 */
export async function handlePrinterTool(name: string, args: any) {
  switch (name) {
    case "get_config": {
      const configData = {
        MCP_PRINTER_DEFAULT: config.DEFAULT_PRINTER || "(not set)",
        MCP_PRINTER_DUPLEX: config.DEFAULT_DUPLEX ? "true" : "false",
        MCP_PRINTER_OPTIONS: config.DEFAULT_OPTIONS || "(not set)",
        MCP_PRINTER_CHROME_PATH: config.CHROME_PATH || "(auto-detected)",
        MCP_PRINTER_RENDER_EXTENSIONS: config.RENDER_EXTENSIONS.length > 0 
          ? config.RENDER_EXTENSIONS.join(", ") 
          : "(not set)",
        MCP_PRINTER_CODE_EXCLUDE: config.CODE_EXCLUDE || "(not set)",
        MCP_PRINTER_CODE_COLOR_SCHEME: config.CODE_COLOR_SCHEME,
        MCP_PRINTER_CODE_LINE_NUMBERS: config.CODE_LINE_NUMBERS ? "true" : "false",
        MCP_PRINTER_CODE_FONT_SIZE: config.CODE_FONT_SIZE,
        MCP_PRINTER_CODE_LINE_SPACING: config.CODE_LINE_SPACING
      };
      
      const configText = Object.entries(configData)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
      
      return {
        content: [
          {
            type: "text",
            text: `Current MCP Printer Configuration:\n\n${configText}`,
          },
        ],
      };
    }

    case "list_printers": {
      const output = await execCommand("lpstat -p -d");
      return {
        content: [
          {
            type: "text",
            text: output || "No printers found",
          },
        ],
      };
    }

    case "get_print_queue": {
      const { printer } = args as { printer?: string };
      
      let command = "lpq";
      if (printer) {
        command += ` -P "${printer}"`;
      }

      const output = await execCommand(command);
      return {
        content: [
          {
            type: "text",
            text: output || "No print jobs in queue",
          },
        ],
      };
    }

    case "cancel_print_job": {
      const { job_id, printer, cancel_all } = args as {
        job_id?: string;
        printer?: string;
        cancel_all?: boolean;
      };

      let command = "lprm";
      
      if (cancel_all && printer) {
        command += ` -P "${printer}" -`;
      } else if (job_id) {
        if (printer) {
          command += ` -P "${printer}"`;
        }
        command += ` ${job_id}`;
      } else {
        throw new Error("Must provide either job_id or set cancel_all=true with printer");
      }

      await execCommand(command);
      
      return {
        content: [
          {
            type: "text",
            text: cancel_all
              ? `✓ Cancelled all jobs for printer: ${printer}`
              : `✓ Cancelled job: ${job_id}`,
          },
        ],
      };
    }

    case "get_default_printer": {
      const output = await execCommand("lpstat -d");
      const defaultPrinter = output.split(": ")[1] || "No default printer set";
      return {
        content: [
          {
            type: "text",
            text: `Default printer: ${defaultPrinter}`,
          },
        ],
      };
    }

    case "set_default_printer": {
      const { printer } = args as { printer: string };
      await execCommand(`lpoptions -d "${printer}"`);
      return {
        content: [
          {
            type: "text",
            text: `✓ Set default printer to: ${printer}`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown printer tool: ${name}`);
  }
}

