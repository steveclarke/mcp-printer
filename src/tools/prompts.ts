/**
 * @fileoverview MCP prompts implementation.
 * Provides reusable prompt templates for common workflows.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

/**
 * Registers prompts with the MCP server.
 * Prompts are user-driven templates that appear as slash commands in the UI.
 *
 * @param server - The McpServer instance to register prompts with
 */
export function registerPrompts(server: McpServer) {
  // print-changed - Print files that have changed (staged, uncommitted, or in branch)
  server.registerPrompt(
    "print-changed",
    {
      title: "Print Changed Files",
      description: "Print files that have changed (staged, uncommitted, or in branch)",
      argsSchema: {
        context: z
          .string()
          .describe('What to print? "staged", "uncommitted", "branch", or branch name'),

        options: z.string().optional().describe('Print options (e.g., "landscape duplex")'),
      },
    },
    ({ context, options }) => {
      const printOpts = options ? `\nPRINT OPTIONS: ${options}` : ""

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Print changed files for offline review.

CONTEXT: ${context}${printOpts}

INSTRUCTIONS:

1. Find changed files based on context:
   - "staged": Use git diff --cached --name-only
   - "uncommitted": Use git diff --name-only (unstaged changes)
   - "branch": Use git diff main...HEAD --name-only
   - [branch name]: Use git diff main...[branch] --name-only

2. For each changed file:
   - Use print_file tool
   - Apply consistent print settings${printOpts ? ` (${options})` : ""}
   - Example: print_file("src/server.ts"${options ? `, options="${options}"` : ""})

3. Report what was printed:
   - List file names
   - Count of files printed
   - Any files skipped (if binary, too large, etc.)

Execute this now for: ${context}`,
            },
          },
        ],
      }
    }
  )
}
