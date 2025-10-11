import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { execCommand, shouldRenderToPdf, shouldRenderCode } from "../utils.js";
import { config } from "../config.js";
import { renderMarkdownToPdf } from "../renderers/markdown.js";
import { renderCodeToPdf } from "../renderers/code.js";

// Tool definition for printing files
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

// Handler for print_file tool
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
      // If rendering fails, fall back to printing original file
      console.error(`Warning: Failed to render ${file_path}, printing as-is:`, error);
    }
  }
  // Check if file should be rendered as code with syntax highlighting
  else if (shouldRenderCode(file_path)) {
    try {
      renderedPdf = await renderCodeToPdf(file_path);
      actualFilePath = renderedPdf;
      renderType = "code → PDF (syntax highlighted)";
    } catch (error) {
      // If rendering fails, fall back to printing original file
      console.error(`Warning: Failed to render code ${file_path}, printing as-is:`, error);
    }
  }

  try {
    let command = "lpr";
    
    // Use configured default printer if none specified
    const targetPrinter = printer || config.DEFAULT_PRINTER;
    if (targetPrinter) {
      command += ` -P "${targetPrinter}"`;
    }
    
    if (copies > 1) {
      command += ` -#${copies}`;
    }
    
    // Build options string with defaults
    let allOptions = [];
    
    // Add default duplex if configured and not overridden
    if (config.DEFAULT_DUPLEX && !options?.includes("sides=")) {
      allOptions.push("sides=two-sided-long-edge");
    }
    
    // Add default options if configured (split by spaces to handle multiple options)
    if (config.DEFAULT_OPTIONS) {
      allOptions.push(...config.DEFAULT_OPTIONS.split(/\s+/));
    }
    
    // Add user-specified options (these override defaults, split by spaces)
    if (options) {
      allOptions.push(...options.split(/\s+/));
    }
    
    if (allOptions.length > 0) {
      command += ` -o ${allOptions.join(" -o ")}`;
    }
    
    command += ` "${actualFilePath}"`;

    await execCommand(command);
    
    const printerName = targetPrinter || (await execCommand("lpstat -d")).split(": ")[1] || "default";
    
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
        await execCommand(`rm -f "${renderedPdf}"`);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

