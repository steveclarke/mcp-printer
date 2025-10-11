#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import hljs from "highlight.js";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

// Configuration from environment variables
const DEFAULT_PRINTER = process.env.MCP_PRINTER_DEFAULT || "";
const DEFAULT_DUPLEX = process.env.MCP_PRINTER_DUPLEX === "true";
const DEFAULT_OPTIONS = process.env.MCP_PRINTER_OPTIONS || "";
const CHROME_PATH = process.env.MCP_PRINTER_CHROME_PATH || "";
const RENDER_EXTENSIONS = process.env.MCP_PRINTER_RENDER_EXTENSIONS 
  ? process.env.MCP_PRINTER_RENDER_EXTENSIONS.split(',').map(e => e.trim().toLowerCase())
  : [];

// Code rendering configuration
const CODE_EXCLUDE = process.env.MCP_PRINTER_CODE_EXCLUDE || "";
const CODE_EXCLUDE_LIST = CODE_EXCLUDE ? CODE_EXCLUDE.split(',').map(e => e.trim().toLowerCase()) : [];
const CODE_COLOR_SCHEME = process.env.MCP_PRINTER_CODE_COLOR_SCHEME || "atom-one-light";
const CODE_LINE_NUMBERS = process.env.MCP_PRINTER_CODE_LINE_NUMBERS !== "false";
const CODE_FONT_SIZE = process.env.MCP_PRINTER_CODE_FONT_SIZE || "10pt";
const CODE_LINE_SPACING = process.env.MCP_PRINTER_CODE_LINE_SPACING || "1.5";

// MCP Server for macOS printing via CUPS
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

// Helper function to execute shell commands
async function execCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    return stdout.trim();
  } catch (error) {
    throw new Error(`Command failed: ${error}`);
  }
}

// Check if a command/dependency exists
async function checkDependency(command: string, name: string): Promise<void> {
  try {
    await execCommand(`which ${command}`);
  } catch {
    throw new Error(`${name} not found. Install with: brew install ${command}`);
  }
}

// Find Chrome/Chromium installation
async function findChrome(): Promise<string | null> {
  // Check environment variable first
  if (CHROME_PATH) {
    try {
      await execCommand(`test -f "${CHROME_PATH}"`);
      return CHROME_PATH;
    } catch {
      // If specified path doesn't exist, continue to auto-detection
    }
  }

  // macOS paths
  const macPaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  ];

  for (const path of macPaths) {
    try {
      await execCommand(`test -f "${path}"`);
      return path;
    } catch {
      // Continue to next path
    }
  }

  // Linux paths
  const linuxCommands = ["google-chrome", "chromium", "chromium-browser"];
  for (const cmd of linuxCommands) {
    try {
      const path = await execCommand(`which ${cmd}`);
      if (path) return path;
    } catch {
      // Continue to next command
    }
  }

  return null;
}

// Check if file extension should be auto-rendered to PDF
function shouldRenderToPdf(filePath: string): boolean {
  if (RENDER_EXTENSIONS.length === 0) return false;
  
  const ext = filePath.split('.').pop()?.toLowerCase() || "";
  return RENDER_EXTENSIONS.includes(ext);
}

// Check if file should be rendered as code with syntax highlighting
function shouldRenderCode(filePath: string): boolean {
  // If CODE_EXCLUDE is "all", disable all code rendering
  if (CODE_EXCLUDE === "all") return false;
  
  const ext = filePath.split('.').pop()?.toLowerCase() || "";
  
  // Check if extension is in the exclusion list
  if (CODE_EXCLUDE_LIST.includes(ext)) return false;
  
  // Try to get language from extension - if highlight.js knows it, render it
  const language = getLanguageFromExtension(ext);
  return language !== "";
}

// Map file extension to highlight.js language identifier
function getLanguageFromExtension(ext: string): string {
  const languageMap: { [key: string]: string } = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'fish': 'bash',
    'ps1': 'powershell',
    'sql': 'sql',
    'r': 'r',
    'lua': 'lua',
    'perl': 'perl',
    'pl': 'perl',
    'vim': 'vim',
    'yaml': 'yaml',
    'yml': 'yaml',
    'json': 'json',
    'xml': 'xml',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'md': 'markdown',
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
    'mk': 'makefile',
  };
  
  return languageMap[ext] || ext;
}

// Fix multiline spans - ensure spans don't break across lines
function fixMultilineSpans(text: string): string {
  let classes: string[] = [];
  const spanRegex = /<(\/?)span(.*?)>/g;
  const tagAttrRegex = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/g;

  return text.split("\n").map(line => {
    const pre = classes.map(classVal => `<span class="${classVal}">`);

    let spanMatch;
    spanRegex.lastIndex = 0;
    while ((spanMatch = spanRegex.exec(line)) !== null) {
      if (spanMatch[1] !== "") {
        classes.pop();
        continue;
      }
      let attrMatch;
      tagAttrRegex.lastIndex = 0;
      while ((attrMatch = tagAttrRegex.exec(spanMatch[2])) !== null) {
        if (attrMatch[1].toLowerCase().trim() === "class") {
          classes.push(attrMatch[2]);
        }
      }
    }

    return `${pre.join("")}${line}${"</span>".repeat(classes.length)}`;
  }).join("\n");
}

// Core markdown rendering logic
async function renderMarkdownToPdf(filePath: string): Promise<string> {
  // Check dependencies
  await checkDependency("pandoc", "pandoc");
  const chromePath = await findChrome();
  if (!chromePath) {
    throw new Error("Chrome not found. Install Google Chrome or set MCP_PRINTER_CHROME_PATH environment variable.");
  }

  // Create temp files
  const tmpHtml = `/tmp/mcp-printer-${Date.now()}.html`;
  const tmpPdf = `/tmp/mcp-printer-${Date.now()}.pdf`;

  // Convert markdown to HTML
  await execCommand(`pandoc "${filePath}" -o "${tmpHtml}"`);
  
  // Convert HTML to PDF with Chrome
  // Note: Chrome outputs success messages to stderr, so we use execAsync directly
  try {
    await execAsync(`"${chromePath}" --headless --disable-gpu --print-to-pdf="${tmpPdf}" "${tmpHtml}"`);
  } catch (error: any) {
    // Chrome might output to stderr even on success, check if PDF was created
    const { stdout, stderr } = error;
    if (!stderr || !stderr.includes('written to file')) {
      throw new Error(`Failed to render PDF: ${error.message}`);
    }
    // Success - Chrome wrote the PDF and reported to stderr
  }
  
  // Clean up HTML file
  try {
    await execCommand(`rm -f "${tmpHtml}"`);
  } catch {
    // Ignore cleanup errors
  }

  return tmpPdf;
}

// Core code rendering logic with syntax highlighting
async function renderCodeToPdf(filePath: string): Promise<string> {
  const chromePath = await findChrome();
  if (!chromePath) {
    throw new Error("Chrome not found. Install Google Chrome or set MCP_PRINTER_CHROME_PATH environment variable.");
  }

  // Read source code file
  const sourceCode = readFileSync(filePath, 'utf-8');
  
  // Get file extension and language
  const ext = filePath.split('.').pop()?.toLowerCase() || "";
  const language = getLanguageFromExtension(ext);
  
  // Syntax highlight the code
  let highlightedCode = "";
  try {
    highlightedCode = hljs.highlight(sourceCode, { language }).value;
    // If no keywords were highlighted, try auto-detect
    if (!highlightedCode.includes('hljs-')) {
      highlightedCode = hljs.highlightAuto(sourceCode).value;
    }
  } catch (error) {
    // Fall back to auto-detect
    highlightedCode = hljs.highlightAuto(sourceCode).value;
  }
  
  // Fix multiline spans
  highlightedCode = fixMultilineSpans(highlightedCode);
  
  // Build table rows with optional line numbers
  let tableRows = "";
  const lines = highlightedCode.split("\n");
  
  if (CODE_LINE_NUMBERS) {
    tableRows = lines
      .map(line => line || "&nbsp;")
      .map((line, i) => `<tr><td class="line-number">${i + 1}</td><td class="line-text">${line}</td></tr>`)
      .join("\n");
  } else {
    tableRows = lines
      .map(line => line || "&nbsp;")
      .map(line => `<tr><td class="line-text">${line}</td></tr>`)
      .join("\n");
  }
  
  // Get color scheme CSS
  let colorSchemeCSS = "";
  try {
    // Find highlight.js styles directory (node_modules relative to this module)
    const stylesDir = join(__dirname, '../node_modules/highlight.js/styles');
    const themeFileName = CODE_COLOR_SCHEME + '.css';
    const themePath = join(stylesDir, themeFileName);
    
    try {
      colorSchemeCSS = readFileSync(themePath, 'utf-8');
    } catch {
      // Try .min.css version
      const minThemePath = join(stylesDir, `${CODE_COLOR_SCHEME}.min.css`);
      colorSchemeCSS = readFileSync(minThemePath, 'utf-8');
    }
  } catch (error) {
    // Fall back to default if theme not found
    try {
      const defaultPath = join(__dirname, '../node_modules/highlight.js/styles/default.css');
      colorSchemeCSS = readFileSync(defaultPath, 'utf-8');
    } catch {
      // If all else fails, use minimal inline CSS
      colorSchemeCSS = `
        .hljs { display: block; overflow-x: auto; padding: 0.5em; background: #f0f0f0; }
        .hljs-keyword { color: #0000ff; font-weight: bold; }
        .hljs-string { color: #008000; }
        .hljs-comment { color: #808080; font-style: italic; }
        .hljs-number { color: #ff0000; }
        .hljs-function { color: #0000ff; }
      `;
    }
  }
  
  // Build complete HTML document
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* Print page setup - standard margins */
    @page {
      margin: 0.5in;
    }
    
    /* Highlight.js color scheme */
    ${colorSchemeCSS}
    
    /* Custom styling */
    * {
      box-sizing: border-box;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      font-family: Menlo, Monaco, 'Courier New', monospace;
      font-size: ${CODE_FONT_SIZE};
      line-height: ${CODE_LINE_SPACING}em;
    }
    
    table {
      border-collapse: collapse;
    }
    
    .hljs {
      background: transparent !important;
      background-color: transparent !important;
    }
    
    .line-number {
      border-right: thin solid silver;
      padding-right: 0.3em;
      text-align: right;
      vertical-align: top;
    }
    
    .line-text {
      padding-left: 0.7em;
      white-space: pre-wrap;
    }
    
    h3.filepath {
      margin: 0 0 1em 0;
      font-weight: normal;
    }
  </style>
</head>
<body>
  <h3 class="filepath">${filePath}</h3>
  <table class="hljs">
    ${tableRows}
  </table>
</body>
</html>`;

  // Create temp files
  const tmpHtml = `/tmp/mcp-printer-code-${Date.now()}.html`;
  const tmpPdf = `/tmp/mcp-printer-code-${Date.now()}.pdf`;
  
  // Write HTML to temp file
  await execCommand(`cat > "${tmpHtml}" << 'EOFHTML'\n${html}\nEOFHTML`);
  
  // Convert HTML to PDF with Chrome
  try {
    await execAsync(`"${chromePath}" --headless --disable-gpu --print-to-pdf="${tmpPdf}" "${tmpHtml}"`);
  } catch (error: any) {
    // Chrome might output to stderr even on success
    const { stderr } = error;
    if (!stderr || !stderr.includes('written to file')) {
      throw new Error(`Failed to render PDF: ${error.message}`);
    }
  }
  
  // Clean up HTML file
  try {
    await execCommand(`rm -f "${tmpHtml}"`);
  } catch {
    // Ignore cleanup errors
  }

  return tmpPdf;
}

// Tool definitions
const tools: Tool[] = [
  {
    name: "get_config",
    description:
      "Get the current MCP Printer configuration settings. Returns environment variables and their current values.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_printers",
    description:
      "List all available printers on the system with their status. Returns printer names, states, and whether they're accepting jobs.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
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
  },
  {
    name: "get_print_queue",
    description:
      "Check the print queue for a specific printer or all printers. Shows pending and active print jobs.",
    inputSchema: {
      type: "object",
      properties: {
        printer: {
          type: "string",
          description:
            "Printer name to check queue for (optional, checks all if not specified)",
        },
      },
    },
  },
  {
    name: "cancel_print_job",
    description: "Cancel a specific print job by job ID or cancel all jobs for a printer.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: {
          type: "string",
          description: "Job ID to cancel (get from get_print_queue)",
        },
        printer: {
          type: "string",
          description: "Printer name (required if canceling all jobs)",
        },
        cancel_all: {
          type: "boolean",
          description: "Cancel all jobs for the specified printer",
          default: false,
        },
      },
    },
  },
  {
    name: "get_default_printer",
    description: "Get the name of the default printer",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "set_default_printer",
    description: "Set a printer as the default printer",
    inputSchema: {
      type: "object",
      properties: {
        printer: {
          type: "string",
          description: "Printer name to set as default",
        },
      },
      required: ["printer"],
    },
  },
  {
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
  },
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_config": {
        // Only expose non-sensitive configuration values
        // Never expose API keys, tokens, passwords, or other credentials
        const config = {
          MCP_PRINTER_DEFAULT: DEFAULT_PRINTER || "(not set)",
          MCP_PRINTER_DUPLEX: DEFAULT_DUPLEX ? "true" : "false",
          MCP_PRINTER_OPTIONS: DEFAULT_OPTIONS || "(not set)",
          MCP_PRINTER_CHROME_PATH: CHROME_PATH || "(auto-detected)",
          MCP_PRINTER_RENDER_EXTENSIONS: RENDER_EXTENSIONS.length > 0 
            ? RENDER_EXTENSIONS.join(", ") 
            : "(not set)",
          MCP_PRINTER_CODE_EXCLUDE: CODE_EXCLUDE || "(not set)",
          MCP_PRINTER_CODE_COLOR_SCHEME: CODE_COLOR_SCHEME,
          MCP_PRINTER_CODE_LINE_NUMBERS: CODE_LINE_NUMBERS ? "true" : "false",
          MCP_PRINTER_CODE_FONT_SIZE: CODE_FONT_SIZE,
          MCP_PRINTER_CODE_LINE_SPACING: CODE_LINE_SPACING
        };
        
        const configText = Object.entries(config)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: `Current MCP Printer Configuration:\n\n${configText}`,
            },
          ],
        };
      }

      case "list_printers": {
        const output = await execCommand("lpstat -p -d");
        return {
          content: [
            {
              type: "text",
              text: output || "No printers found",
            },
          ],
        };
      }

      case "print_file": {
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
          const targetPrinter = printer || DEFAULT_PRINTER;
          if (targetPrinter) {
            command += ` -P "${targetPrinter}"`;
          }
          
          if (copies > 1) {
            command += ` -#${copies}`;
          }
          
          // Build options string with defaults
          let allOptions = [];
          
          // Add default duplex if configured and not overridden
          if (DEFAULT_DUPLEX && !options?.includes("sides=")) {
            allOptions.push("sides=two-sided-long-edge");
          }
          
          // Add default options if configured (split by spaces to handle multiple options)
          if (DEFAULT_OPTIONS) {
            allOptions.push(...DEFAULT_OPTIONS.split(/\s+/));
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

      case "get_print_queue": {
        const { printer } = args as { printer?: string };
        
        let command = "lpq";
        if (printer) {
          command += ` -P "${printer}"`;
        }

        const output = await execCommand(command);
        return {
          content: [
            {
              type: "text",
              text: output || "No print jobs in queue",
            },
          ],
        };
      }

      case "cancel_print_job": {
        const { job_id, printer, cancel_all } = args as {
          job_id?: string;
          printer?: string;
          cancel_all?: boolean;
        };

        let command = "lprm";
        
        if (cancel_all && printer) {
          command += ` -P "${printer}" -`;
        } else if (job_id) {
          if (printer) {
            command += ` -P "${printer}"`;
          }
          command += ` ${job_id}`;
        } else {
          throw new Error("Must provide either job_id or set cancel_all=true with printer");
        }

        await execCommand(command);
        
        return {
          content: [
            {
              type: "text",
              text: cancel_all
                ? `✓ Cancelled all jobs for printer: ${printer}`
                : `✓ Cancelled job: ${job_id}`,
            },
          ],
        };
      }

      case "get_default_printer": {
        const output = await execCommand("lpstat -d");
        const defaultPrinter = output.split(": ")[1] || "No default printer set";
        return {
          content: [
            {
              type: "text",
              text: `Default printer: ${defaultPrinter}`,
            },
          ],
        };
      }

      case "set_default_printer": {
        const { printer } = args as { printer: string };
        await execCommand(`lpoptions -d "${printer}"`);
        return {
          content: [
            {
              type: "text",
              text: `✓ Set default printer to: ${printer}`,
            },
          ],
        };
      }

      case "render_and_print_markdown": {
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
          const targetPrinter = printer || DEFAULT_PRINTER;
          let command = "lpr";
          
          if (targetPrinter) {
            command += ` -P "${targetPrinter}"`;
          }
          
          if (copies > 1) {
            command += ` -#${copies}`;
          }
          
          let allOptions = [];
          if (DEFAULT_DUPLEX && !options?.includes("sides=")) {
            allOptions.push("sides=two-sided-long-edge");
          }
          if (DEFAULT_OPTIONS) {
            allOptions.push(...DEFAULT_OPTIONS.split(/\s+/));
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

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Printer Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

