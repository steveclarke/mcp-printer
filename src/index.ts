#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Configuration from environment variables
const DEFAULT_PRINTER = process.env.MCP_PRINTER_DEFAULT || "";
const DEFAULT_DUPLEX = process.env.MCP_PRINTER_DUPLEX === "true";
const DEFAULT_OPTIONS = process.env.MCP_PRINTER_OPTIONS || "";

// MCP Server for macOS printing via CUPS
const server = new Server(
  {
    name: "mcp-printer-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to execute shell commands
async function execCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    return stdout.trim();
  } catch (error) {
    throw new Error(`Command failed: ${error}`);
  }
}

// Tool definitions
const tools: Tool[] = [
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
    name: "print_file",
    description:
      "Print a file to a specified printer. Supports PDF, text, and other common formats. Can specify number of copies and print options.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Full path to the file to print",
        },
        printer: {
          type: "string",
          description:
            "Printer name (use list_printers to see available printers). Optional if default printer is set.",
        },
        copies: {
          type: "number",
          description: "Number of copies to print (default: 1)",
          default: 1,
        },
        options: {
          type: "string",
          description:
            "Additional CUPS options (e.g., 'landscape', 'sides=two-sided-long-edge')",
        },
      },
      required: ["file_path"],
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

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
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

      case "print_file": {
        const { file_path, printer, copies = 1, options } = args as {
          file_path: string;
          printer?: string;
          copies?: number;
          options?: string;
        };

        let command = "lpr";
        
        // Use configured default printer if none specified
        const targetPrinter = printer || DEFAULT_PRINTER;
        if (targetPrinter) {
          command += ` -P "${targetPrinter}"`;
        }
        
        if (copies > 1) {
          command += ` -#${copies}`;
        }
        
        // Build options string with defaults
        let allOptions = [];
        
        // Add default duplex if configured and not overridden
        if (DEFAULT_DUPLEX && !options?.includes("sides=")) {
          allOptions.push("sides=two-sided-long-edge");
        }
        
        // Add default options if configured
        if (DEFAULT_OPTIONS) {
          allOptions.push(DEFAULT_OPTIONS);
        }
        
        // Add user-specified options (these override defaults)
        if (options) {
          allOptions.push(options);
        }
        
        if (allOptions.length > 0) {
          command += ` -o ${allOptions.join(" -o ")}`;
        }
        
        command += ` "${file_path}"`;

        await execCommand(command);
        
        const printerName = targetPrinter || (await execCommand("lpstat -d")).split(": ")[1] || "default";
        
        let optionsInfo = "";
        if (allOptions.length > 0) {
          optionsInfo = `\n  Options: ${allOptions.join(", ")}`;
        }
        
        return {
          content: [
            {
              type: "text",
              text: `✓ File sent to printer: ${printerName}\n` +
                    `  Copies: ${copies}${optionsInfo}\n` +
                    `  File: ${file_path}`,
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
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Printer Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

