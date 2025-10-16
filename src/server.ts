/**
 * @fileoverview MCP Server implementation for printing operations.
 * Provides a Model Context Protocol server that exposes printing tools.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { registerAllTools } from "./tools/index.js"
import packageJson from "../package.json" with { type: "json" }
import { listAllPrinters } from "./adapters/printers-lib.js"

/**
 * MCP Server instance for printing operations.
 * Handles printer management, print jobs, and document rendering.
 */
const mcpServer = new McpServer({
  name: "mcp-printer",
  version: packageJson.version,
})

// Register all tools with the server
registerAllTools(mcpServer)

/**
 * Starts the MCP Printer server and connects it to stdio transport.
 * The server will handle tool requests for printer operations via stdin/stdout.
 *
 * @throws {Error} If server connection fails or unsupported OS detected
 */
export async function startServer() {
  // Log platform information
  console.error(`MCP Printer Server starting on ${process.platform}...`)

  // Health check: verify the printing library can load and enumerate printers
  try {
    console.error("Running printer library health check...")
    listAllPrinters()
    console.error("✓ Printer library initialized successfully")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("✗ Failed to initialize @printers/printers library")
    console.error(`  Error: ${message}`)
    console.error(`  Platform: ${process.platform} ${process.arch}`)
    console.error(`  Node version: ${process.version}`)
    console.error("")
    console.error("The native printing library could not be loaded. This may indicate:")
    console.error("  - Missing system dependencies")
    console.error("    * macOS/Linux: CUPS printing system")
    console.error("    * Windows: WinSpool drivers")
    console.error("  - Incompatible platform or architecture")
    console.error("  - Native addon build issues")
    console.error("")
    console.error("Please check the documentation for troubleshooting steps.")
    throw new Error(`Printer library initialization failed: ${message}`)
  }

  const transport = new StdioServerTransport()
  await mcpServer.connect(transport)
  console.error("MCP Printer Server running on stdio")
}
