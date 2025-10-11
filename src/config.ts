import yn from "yn";
import { homedir } from "os";
import { join } from "path";

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
  /** Enable management operations (set_default_printer, cancel_print_job) - disabled by default for security */
  enableManagement: boolean;
  /** Fallback to printing original file if PDF rendering fails (for markdown and code) */
  fallbackOnRenderError: boolean;
  /** List of directory paths that files must be under to be accessible (merged with defaults) */
  allowedPaths: string[];
  /** List of directory/file paths that are explicitly denied access (merged with defaults) */
  deniedPaths: string[];
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

// Get home directory for security defaults
const homeDir = homedir();

// Default allowed paths
const defaultAllowedPaths = [homeDir];

// Parse user-provided allowed paths from environment variable (colon-separated)
const userAllowedPaths = process.env.MCP_PRINTER_ALLOWED_PATHS
  ? process.env.MCP_PRINTER_ALLOWED_PATHS.split(':').map(p => p.trim()).filter(p => p)
  : [];

// Default denied paths (sensitive directories)
const defaultDeniedPaths = [
  // Sensitive credential directories
  join(homeDir, '.ssh'),
  join(homeDir, '.gnupg'),
  join(homeDir, '.aws'),
  join(homeDir, '.config', 'gcloud'),
  // System directories
  '/etc',
  '/var',
  '/root',
  '/sys',
  '/proc',
  // macOS specific
  '/private/etc',
  '/private/var'
];

// Parse user-provided denied paths from environment variable (colon-separated)
const userDeniedPaths = process.env.MCP_PRINTER_DENIED_PATHS
  ? process.env.MCP_PRINTER_DENIED_PATHS.split(':').map(p => p.trim()).filter(p => p)
  : [];

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
  enableManagement: yn(process.env.MCP_PRINTER_ENABLE_MANAGEMENT, { default: false }),
  fallbackOnRenderError: yn(process.env.MCP_PRINTER_FALLBACK_ON_RENDER_ERROR, { default: false }),
  // Merge default paths with user-provided paths
  allowedPaths: [...defaultAllowedPaths, ...userAllowedPaths],
  deniedPaths: [...defaultDeniedPaths, ...userDeniedPaths],
  code: {
    excludeExtensions: process.env.MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS 
      ? process.env.MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS.split(',').map(e => e.trim().toLowerCase()) 
      : [],
    colorScheme: process.env.MCP_PRINTER_CODE_COLOR_SCHEME || "atom-one-light",
    enableLineNumbers: yn(process.env.MCP_PRINTER_CODE_ENABLE_LINE_NUMBERS, { default: true }),
    fontSize: process.env.MCP_PRINTER_CODE_FONT_SIZE || "10pt",
    lineSpacing: process.env.MCP_PRINTER_CODE_LINE_SPACING || "1.5",
  }
};

