/**
 * @fileoverview Central tool registry and dispatcher.
 * Combines all MCP tools and routes tool calls to appropriate handlers.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { printerTools, handlePrinterTool } from "./printer.js";
import { printTool, handlePrintFile } from "./print.js";
import { renderTool, handleRenderMarkdown } from "./render.js";
import { config } from "../config.js";

/**
 * Combined array of all available MCP tools.
 * Includes printer management tools, file printing, and markdown rendering.
 * When management is disabled, write operations (set_default_printer, cancel_print_job) are excluded.
 */
export const tools: Tool[] = config.disableManagement
  ? [
      ...printerTools.filter(tool => 
        tool.name !== 'set_default_printer' && tool.name !== 'cancel_print_job'
      ),
      printTool,
      renderTool
    ]
  : [...printerTools, printTool, renderTool];

/**
 * Routes tool calls to the appropriate handler based on tool name.
 * 
 * @param name - The name of the tool to invoke
 * @param args - Arguments to pass to the tool handler
 * @returns Tool execution result with content array
 * @throws {Error} If the tool name is unknown or disabled when management is disabled
 */
export async function handleToolCall(name: string, args: any) {
  // Check if management is disabled and tool is a write operation
  const writeOperations = ["set_default_printer", "cancel_print_job"];
  if (config.disableManagement && writeOperations.includes(name)) {
    throw new Error(
      `Tool "${name}" is disabled. Management operations are not allowed. ` +
      `To enable management tools, set MCP_PRINTER_DISABLE_MANAGEMENT=false.`
    );
  }
  
  // Printer tools (all management tools)
  const managementTools = ["get_config", "list_printers", "get_print_queue", "cancel_print_job", "get_default_printer", "set_default_printer"];
  if (managementTools.includes(name)) {
    return await handlePrinterTool(name, args);
  }
  
  // Print tool
  if (name === "print_file") {
    return await handlePrintFile(args);
  }
  
  // Render tool
  if (name === "render_and_print_markdown") {
    return await handleRenderMarkdown(args);
  }
  
  throw new Error(`Unknown tool: ${name}`);
}

