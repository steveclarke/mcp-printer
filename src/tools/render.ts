import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { execCommand } from "../utils.js";
import { config } from "../config.js";
import { renderMarkdownToPdf } from "../renderers/markdown.js";

// Tool definition for rendering and printing markdown
export const renderTool: Tool = {
  name: "render_and_print_markdown",
  description: "Render a markdown file to PDF and print it. Uses pandoc and Chrome for high-quality rendering. Requires pandoc and Chrome/Chromium to be installed.",
  inputSchema: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "Full path to the markdown file to render and print",
      },
      printer: {
        type: "string",
        description: "Printer name (optional, uses default if not specified)",
      },
      copies: {
        type: "number",
        description: "Number of copies to print (default: 1)",
        default: 1,
      },
      options: {
        type: "string",
        description: "Additional CUPS options (e.g., 'landscape', 'sides=two-sided-long-edge')",
      },
    },
    required: ["file_path"],
  },
};

// Handler for render_and_print_markdown tool
export async function handleRenderMarkdown(args: any) {
  const { file_path, printer, copies = 1, options } = args as {
    file_path: string;
    printer?: string;
    copies?: number;
    options?: string;
  };

  let renderedPdf: string | null = null;

  try {
    // Render markdown to PDF
    renderedPdf = await renderMarkdownToPdf(file_path);
    
    // Print the PDF
    const targetPrinter = printer || config.DEFAULT_PRINTER;
    let command = "lpr";
    
    if (targetPrinter) {
      command += ` -P "${targetPrinter}"`;
    }
    
    if (copies > 1) {
      command += ` -#${copies}`;
    }
    
    let allOptions = [];
    if (config.DEFAULT_DUPLEX && !options?.includes("sides=")) {
      allOptions.push("sides=two-sided-long-edge");
    }
    if (config.DEFAULT_OPTIONS) {
      allOptions.push(...config.DEFAULT_OPTIONS.split(/\s+/));
    }
    if (options) {
      allOptions.push(...options.split(/\s+/));
    }
    
    if (allOptions.length > 0) {
      command += ` -o ${allOptions.join(" -o ")}`;
    }
    
    command += ` "${renderedPdf}"`;
    await execCommand(command);
    
    const printerName = targetPrinter || (await execCommand("lpstat -d")).split(": ")[1] || "default";
    
    let optionsInfo = "";
    if (allOptions.length > 0) {
      optionsInfo = `\n  Options: ${allOptions.join(", ")}`;
    }
    
    return {
      content: [{
        type: "text",
        text: `✓ Rendered and printed markdown file\n` +
              `  Printer: ${printerName}\n` +
              `  Copies: ${copies}${optionsInfo}\n` +
              `  Source: ${file_path}`,
      }],
    };
  } finally {
    // Clean up temp files
    if (renderedPdf) {
      try {
        await execCommand(`rm -f "${renderedPdf}"`);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

