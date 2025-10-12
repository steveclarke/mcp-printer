import yn from "yn";
import { homedir } from "os";
import { join } from "path";
import { parseDelimitedString } from "./utils.js";

/**
 * Configuration interface for MCP Printer settings loaded from environment variables.
 */
export interface Config {
  /** Default printer name for print operations */
  defaultPrinter: string;
  /** Enable duplex (two-sided) printing by default */
  enableDuplex: boolean;
  /** Default CUPS printing options (array of option strings) */
  defaultOptions: string[];
  /** Path to Chrome/Chromium executable for PDF rendering */
  chromePath: string;
  /** File extensions that should be auto-rendered to PDF before printing (primarily markdown) */
  markdownExtensions: string[];
  /** Enable management operations (set_default_printer, cancel_print_job) */
  enableManagement: boolean;
  /** Fallback to printing original file if PDF rendering fails (for markdown and code) */
  fallbackOnRenderError: boolean;
  /** List of directory paths that files must be under to be accessible (merged with defaults) */
  allowedPaths: string[];
  /** List of directory/file paths that are explicitly denied access (merged with defaults) */
  deniedPaths: string[];
  /** Maximum number of copies allowed per print job (0 or negative means unlimited) */
  maxCopies: number;
  /** Code rendering configuration */
  code: {
    /** File extensions to exclude from code rendering. All enabled by default. */
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
 * Default configuration values.
 * These are used when environment variables are not set.
 */
const DEFAULT_PRINTER = "";
const DEFAULT_ENABLE_DUPLEX = false;
const DEFAULT_OPTIONS: string[] = [];
const DEFAULT_CHROME_PATH = "";
const DEFAULT_MARKDOWN_EXTENSIONS: string[] = [];
const DEFAULT_ENABLE_MANAGEMENT = false;
const DEFAULT_FALLBACK_ON_RENDER_ERROR = false;
const DEFAULT_MAX_COPIES = 10;
const DEFAULT_CODE_EXCLUDE_EXTENSIONS: string[] = [];
const DEFAULT_CODE_COLOR_SCHEME = "atom-one-light";
const DEFAULT_CODE_ENABLE_LINE_NUMBERS = true;
const DEFAULT_CODE_FONT_SIZE = "10pt";
const DEFAULT_CODE_LINE_SPACING = "1.5";

// Get home directory for security defaults
const homeDir = homedir();

// Default allowed paths
const defaultAllowedPaths = [homeDir];

// Parse user-provided allowed paths from environment variable (colon-separated)
const userAllowedPaths = parseDelimitedString(process.env.MCP_PRINTER_ALLOWED_PATHS, ':');

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
const userDeniedPaths = parseDelimitedString(process.env.MCP_PRINTER_DENIED_PATHS, ':');

/**
 * Global configuration object loaded from environment variables.
 * Provides settings for printer defaults, rendering options, and code formatting.
 */
export const config: Config = {
  defaultPrinter: process.env.MCP_PRINTER_DEFAULT_PRINTER || DEFAULT_PRINTER,
  enableDuplex: yn(process.env.MCP_PRINTER_ENABLE_DUPLEX, { default: DEFAULT_ENABLE_DUPLEX }),
  defaultOptions: parseDelimitedString(process.env.MCP_PRINTER_DEFAULT_OPTIONS, /\s+/),
  chromePath: process.env.MCP_PRINTER_CHROME_PATH || DEFAULT_CHROME_PATH,
  markdownExtensions: parseDelimitedString(process.env.MCP_PRINTER_MARKDOWN_EXTENSIONS, ',', s => s.toLowerCase()),
  enableManagement: yn(process.env.MCP_PRINTER_ENABLE_MANAGEMENT, { default: DEFAULT_ENABLE_MANAGEMENT }),
  fallbackOnRenderError: yn(process.env.MCP_PRINTER_FALLBACK_ON_RENDER_ERROR, { default: DEFAULT_FALLBACK_ON_RENDER_ERROR }),
  // Merge default paths with user-provided paths
  allowedPaths: [...defaultAllowedPaths, ...userAllowedPaths],
  deniedPaths: [...defaultDeniedPaths, ...userDeniedPaths],
  maxCopies: parseInt(process.env.MCP_PRINTER_MAX_COPIES || String(DEFAULT_MAX_COPIES), 10),
  code: {
    excludeExtensions: parseDelimitedString(process.env.MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS, ',', s => s.toLowerCase()),
    colorScheme: process.env.MCP_PRINTER_CODE_COLOR_SCHEME || DEFAULT_CODE_COLOR_SCHEME,
    enableLineNumbers: yn(process.env.MCP_PRINTER_CODE_ENABLE_LINE_NUMBERS, { default: DEFAULT_CODE_ENABLE_LINE_NUMBERS }),
    fontSize: process.env.MCP_PRINTER_CODE_FONT_SIZE || DEFAULT_CODE_FONT_SIZE,
    lineSpacing: process.env.MCP_PRINTER_CODE_LINE_SPACING || DEFAULT_CODE_LINE_SPACING,
  }
};

