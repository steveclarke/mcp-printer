import yn from "yn"
import { homedir } from "os"
import { join } from "path"
import { parseDelimitedString } from "./utils.js"

/**
 * Configuration interface for MCP Printer settings loaded from environment variables.
 */
export interface Config {
  /** Default printer name for print operations */
  defaultPrinter: string
  /** Automatically enable duplex (two-sided) printing by default (can be overridden per-call) */
  autoDuplex: boolean
  /** Path to Chrome/Chromium executable for PDF rendering */
  chromePath: string
  /** Automatically render markdown files to PDF (can be overridden per-call) */
  autoRenderMarkdown: boolean
  /** Automatically render code files to PDF with syntax highlighting (can be overridden per-call) */
  autoRenderCode: boolean
  /** Enable management operations (set_default_printer, cancel_print_job) */
  enableManagement: boolean
  /** Enable prompts (workflow templates that appear as slash commands) */
  enablePrompts: boolean
  /** Fallback to printing original file if PDF rendering fails (for markdown and code) */
  fallbackOnRenderError: boolean
  /** List of directory paths that files must be under to be accessible (merged with defaults) */
  allowedPaths: string[]
  /** List of directory/file paths that are explicitly denied access (merged with defaults) */
  deniedPaths: string[]
  /** Maximum number of copies allowed per print job (0 or negative means unlimited) */
  maxCopies: number
  /** Threshold for page count confirmation. If physical sheets exceed this, print job returns preview instead. 0 = disabled. */
  confirmIfOverPages: number
  /** Code rendering configuration */
  code: {
    /** File extensions to exclude from code rendering. All enabled by default. */
    excludeExtensions: string[]
    /** Highlight.js color scheme for syntax highlighting */
    colorScheme: string
    /** Whether to automatically show line numbers in code rendering (can be overridden per-call) */
    autoLineNumbers: boolean
    /** Font size for code rendering (e.g., "10pt") */
    fontSize: string
    /** Line spacing for code rendering (e.g., "1.5") */
    lineSpacing: string
  }
}

/**
 * Standard markdown file extensions.
 * These are the file extensions that will be treated as markdown files for rendering.
 */
export const MARKDOWN_EXTENSIONS = ["md", "markdown"] as const

/**
 * Type representing valid markdown file extensions.
 */
export type MarkdownExtension = (typeof MARKDOWN_EXTENSIONS)[number]

/**
 * Default configuration values.
 * These are used when environment variables are not set.
 */
const DEFAULT_PRINTER = ""
const DEFAULT_AUTO_DUPLEX = false
const DEFAULT_CHROME_PATH = ""
const DEFAULT_AUTO_RENDER_MARKDOWN = true
const DEFAULT_AUTO_RENDER_CODE = true
const DEFAULT_ENABLE_MANAGEMENT = false
const DEFAULT_ENABLE_PROMPTS = true
const DEFAULT_FALLBACK_ON_RENDER_ERROR = false
const DEFAULT_MAX_COPIES = 10
const DEFAULT_CONFIRM_IF_OVER_PAGES = 10
const DEFAULT_CODE_COLOR_SCHEME = "atom-one-light"
const DEFAULT_CODE_AUTO_LINE_NUMBERS = true
const DEFAULT_CODE_FONT_SIZE = "10pt"
const DEFAULT_CODE_LINE_SPACING = "1.5"

// Get home directory for security defaults
const homeDir = homedir()

// Default allowed paths - restricted to common user directories only
const defaultAllowedPaths = [
  join(homeDir, "Documents"),
  join(homeDir, "Downloads"),
  join(homeDir, "Desktop"),
]

// Default denied paths (sensitive directories)
// NOTE: This is a defense-in-depth measure. The primary security layer is the
// universal dotfile blocking in validateFilePath() which catches most
// credential stores. This deny list serves as a fallback to ensure system
// directories are ALWAYS blocked. Even if you explicitly add these paths to
// MCP_PRINTER_ALLOWED_PATHS, they will still be denied. These paths cannot be
// overridden by any configuration.
const defaultDeniedPaths = [
  // Sensitive credential directories (most are also caught by dotfile blocking)
  join(homeDir, ".ssh"),
  join(homeDir, ".gnupg"),
  join(homeDir, ".aws"),
  join(homeDir, ".config", "gcloud"),
  // Standard Unix system directories
  "/bin",
  "/sbin",
  "/lib",
  "/lib64",
  "/usr/lib",
  "/usr/sbin",
  "/boot",
  "/dev",
  "/etc",
  "/proc",
  "/run",
  "/sys",
  "/var",
  "/tmp",
  "/root",
  // macOS specific system directories
  "/System",
  "/Library",
  "/private/etc",
  "/private/var",
  "/private/tmp",
]

// Parse user-provided allowed paths from environment variable (colon-separated) and expand env vars
const userAllowedPaths = parseDelimitedString(process.env.MCP_PRINTER_ALLOWED_PATHS, ":").map(
  expandEnvVars
)
const hasUserPaths = userAllowedPaths.length > 0

// Parse user-provided denied paths from environment variable (colon-separated) and expand env vars
const userDeniedPaths = parseDelimitedString(process.env.MCP_PRINTER_DENIED_PATHS, ":").map(
  expandEnvVars
)

/**
 * Global configuration object loaded from environment variables.
 * Provides settings for printer defaults, rendering options, and code formatting.
 */
export const config: Config = {
  defaultPrinter: process.env.MCP_PRINTER_DEFAULT_PRINTER || DEFAULT_PRINTER,
  autoDuplex: yn(process.env.MCP_PRINTER_AUTO_DUPLEX, { default: DEFAULT_AUTO_DUPLEX }),
  chromePath: process.env.MCP_PRINTER_CHROME_PATH || DEFAULT_CHROME_PATH,
  autoRenderMarkdown: yn(process.env.MCP_PRINTER_AUTO_RENDER_MARKDOWN, {
    default: DEFAULT_AUTO_RENDER_MARKDOWN,
  }),
  autoRenderCode: yn(process.env.MCP_PRINTER_AUTO_RENDER_CODE, {
    default: DEFAULT_AUTO_RENDER_CODE,
  }),
  enableManagement: yn(process.env.MCP_PRINTER_ENABLE_MANAGEMENT, {
    default: DEFAULT_ENABLE_MANAGEMENT,
  }),
  enablePrompts: yn(process.env.MCP_PRINTER_ENABLE_PROMPTS, {
    default: DEFAULT_ENABLE_PROMPTS,
  }),
  fallbackOnRenderError: yn(process.env.MCP_PRINTER_FALLBACK_ON_RENDER_ERROR, {
    default: DEFAULT_FALLBACK_ON_RENDER_ERROR,
  }),
  // Use user-provided paths if set, otherwise use default allowed directories
  allowedPaths: hasUserPaths ? userAllowedPaths : [...defaultAllowedPaths],
  deniedPaths: [...defaultDeniedPaths, ...userDeniedPaths],
  maxCopies: parseInt(process.env.MCP_PRINTER_MAX_COPIES || String(DEFAULT_MAX_COPIES), 10),
  confirmIfOverPages: parseInt(
    process.env.MCP_PRINTER_CONFIRM_IF_OVER_PAGES || String(DEFAULT_CONFIRM_IF_OVER_PAGES),
    10
  ),
  code: {
    excludeExtensions: parseDelimitedString(
      process.env.MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS,
      ",",
      (s) => s.toLowerCase()
    ),
    colorScheme: process.env.MCP_PRINTER_CODE_COLOR_SCHEME || DEFAULT_CODE_COLOR_SCHEME,
    autoLineNumbers: yn(process.env.MCP_PRINTER_CODE_AUTO_LINE_NUMBERS, {
      default: DEFAULT_CODE_AUTO_LINE_NUMBERS,
    }),
    fontSize: process.env.MCP_PRINTER_CODE_FONT_SIZE || DEFAULT_CODE_FONT_SIZE,
    lineSpacing: process.env.MCP_PRINTER_CODE_LINE_SPACING || DEFAULT_CODE_LINE_SPACING,
  },
}

/**
 * Expands environment variables in a path string.
 * Supports $HOME, ${HOME}, and ~ expansion.
 *
 * @param path - Path that may contain environment variables
 * @returns Path with environment variables expanded
 */
function expandEnvVars(path: string): string {
  return path
    .replace(/^~/, homeDir) // Expand ~ at the start
    .replace(/\$HOME/g, homeDir) // Expand $HOME
    .replace(/\$\{HOME\}/g, homeDir) // Expand ${HOME}
}
