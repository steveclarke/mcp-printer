import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { printerTools, handlePrinterTool } from "./printer.js";
import { printTool, handlePrintFile } from "./print.js";
import { renderTool, handleRenderMarkdown } from "./render.js";

// Combine all tools
export const tools: Tool[] = [
  ...printerTools,
  printTool,
  renderTool,
];

// Unified handler that routes to appropriate module
export async function handleToolCall(name: string, args: any) {
  // Printer tools
  if (["get_config", "list_printers", "get_print_queue", "cancel_print_job", "get_default_printer", "set_default_printer"].includes(name)) {
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

