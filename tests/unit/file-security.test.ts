/**
 * @fileoverview Unit tests for file security validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { homedir } from "os"
import { join } from "path"

function createDefaultConfigMock() {
  const homeDir = homedir()
  return {
    config: {
      allowedPaths: [homeDir],
      deniedPaths: [
        join(homeDir, ".ssh"),
        join(homeDir, ".gnupg"),
        join(homeDir, ".aws"),
        "/etc",
        "/var",
        "/root",
      ],
    },
  }
}

// Mock the config and fs modules before importing
vi.mock("../../src/config.js", createDefaultConfigMock)

type WindowsConfig = {
  allowedPaths: string[]
  deniedPaths: string[]
}

/**
 * Imports file-security module with Windows-style path semantics.
 * Restores real modules once import is complete to avoid leaking mocks.
 */
async function importFileSecurityWithWindows(configOverride?: WindowsConfig) {
  vi.resetModules()

  const actualPath = await import("path")
  const windowsConfig: WindowsConfig = configOverride ?? {
    allowedPaths: ["C:\\Users\\alice"],
    deniedPaths: [],
  }

  vi.doMock("path", () => {
    const win = actualPath.win32
    return {
      ...win,
      sep: "\\",
      resolve: win.resolve,
      join: win.join,
      normalize: win.normalize,
      dirname: win.dirname,
      basename: win.basename,
      extname: win.extname,
      parse: win.parse,
      format: win.format,
      isAbsolute: win.isAbsolute,
      relative: win.relative,
      toNamespacedPath: win.toNamespacedPath,
      posix: actualPath.posix,
      win32: win,
    }
  })

  vi.doMock("../../src/config.js", () => ({
    config: windowsConfig,
  }))

  const module = await import("../../src/file-security.js")

  vi.doUnmock("path")
  vi.doUnmock("../../src/config.js")
  vi.doMock("../../src/config.js", createDefaultConfigMock)

  return module
}

describe("validateFilePath", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("should allow files under home directory", async () => {
    const { validateFilePath } = await import("../../src/file-security.js")
    const homeDir = homedir()
    const testPath = join(homeDir, "Documents", "test.txt")

    expect(() => validateFilePath(testPath)).not.toThrow()
  })

  it("should deny files in sensitive directories via dotfile blocking", async () => {
    const { validateFilePath } = await import("../../src/file-security.js")
    const homeDir = homedir()

    // Test that dotfiles/dotdirs are blocked (new universal rule)
    expect(() => validateFilePath(join(homeDir, ".ssh", "id_rsa"))).toThrow(
      /Dotfiles and hidden directories/
    )
    expect(() => validateFilePath(join(homeDir, ".gnupg", "private-keys"))).toThrow(
      /Dotfiles and hidden directories/
    )
    expect(() => validateFilePath(join(homeDir, ".aws", "credentials"))).toThrow(
      /Dotfiles and hidden directories/
    )
  })

  it("should deny all .env files anywhere via dotfile blocking", async () => {
    const { validateFilePath } = await import("../../src/file-security.js")
    const homeDir = homedir()

    // Test that all .env variants are blocked by dotfile rule
    expect(() => validateFilePath(join(homeDir, "projects", ".env"))).toThrow(
      /Dotfiles and hidden directories/
    )
    expect(() => validateFilePath(join(homeDir, "projects", ".env.local"))).toThrow(
      /Dotfiles and hidden directories/
    )
    expect(() => validateFilePath(join(homeDir, "projects", ".env.production"))).toThrow(
      /Dotfiles and hidden directories/
    )
  })

  it("should deny files in system directories", async () => {
    const { validateFilePath } = await import("../../src/file-security.js")

    // Test that system directories are blocked
    expect(() => validateFilePath("/etc/passwd")).toThrow(/Access denied/)
    expect(() => validateFilePath("/var/log/system.log")).toThrow(/Access denied/)
    expect(() => validateFilePath("/root/secret.txt")).toThrow(/Access denied/)
  })

  it("should deny files outside allowed paths with helpful error", async () => {
    // Create a custom mock for this test with limited allowed paths
    vi.doMock("../../src/config.js", () => ({
      config: {
        allowedPaths: ["/home/testuser/allowed"],
        deniedPaths: [],
      },
    }))

    const { validateFilePath } = await import("../../src/file-security.js")

    try {
      validateFilePath("/tmp/test.txt")
      expect.fail("Should have thrown an error")
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toContain("outside allowed directories")
      expect((error as Error).message).toContain("MCP_PRINTER_ALLOWED_PATHS")
    }

    vi.doUnmock("../../src/config.js")
    vi.doMock("../../src/config.js", createDefaultConfigMock)
  })

  it("should deny subdirectories of denied paths", async () => {
    const { validateFilePath } = await import("../../src/file-security.js")
    const homeDir = homedir()

    // Subdirectories of denied paths should be denied
    const deepSshPath = join(homeDir, ".ssh", "subfolder", "key.pem")
    expect(() => validateFilePath(deepSshPath)).toThrow(/Access denied/)
  })
})

describe("cross-platform path handling - Windows simulation", () => {
  it("should detect dotfiles in Windows-style paths", async () => {
    const { validateFilePath } = await importFileSecurityWithWindows({
      allowedPaths: ["C:\\Users\\alice"],
      deniedPaths: [],
    })

    // Test Windows dotfile paths - should be blocked
    expect(() => validateFilePath("C:\\Users\\alice\\.env")).toThrow(
      /Dotfiles and hidden directories/
    )
    expect(() => validateFilePath("C:\\Users\\alice\\.ssh\\id_rsa")).toThrow(
      /Dotfiles and hidden directories/
    )
    expect(() => validateFilePath("C:\\Users\\alice\\Documents\\.secret")).toThrow(
      /Dotfiles and hidden directories/
    )
    expect(() => validateFilePath("C:\\Users\\alice\\.config\\app\\settings.json")).toThrow(
      /Dotfiles and hidden directories/
    )
  })

  it("should allow normal Windows paths without dotfiles", async () => {
    const { validateFilePath } = await importFileSecurityWithWindows({
      allowedPaths: ["C:\\Users\\alice\\Documents"],
      deniedPaths: [],
    })

    // Test normal Windows paths - should be allowed
    expect(() => validateFilePath("C:\\Users\\alice\\Documents\\report.pdf")).not.toThrow()
    expect(() => validateFilePath("C:\\Users\\alice\\Documents\\folder\\file.txt")).not.toThrow()
  })

  it("should correctly check path prefixes with Windows backslashes", async () => {
    const { validateFilePath } = await importFileSecurityWithWindows({
      allowedPaths: ["C:\\Users\\alice\\Documents"],
      deniedPaths: ["C:\\Users\\alice\\Documents\\private"],
    })

    // Test allowed path
    expect(() => validateFilePath("C:\\Users\\alice\\Documents\\report.pdf")).not.toThrow()

    // Test denied subdirectory
    expect(() => validateFilePath("C:\\Users\\alice\\Documents\\private\\secret.txt")).toThrow(
      /restricted directory/
    )

    // Test outside allowed paths
    expect(() => validateFilePath("C:\\Users\\alice\\Downloads\\file.pdf")).toThrow(
      /outside allowed directories/
    )
  })
})
