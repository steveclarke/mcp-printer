/**
 * @fileoverview MCP prompts implementation.
 * Provides reusable prompt templates for common workflows.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers prompts with the MCP server.
 * Prompts are user-driven templates that appear as slash commands in the UI.
 * 
 * @param server - The McpServer instance to register prompts with
 */
export function registerPrompts(server: McpServer) {
  // print-review-package - Print source code and documentation for offline review
  server.registerPrompt(
    'print-review-package',
    {
      title: 'Print Review Package',
      description: 'Print source code and documentation for offline review',
      argsSchema: {
        directory: z.string()
          .optional()
          .describe('Directory to review (e.g., "src/", ".", "/path/to/project"). Defaults to current directory'),
        
        include_source: z.string()
          .optional()
          .describe('Include source code files? (yes/no, default: yes)'),
        
        include_docs: z.string()
          .optional()
          .describe('Include documentation files? (yes/no, default: yes)'),
        
        include_tests: z.string()
          .optional()
          .describe('Include test files? (yes/no, default: no)'),
        
        copies: z.string()
          .optional()
          .describe('Number of copies to print (default: 1)')
      }
    },
    ({ directory = '.', include_source = 'yes', include_docs = 'yes', include_tests = 'no', copies = '1' }) => {
      const shouldIncludeSource = include_source.toLowerCase() !== 'no';
      const shouldIncludeDocs = include_docs.toLowerCase() !== 'no';
      const shouldIncludeTests = include_tests.toLowerCase() === 'yes';
      const numCopies = parseInt(copies) || 1;
      
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `I need to review code offline. Please prepare a review package from ${directory}:

WHAT TO PRINT:
${shouldIncludeSource ? '✓ Source code files (.ts, .js, .py, .go, .java, .cpp, .c, .rs, etc.)' : '✗ Skip source code'}
${shouldIncludeDocs ? '✓ Documentation files (README.md, CONTRIBUTING.md, *.md)' : '✗ Skip documentation'}
${shouldIncludeTests ? '✓ Test files (*test.*, *spec.*, __tests__/)' : '✗ Skip tests'}

INSTRUCTIONS:
1. Find all matching files in ${directory}
   - Exclude: node_modules/, dist/, build/, .git/, coverage/
   - Source files: common code extensions
   - Docs: README.md first, then other .md files alphabetically

2. Print files in this order:
   a) README.md (if exists and include_docs is true)
   b) Other documentation files alphabetically
   c) Source files organized by directory structure
   d) Test files last (if included)

3. For each file:
   - Use syntax highlighting for code files
   - Use markdown rendering for .md files
   - Add clear separators between files
   - Include file path in header

4. Print settings:
   - ${numCopies} cop${numCopies > 1 ? 'ies' : 'y'}
   - Double-sided to save paper
   - GitHub color scheme
   - 8pt font for code compactness

This should give me a complete review package I can read offline.`
          }
        }]
      };
    }
  );
}

