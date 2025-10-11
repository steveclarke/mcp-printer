/**
 * @fileoverview File printing tool implementation.
 * Handles printing of various file types with optional rendering for markdown and code files.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { execCommand, shouldRenderToPdf, shouldRenderCode } from "../utils.js";
import { config } from "../config.js";
import { renderMarkdownToPdf } from "../renderers/markdown.js";
import { renderCodeToPdf } from "../renderers/code.js";
import { execa } from "execa";

/**
 * MCP tool definition for printing files to printers.
 * Supports automatic rendering of markdown and code files to PDF before printing.
 */
export const printTool: Tool = {
  name: "print_file",
  description:
    "Print a file to a specified printer. Supports PDF, text, and other common formats. Can specify number of copies and print options.",
  inputSchema: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "Full path to the file to print",
      },
      printer: {
        type: "string",
        description:
          "Printer name (use list_printers to see available printers). Optional if default printer is set.",
      },
      copies: {
        type: "number",
        description: "Number of copies to print (default: 1)",
        default: 1,
      },
      options: {
        type: "string",
        description:
          "Additional CUPS options (e.g., 'landscape', 'sides=two-sided-long-edge')",
      },
    },
    required: ["file_path"],
  },
};

/**
 * Handles the print_file tool invocation.
 * Automatically renders markdown and code files to PDF with appropriate formatting.
 * Sends the file to the specified or default printer using CUPS (lpr).
 * 
 * @param args - Tool arguments containing file_path, optional printer, copies, and options
 * @returns Tool result with success message and print details
 * @throws {Error} If printing fails
 */
export async function handlePrintFile(args: any) {
  const { file_path, printer, copies = 1, options } = args as {
    file_path: string;
    printer?: string;
    copies?: number;
    options?: string;
  };

  let actualFilePath = file_path;
  let renderedPdf: string | null = null;
  let renderType = "";

  // Check if file should be auto-rendered to PDF (markdown)
  if (shouldRenderToPdf(file_path)) {
    try {
      renderedPdf = await renderMarkdownToPdf(file_path);
      actualFilePath = renderedPdf;
      renderType = "markdown → PDF";
    } catch (error) {
      // If fallback is enabled, print original file; otherwise throw error
      if (config.fallbackOnRenderError) {
        console.error(`Warning: Failed to render ${file_path}, printing as-is:`, error);
      } else {
        throw error;
      }
    }
  }
  // Check if file should be rendered as code with syntax highlighting
  else if (shouldRenderCode(file_path)) {
    try {
      renderedPdf = await renderCodeToPdf(file_path);
      actualFilePath = renderedPdf;
      renderType = "code → PDF (syntax highlighted)";
    } catch (error) {
      // If fallback is enabled, print original file; otherwise throw error
      if (config.fallbackOnRenderError) {
        console.error(`Warning: Failed to render code ${file_path}, printing as-is:`, error);
      } else {
        throw error;
      }
    }
  }

  try {
    const args: string[] = [];
    
    // Use configured default printer if none specified
    const targetPrinter = printer || config.defaultPrinter;
    if (targetPrinter) {
      args.push('-P', targetPrinter);
    }
    
    if (copies > 1) {
      args.push(`-#${copies}`);
    }
    
    // Build options with defaults
    let allOptions = [];
    
    // Add default duplex if configured and not overridden
    if (config.enableDuplex && !options?.includes("sides=")) {
      allOptions.push("sides=two-sided-long-edge");
    }
    
    // Add default options if configured (split by spaces to handle multiple options)
    if (config.defaultOptions) {
      allOptions.push(...config.defaultOptions.split(/\s+/));
    }
    
    // Add user-specified options (these override defaults, split by spaces)
    if (options) {
      allOptions.push(...options.split(/\s+/));
    }
    
    // Add each option with -o flag
    for (const option of allOptions) {
      args.push('-o', option);
    }
    
    // Add file path
    args.push(actualFilePath);

    await execa('lpr', args);
    
    const printerName = targetPrinter || (await execCommand('lpstat', ['-d'])).split(": ")[1] || "default";
    
    let optionsInfo = "";
    if (allOptions.length > 0) {
      optionsInfo = `\n  Options: ${allOptions.join(", ")}`;
    }

    const renderedNote = renderType ? `\n  Rendered: ${renderType}` : "";
    
    return {
      content: [
        {
          type: "text",
          text: `✓ File sent to printer: ${printerName}\n` +
                `  Copies: ${copies}${optionsInfo}\n` +
                `  File: ${file_path}${renderedNote}`,
        },
      ],
    };
  } finally {
    // Clean up rendered PDF if it was created
    if (renderedPdf) {
      try {
        await execa('rm', ['-f', renderedPdf]);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

