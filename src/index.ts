#!/usr/bin/env node

import { startServer } from "./server.js";

// Start the MCP Printer server
startServer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
