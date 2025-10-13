/**
 * @fileoverview Unit tests for file type detection logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { shouldRenderToPdf } from "../../src/utils.js"
import { shouldRenderCode } from "../../src/renderers/code.js"

// Mock the config module
vi.mock("../../src/config.js", () => ({
  MARKDOWN_EXTENSIONS: ["md", "markdown"],
  config: {
    autoRenderMarkdown: false,
    autoRenderCode: true,
    code: {
      excludeExtensions: [],
      enableLineNumbers: true,
      colorScheme: "atom-one-light",
      fontSize: "10pt",
      lineSpacing: "1.5",
    },
  },
}))

describe("shouldRenderToPdf", () => {
  beforeEach(async () => {
    // Reset modules to get a fresh config
    vi.resetModules()
  })

  it("should return false when autoRenderMarkdown is false", async () => {
    vi.doMock("../../src/config.js", () => ({
      MARKDOWN_EXTENSIONS: ["md", "markdown"],
      config: {
        autoRenderMarkdown: false,
        autoRenderCode: true,
        code: { excludeExtensions: [] },
      },
    }))

    const { shouldRenderToPdf } = await import("../../src/utils.js")
    expect(shouldRenderToPdf("file.md")).toBe(false)
  })

  it("should return true for standard markdown extensions when enabled", async () => {
    vi.doMock("../../src/config.js", () => ({
      MARKDOWN_EXTENSIONS: ["md", "markdown"],
      config: {
        autoRenderMarkdown: true,
        autoRenderCode: true,
        code: { excludeExtensions: [] },
      },
    }))

    const { shouldRenderToPdf } = await import("../../src/utils.js")
    expect(shouldRenderToPdf("README.md")).toBe(true)
    expect(shouldRenderToPdf("docs.markdown")).toBe(true)
  })

  it("should be case insensitive for extensions", async () => {
    vi.doMock("../../src/config.js", () => ({
      MARKDOWN_EXTENSIONS: ["md", "markdown"],
      config: {
        autoRenderMarkdown: true,
        autoRenderCode: true,
        code: { excludeExtensions: [] },
      },
    }))

    const { shouldRenderToPdf } = await import("../../src/utils.js")
    expect(shouldRenderToPdf("FILE.MD")).toBe(true)
    expect(shouldRenderToPdf("File.Md")).toBe(true)
  })

  it("should return false for non-markdown extensions and files without extensions", async () => {
    vi.doMock("../../src/config.js", () => ({
      MARKDOWN_EXTENSIONS: ["md", "markdown"],
      config: {
        autoRenderMarkdown: true,
        autoRenderCode: true,
        code: { excludeExtensions: [] },
      },
    }))

    const { shouldRenderToPdf } = await import("../../src/utils.js")
    expect(shouldRenderToPdf("file.txt")).toBe(false)
    expect(shouldRenderToPdf("file.pdf")).toBe(false)
    expect(shouldRenderToPdf("README")).toBe(false)
  })

  it("should handle multiple dots in filename", async () => {
    vi.doMock("../../src/config.js", () => ({
      MARKDOWN_EXTENSIONS: ["md", "markdown"],
      config: {
        autoRenderMarkdown: true,
        autoRenderCode: true,
        code: { excludeExtensions: [] },
      },
    }))

    const { shouldRenderToPdf } = await import("../../src/utils.js")
    expect(shouldRenderToPdf("my.file.name.md")).toBe(true)
  })
})

describe("shouldRenderCode", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("should return false when autoRenderCode is false", async () => {
    vi.doMock("../../src/config.js", () => ({
      config: {
        autoRenderMarkdown: false,
        autoRenderCode: false,
        code: {
          excludeExtensions: [],
          enableLineNumbers: true,
          colorScheme: "atom-one-light",
          fontSize: "10pt",
          lineSpacing: "1.5",
        },
      },
    }))

    const { shouldRenderCode } = await import("../../src/renderers/code.js")
    expect(shouldRenderCode("file.js")).toBe(false)
    expect(shouldRenderCode("file.py")).toBe(false)
  })

  it("should return false for excluded extensions", async () => {
    vi.doMock("../../src/config.js", () => ({
      config: {
        autoRenderMarkdown: false,
        autoRenderCode: true,
        code: {
          excludeExtensions: ["txt", "log"],
          enableLineNumbers: true,
          colorScheme: "atom-one-light",
          fontSize: "10pt",
          lineSpacing: "1.5",
        },
      },
    }))

    const { shouldRenderCode } = await import("../../src/renderers/code.js")
    expect(shouldRenderCode("file.txt")).toBe(false)
    expect(shouldRenderCode("error.log")).toBe(false)
  })

  it("should return true for whitelisted code extensions when enabled", async () => {
    vi.doMock("../../src/config.js", () => ({
      config: {
        autoRenderMarkdown: false,
        autoRenderCode: true,
        code: {
          excludeExtensions: [],
          enableLineNumbers: true,
          colorScheme: "atom-one-light",
          fontSize: "10pt",
          lineSpacing: "1.5",
        },
      },
    }))

    const { shouldRenderCode } = await import("../../src/renderers/code.js")
    // Whitelisted code extensions should return true
    expect(shouldRenderCode("script.js")).toBe(true)
    expect(shouldRenderCode("app.py")).toBe(true)
    expect(shouldRenderCode("component.ts")).toBe(true)
    expect(shouldRenderCode("config.json")).toBe(true)
    expect(shouldRenderCode("main.rs")).toBe(true)
    expect(shouldRenderCode("server.go")).toBe(true)
  })

  it("should return false for unknown extensions (strict whitelist)", async () => {
    vi.doMock("../../src/config.js", () => ({
      config: {
        autoRenderMarkdown: false,
        autoRenderCode: true,
        code: {
          excludeExtensions: [],
          enableLineNumbers: true,
          colorScheme: "atom-one-light",
          fontSize: "10pt",
          lineSpacing: "1.5",
        },
      },
    }))

    const { shouldRenderCode } = await import("../../src/renderers/code.js")
    // Unknown extensions should return false (not in whitelist)
    expect(shouldRenderCode("file.xyz")).toBe(false)
    expect(shouldRenderCode("file.unknown")).toBe(false)
    expect(shouldRenderCode("notes.txt")).toBe(false)
    expect(shouldRenderCode("backup.bak")).toBe(false)
  })

  it("should return true for whitelisted extensionless code files", async () => {
    vi.doMock("../../src/config.js", () => ({
      config: {
        autoRenderMarkdown: false,
        autoRenderCode: true,
        code: {
          excludeExtensions: [],
          enableLineNumbers: true,
          colorScheme: "atom-one-light",
          fontSize: "10pt",
          lineSpacing: "1.5",
        },
      },
    }))

    const { shouldRenderCode } = await import("../../src/renderers/code.js")
    // Special extensionless files should return true
    expect(shouldRenderCode("Makefile")).toBe(true)
    expect(shouldRenderCode("Dockerfile")).toBe(true)
    expect(shouldRenderCode("Gemfile")).toBe(true)
    expect(shouldRenderCode("Rakefile")).toBe(true)
    expect(shouldRenderCode("Vagrantfile")).toBe(true)
  })

  it("should return false for non-whitelisted extensionless files", async () => {
    vi.doMock("../../src/config.js", () => ({
      config: {
        autoRenderMarkdown: false,
        autoRenderCode: true,
        code: {
          excludeExtensions: [],
          enableLineNumbers: true,
          colorScheme: "atom-one-light",
          fontSize: "10pt",
          lineSpacing: "1.5",
        },
      },
    }))

    const { shouldRenderCode } = await import("../../src/renderers/code.js")
    // Plain text extensionless files should return false
    expect(shouldRenderCode("LICENSE")).toBe(false)
    expect(shouldRenderCode("README")).toBe(false)
    expect(shouldRenderCode("CHANGELOG")).toBe(false)
    expect(shouldRenderCode("CONTRIBUTORS")).toBe(false)
  })

  it("should handle case sensitivity in exclusions", async () => {
    vi.doMock("../../src/config.js", () => ({
      config: {
        autoRenderMarkdown: false,
        autoRenderCode: true,
        code: {
          excludeExtensions: ["txt"],
          enableLineNumbers: true,
          colorScheme: "atom-one-light",
          fontSize: "10pt",
          lineSpacing: "1.5",
        },
      },
    }))

    const { shouldRenderCode } = await import("../../src/renderers/code.js")
    expect(shouldRenderCode("file.TXT")).toBe(false) // Should be case-insensitive
  })
})
