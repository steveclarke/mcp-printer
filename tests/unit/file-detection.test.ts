/**
 * @fileoverview Unit tests for file type detection logic
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { join } from "path"

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
    expect(await shouldRenderCode("file.js")).toBe(false)
    expect(await shouldRenderCode("file.py")).toBe(false)
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
    expect(await shouldRenderCode("file.txt")).toBe(false)
    expect(await shouldRenderCode("error.log")).toBe(false)
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
    expect(await shouldRenderCode("script.js")).toBe(true)
    expect(await shouldRenderCode("app.py")).toBe(true)
    expect(await shouldRenderCode("component.ts")).toBe(true)
    expect(await shouldRenderCode("config.json")).toBe(true)
    expect(await shouldRenderCode("main.rs")).toBe(true)
    expect(await shouldRenderCode("server.go")).toBe(true)
  })

  it("should return false for unknown extensions (strict whitelist) without shebang", async () => {
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
    // Unknown extensions without shebang should return false (not in whitelist)
    // Note: These tests use fixture files that exist and have no shebang
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    expect(await shouldRenderCode(join(fixturesDir, "no-shebang-plain"))).toBe(false)
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
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    expect(await shouldRenderCode(join(fixturesDir, "Makefile"))).toBe(true)
    expect(await shouldRenderCode(join(fixturesDir, "Dockerfile"))).toBe(true)
  })

  it("should return false for non-whitelisted extensionless files without shebang", async () => {
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
    // Plain text extensionless files without shebang should return false
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    expect(await shouldRenderCode(join(fixturesDir, "LICENSE"))).toBe(false)
    expect(await shouldRenderCode(join(fixturesDir, "README"))).toBe(false)
    expect(await shouldRenderCode(join(fixturesDir, "CHANGELOG"))).toBe(false)
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
    expect(await shouldRenderCode("file.TXT")).toBe(false) // Should be case-insensitive
  })

  it("should detect shebang on first line", async () => {
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
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    // File with shebang on first line should return true
    expect(await shouldRenderCode(join(fixturesDir, "shebang-first-line"))).toBe(true)
  })

  it("should detect shebang after blank lines", async () => {
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
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    // File with shebang after blank line should return true
    expect(await shouldRenderCode(join(fixturesDir, "shebang-after-blank"))).toBe(true)
  })

  it("should detect env-style shebang", async () => {
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
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    // File with #!/usr/bin/env style shebang should return true
    expect(await shouldRenderCode(join(fixturesDir, "shebang-env-style"))).toBe(true)
  })
})

describe("hasShebang", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("should detect shebang on first line", async () => {
    const { hasShebang } = await import("../../src/utils.js")
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    expect(await hasShebang(join(fixturesDir, "shebang-first-line"))).toBe(true)
  })

  it("should detect shebang after blank lines", async () => {
    const { hasShebang } = await import("../../src/utils.js")
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    expect(await hasShebang(join(fixturesDir, "shebang-after-blank"))).toBe(true)
  })

  it("should detect env-style shebang", async () => {
    const { hasShebang } = await import("../../src/utils.js")
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    expect(await hasShebang(join(fixturesDir, "shebang-env-style"))).toBe(true)
  })

  it("should return false for files without shebang", async () => {
    const { hasShebang } = await import("../../src/utils.js")
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    expect(await hasShebang(join(fixturesDir, "no-shebang-plain"))).toBe(false)
    expect(await hasShebang(join(fixturesDir, "LICENSE"))).toBe(false)
    expect(await hasShebang(join(fixturesDir, "README"))).toBe(false)
  })

  it("should return false for non-existent files", async () => {
    const { hasShebang } = await import("../../src/utils.js")
    expect(await hasShebang("/nonexistent/file")).toBe(false)
  })

  it("should handle files with code-like content but no shebang", async () => {
    const { hasShebang } = await import("../../src/utils.js")
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    // hello.py has .py extension so it's code, but this tests the function directly
    expect(await hasShebang(join(fixturesDir, "notes.txt"))).toBe(false)
  })
})
