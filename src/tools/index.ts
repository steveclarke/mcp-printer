/**
 * @fileoverview Central tool registry.
 * Registers all MCP tools with the server instance.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPrinterTools } from "./printer.js";
import { registerPrintTools } from "./print.js";
import { registerRenderTools } from "./render.js";

/**
 * Registers all available MCP tools with the given server.
 * Includes printer management tools, file printing, and markdown rendering.
 * Write operations (set_default_printer, cancel_print_job) are conditionally
 * registered based on the MCP_PRINTER_DISABLE_MANAGEMENT configuration.
 * 
 * @param server - The McpServer instance to register tools with
 */
export function registerAllTools(server: McpServer) {
  registerPrinterTools(server);
  registerPrintTools(server);
  registerRenderTools(server);
}
