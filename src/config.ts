/**
 * Configuration interface for MCP Printer settings loaded from environment variables.
 */
export interface Config {
  /** Default printer name for print operations */
  DEFAULT_PRINTER: string;
  /** Enable duplex (two-sided) printing by default */
  DEFAULT_DUPLEX: boolean;
  /** Default CUPS printing options */
  DEFAULT_OPTIONS: string;
  /** Path to Chrome/Chromium executable for PDF rendering */
  CHROME_PATH: string;
  /** File extensions that should be auto-rendered to PDF before printing */
  RENDER_EXTENSIONS: string[];
  /** Raw code exclusion setting (comma-separated extensions or "all") */
  CODE_EXCLUDE: string;
  /** Parsed list of file extensions to exclude from code rendering */
  CODE_EXCLUDE_LIST: string[];
  /** Highlight.js color scheme for syntax highlighting */
  CODE_COLOR_SCHEME: string;
  /** Whether to show line numbers in code rendering */
  CODE_LINE_NUMBERS: boolean;
  /** Font size for code rendering (e.g., "10pt") */
  CODE_FONT_SIZE: string;
  /** Line spacing for code rendering (e.g., "1.5") */
  CODE_LINE_SPACING: string;
}

/**
 * Global configuration object loaded from environment variables.
 * Provides settings for printer defaults, rendering options, and code formatting.
 */
export const config: Config = {
  DEFAULT_PRINTER: process.env.MCP_PRINTER_DEFAULT || "",
  DEFAULT_DUPLEX: process.env.MCP_PRINTER_DUPLEX === "true",
  DEFAULT_OPTIONS: process.env.MCP_PRINTER_OPTIONS || "",
  CHROME_PATH: process.env.MCP_PRINTER_CHROME_PATH || "",
  RENDER_EXTENSIONS: process.env.MCP_PRINTER_RENDER_EXTENSIONS 
    ? process.env.MCP_PRINTER_RENDER_EXTENSIONS.split(',').map(e => e.trim().toLowerCase())
    : [],
  CODE_EXCLUDE: process.env.MCP_PRINTER_CODE_EXCLUDE || "",
  CODE_EXCLUDE_LIST: process.env.MCP_PRINTER_CODE_EXCLUDE 
    ? process.env.MCP_PRINTER_CODE_EXCLUDE.split(',').map(e => e.trim().toLowerCase()) 
    : [],
  CODE_COLOR_SCHEME: process.env.MCP_PRINTER_CODE_COLOR_SCHEME || "atom-one-light",
  CODE_LINE_NUMBERS: process.env.MCP_PRINTER_CODE_LINE_NUMBERS !== "false",
  CODE_FONT_SIZE: process.env.MCP_PRINTER_CODE_FONT_SIZE || "10pt",
  CODE_LINE_SPACING: process.env.MCP_PRINTER_CODE_LINE_SPACING || "1.5",
};

