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
  // print-code-review - Print code review with new files separately and modified file excerpts
  server.registerPrompt(
    "print-code-review",
    {
      title: "Print Code Review",
      description:
        "Print new files separately + create review doc with modified file excerpts for offline review",
      argsSchema: {
        context: z
          .string()
          .describe('What changed? Use "staged", "branch", "PR #X", or describe changes'),

        files: z.string().optional().describe("Specific files (comma-separated) or empty for all"),

        auto_print: z
          .string()
          .optional()
          .describe('Auto-print review doc? "true" or "false" (default: false)'),
      },
    },
    ({ context, files, auto_print }) => {
      const filesFilter = files ? `\nFOCUS ON: ${files}` : ""
      const shouldAutoPrint = auto_print === "true"
      const printInstruction = shouldAutoPrint
        ? "use print_file on the review doc"
        : "show the file path (DO NOT print automatically)"

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Print a code review package for offline review.

CONTEXT: ${context}${filesFilter}

INSTRUCTIONS:

1. **Determine what changed:**
   - If context is "staged": use git diff --cached
   - If context is "branch" or branch name: use git diff main...HEAD
   - If PR #X: analyze that PR's changes
   - Otherwise: use the description to find relevant files

2. **Print NEW files separately (avoid grey backgrounds):**
   - For EACH new file, use print_file tool individually
   - Example: print_file("src/adapters/printers-lib.ts")
   - These will get proper code highlighting without markdown backgrounds
   - DO NOT include full new file contents in the review doc

3. **Create ONE markdown review document with:**

   ## Header
   - Title describing the changes
   - Context and date
   
   ## New Files Section
   - List files that were printed separately
   - Note: "See separate printouts for full content"
   - Include file paths and line counts
   
   ## Modified Files Section
   For each modified file, show ONLY changed sections:
   - Function/method name with line numbers
   - Mark changes: "⚠️ CHANGE:", "← NEW:", "← REMOVED:"
   - 3-5 lines context before/after
   - Explanation of WHY it changed
   - Keep it focused - no full files!
   
   ## Summary
   - Count of new/modified files
   - Key changes overview
   - Performance/breaking changes if any
   - Testing notes

4. **Handle the review document:**
   - Save markdown to /Users/steve/src/mcp-printer/tmp/code-review-[timestamp].md
   - ${printInstruction}
   - User can review saved file and print manually if needed

IMPORTANT:
- New files = separate printouts (no grey backgrounds)
- Modified files = excerpts only in review doc
- Keep review doc focused and printer-friendly
- Reference new files from review doc
- Explain WHY changes were made

Execute this now for: ${context}`,
            },
          },
        ],
      }
    }
  )
}
