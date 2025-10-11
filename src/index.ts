#!/usr/bin/env node

/**
 * @fileoverview Entry point for the MCP Printer server.
 * Starts the Model Context Protocol server for macOS printing operations via CUPS.
 */

import { startServer } from "./server.js";

// Start the MCP Printer server
startServer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
