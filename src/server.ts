/**
 * @fileoverview MCP Server implementation for macOS printing operations.
 * Provides a Model Context Protocol server that exposes printing tools via CUPS.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { tools, handleToolCall } from "./tools/index.js";

/**
 * MCP Server instance for macOS printing via CUPS.
 * Handles printer management, print jobs, and document rendering.
 */
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

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    return await handleToolCall(name, args);
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
  await server.connect(transport);
  console.error("MCP Printer Server running on stdio");
}

