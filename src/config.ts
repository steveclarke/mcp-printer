import yn from "yn";

/**
 * Configuration interface for MCP Printer settings loaded from environment variables.
 */
export interface Config {
  /** Default printer name for print operations */
  defaultPrinter: string;
  /** Enable duplex (two-sided) printing by default */
  enableDuplex: boolean;
  /** Default CUPS printing options */
  defaultOptions: string;
  /** Path to Chrome/Chromium executable for PDF rendering */
  chromePath: string;
  /** File extensions that should be auto-rendered to PDF before printing (primarily markdown) */
  markdownExtensions: string[];
  /** Restrict to print-only mode (disable all printer management tools) */
  printOnly: boolean;
  /** Code rendering configuration */
  code: {
    /** File extensions to exclude from code rendering */
    excludeExtensions: string[];
    /** Highlight.js color scheme for syntax highlighting */
    colorScheme: string;
    /** Whether to show line numbers in code rendering */
    enableLineNumbers: boolean;
    /** Font size for code rendering (e.g., "10pt") */
    fontSize: string;
    /** Line spacing for code rendering (e.g., "1.5") */
    lineSpacing: string;
  };
}

/**
 * Global configuration object loaded from environment variables.
 * Provides settings for printer defaults, rendering options, and code formatting.
 */
export const config: Config = {
  defaultPrinter: process.env.MCP_PRINTER_DEFAULT_PRINTER || "",
  enableDuplex: yn(process.env.MCP_PRINTER_ENABLE_DUPLEX, { default: false }),
  defaultOptions: process.env.MCP_PRINTER_DEFAULT_OPTIONS || "",
  chromePath: process.env.MCP_PRINTER_CHROME_PATH || "",
  markdownExtensions: process.env.MCP_PRINTER_MARKDOWN_EXTENSIONS 
    ? process.env.MCP_PRINTER_MARKDOWN_EXTENSIONS.split(',').map(e => e.trim().toLowerCase())
    : [],
  printOnly: yn(process.env.MCP_PRINTER_PRINT_ONLY, { default: false }),
  code: {
    excludeExtensions: process.env.MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS 
      ? process.env.MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS.split(',').map(e => e.trim().toLowerCase()) 
      : [],
    colorScheme: process.env.MCP_PRINTER_CODE_COLOR_SCHEME || "atom-one-light",
    enableLineNumbers: yn(process.env.MCP_PRINTER_CODE_ENABLE_LINE_NUMBERS, { default: true }),
    fontSize: process.env.MCP_PRINTER_CODE_FONT_SIZE || "10pt",
    lineSpacing: process.env.MCP_PRINTER_CODE_LINE_SPACING || "1.5",
  },
};

