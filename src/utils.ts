/**
 * @fileoverview Utility functions for command execution, dependency checking,
 * and file type detection for the MCP Printer server.
 */

import { execa } from "execa";
import { access } from "fs/promises";
import { constants } from "fs";
import { realpathSync } from "fs";
import { resolve, basename } from "path";
import { config } from "./config.js";

/**
 * Executes a command safely without spawning a shell.
 * 
 * @param command - The command binary to execute
 * @param args - Array of arguments to pass to the command
 * @returns The trimmed stdout output from the command
 * @throws {Error} If the command fails or returns an error
 */
export async function execCommand(command: string, args: string[] = []): Promise<string> {
  try {
    const { stdout } = await execa(command, args);
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

/**
 * Checks if a file exists at the given path.
 * 
 * @param filePath - Path to check
 * @returns True if file exists and is accessible, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a file path is allowed to be accessed based on security configuration.
 * Resolves symlinks and checks against allowlist and denylist.
 * 
 * @param filePath - The file path to validate
 * @throws {Error} If the file path is not allowed with a descriptive message
 */
export function validateFilePath(filePath: string): void {
  // Resolve to absolute path and follow symlinks
  let absolutePath: string;
  try {
    absolutePath = realpathSync(resolve(filePath));
  } catch (error: any) {
    // If file doesn't exist yet or can't be resolved, use resolved path without following symlinks
    absolutePath = resolve(filePath);
  }

  // Check if file or any of its parent directories match denied paths
  for (const deniedPath of config.deniedPaths) {
    const resolvedDeniedPath = resolve(deniedPath);
    if (absolutePath.startsWith(resolvedDeniedPath + '/') || absolutePath === resolvedDeniedPath) {
      throw new Error(
        `Access denied: File path "${filePath}" is in a restricted directory (${deniedPath}). ` +
        `This path is blocked for security reasons.`
      );
    }
    
    // Also check for .env files anywhere
    if (basename(absolutePath).startsWith('.env')) {
      throw new Error(
        `Access denied: Environment files (.env*) are blocked for security reasons.`
      );
    }
  }

  // Check if file is under at least one allowed path
  let isAllowed = false;
  for (const allowedPath of config.allowedPaths) {
    const resolvedAllowedPath = resolve(allowedPath);
    if (absolutePath.startsWith(resolvedAllowedPath + '/') || absolutePath === resolvedAllowedPath) {
      isAllowed = true;
      break;
    }
  }

  if (!isAllowed) {
    throw new Error(
      `Access denied: File path "${filePath}" is outside allowed directories. ` +
      `By default, only files under your home directory are accessible. ` +
      `To allow other paths, set MCP_PRINTER_ALLOWED_PATHS environment variable.`
    );
  }
}

/**
 * Checks if a command-line tool is available in the system PATH.
 * 
 * @param command - The command to check (e.g., "pandoc")
 * @param name - Human-readable name for error messages
 * @throws {Error} If the command is not found, with installation instructions
 */
export async function checkDependency(command: string, name: string): Promise<void> {
  try {
    await execCommand('which', [command]);
  } catch {
    throw new Error(`${name} not found. Install with: brew install ${command}`);
  }
}

/**
 * Locates a Chrome or Chromium installation on the system.
 * First checks the MCP_PRINTER_CHROME_PATH environment variable,
 * then searches common macOS and Linux installation paths.
 * 
 * @returns Path to Chrome/Chromium executable, or null if not found
 */
export async function findChrome(): Promise<string | null> {
  // Check environment variable first
  if (config.chromePath) {
    if (await fileExists(config.chromePath)) {
      return config.chromePath;
    }
    // If specified path doesn't exist, continue to auto-detection
  }

  // macOS paths
  const macPaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  ];

  for (const path of macPaths) {
    if (await fileExists(path)) {
      return path;
    }
  }

  // Linux paths
  const linuxCommands = ["google-chrome", "chromium", "chromium-browser"];
  for (const cmd of linuxCommands) {
    try {
      const path = await execCommand('which', [cmd]);
      if (path) return path;
    } catch {
      // Continue to next command
    }
  }

  return null;
}

/**
 * Determines if a file should be automatically rendered to PDF before printing.
 * Checks if the file extension is in the markdownExtensions configuration.
 * 
 * @param filePath - Path to the file to check
 * @returns True if the file should be rendered to PDF, false otherwise
 */
export function shouldRenderToPdf(filePath: string): boolean {
  if (config.markdownExtensions.length === 0) return false;
  
  const ext = filePath.split('.').pop()?.toLowerCase() || "";
  return config.markdownExtensions.includes(ext);
}

/**
 * Determines if a file should be rendered with syntax highlighting.
 * Checks code.excludeExtensions configuration and whether highlight.js supports the file type.
 * 
 * @param filePath - Path to the file to check
 * @returns True if the file should be syntax-highlighted, false otherwise
 */
export function shouldRenderCode(filePath: string): boolean {
  // If excludeExtensions includes "all", disable all code rendering
  if (config.code.excludeExtensions.includes("all")) return false;
  
  const ext = filePath.split('.').pop()?.toLowerCase() || "";
  
  // Check if extension is in the exclusion list
  if (config.code.excludeExtensions.includes(ext)) return false;
  
  // Try to get language from extension - if highlight.js knows it, render it
  const language = getLanguageFromExtension(ext);
  return language !== "";
}

/**
 * Maps a file extension to a highlight.js language identifier.
 * 
 * @param ext - File extension (without the dot, e.g., "ts")
 * @returns Highlight.js language identifier, or the original extension if no mapping exists
 */
export function getLanguageFromExtension(ext: string): string {
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

/**
 * Fixes multiline HTML span elements by ensuring spans don't break across lines.
 * Closes all open spans at the end of each line and reopens them at the start of the next.
 * This ensures proper rendering in PDF output where line breaks can cause display issues.
 * 
 * @param text - HTML text with span elements
 * @returns HTML text with spans properly closed and reopened at line boundaries
 */
export function fixMultilineSpans(text: string): string {
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

