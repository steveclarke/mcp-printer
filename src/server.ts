/**
 * @fileoverview MCP Server implementation for printing operations.
 * Provides a Model Context Protocol server that exposes printing tools via CUPS.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import packageJson from "../package.json" with { type: "json" };

/**
 * MCP Server instance for printing via CUPS.
 * Handles printer management, print jobs, and document rendering.
 */
const mcpServer = new McpServer({
  name: "mcp-printer",
  version: packageJson.version,
});

// Register all tools with the server
registerAllTools(mcpServer);

/**
 * Starts the MCP Printer server and connects it to stdio transport.
 * The server will handle tool requests for printer operations via stdin/stdout.
 * 
 * @throws {Error} If server connection fails or unsupported OS detected
 */
export async function startServer() {
  // Check for unsupported operating systems
  if (process.platform === 'win32') {
    throw new Error(
      'MCP Printer is not supported on Windows. ' +
      'This server requires CUPS printing system, which is only available on macOS and Linux. ' +
      'Windows uses a different printing architecture that is not currently supported.'
    );
  }
  
  // Log platform information
  console.error(`MCP Printer Server starting on ${process.platform}...`);
  
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("MCP Printer Server running on stdio");
}
