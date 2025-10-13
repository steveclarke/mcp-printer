/**
 * @fileoverview File path security validation and access control.
 * Enforces allowlist/denylist rules and blocks access to dotfiles and sensitive directories.
 */

import { realpathSync } from "fs"
import { resolve, sep } from "path"
import { config } from "./config.js"

/**
 * Check if a path contains any dotfile or dotdir component.
 * Returns true if any path component starts with a dot (except "." and "..").
 * This is a security measure to prevent access to hidden files and credential stores.
 *
 * @param filePath - The path to check
 * @returns True if path contains dotfile/dotdir
 */
function pathContainsDotfile(filePath: string): boolean {
  const components = filePath.split(sep)
  return components.some(
    (component) => component.startsWith(".") && component !== "." && component !== ".."
  )
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
  const originalAbsolutePath = resolve(filePath)
  let absolutePath: string
  try {
    absolutePath = realpathSync(originalAbsolutePath)
  } catch (error: any) {
    // If file doesn't exist yet or can't be resolved, use resolved path without following symlinks
    absolutePath = originalAbsolutePath
  }

  // Check for dotfiles/dotdirs in BOTH original and resolved paths (security layer - no override)
  if (pathContainsDotfile(originalAbsolutePath)) {
    throw new Error(
      `Access denied: Dotfiles and hidden directories cannot be printed for security reasons. ` +
        `Path "${filePath}" contains hidden components.`
    )
  }

  if (pathContainsDotfile(absolutePath) && absolutePath !== originalAbsolutePath) {
    throw new Error(
      `Access denied: Dotfiles and hidden directories cannot be printed for security reasons. ` +
        `Path "${filePath}" resolves to a hidden file or directory.`
    )
  }

  // Check if file or any of its parent directories match denied paths
  for (const deniedPath of config.deniedPaths) {
    const resolvedDeniedPath = resolve(deniedPath)
    if (absolutePath.startsWith(resolvedDeniedPath + sep) || absolutePath === resolvedDeniedPath) {
      throw new Error(
        `Access denied: File path "${filePath}" is in a restricted directory (${deniedPath}). ` +
          `This path is blocked for security reasons.`
      )
    }
  }

  // Check if file is under at least one allowed path
  let isAllowed = false
  for (const allowedPath of config.allowedPaths) {
    const resolvedAllowedPath = resolve(allowedPath)
    if (
      absolutePath.startsWith(resolvedAllowedPath + sep) ||
      absolutePath === resolvedAllowedPath
    ) {
      isAllowed = true
      break
    }
  }

  if (!isAllowed) {
    throw new Error(
      `Access denied: File is outside allowed directories. ` +
        `Configure MCP_PRINTER_ALLOWED_PATHS to grant access to additional paths. ` +
        `Default allowed: ~/Documents, ~/Downloads, ~/Desktop.`
    )
  }
}
