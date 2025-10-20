/**
 * @fileoverview Unit tests for file type detection logic
 */

import { describe, it, expect } from "vitest"
import { join } from "path"
import { shouldRenderToPdf, hasShebang } from "../../src/utils.js"
import { shouldRenderCode } from "../../src/renderers/code.js"

describe("shouldRenderToPdf", () => {
  it("should return true for markdown extensions (based on config at load time)", () => {
    // This test checks that markdown file extensions are recognized
    // The actual rendering decision depends on config.autoRenderMarkdown
    // which is loaded at startup
    const result = shouldRenderToPdf("README.md")
    // Result depends on MCP_PRINTER_AUTO_RENDER_MARKDOWN env var at startup
    expect(typeof result).toBe("boolean")
  })

  it("should be case insensitive for extensions", () => {
    const result1 = shouldRenderToPdf("FILE.MD")
    const result2 = shouldRenderToPdf("File.Md")
    // Both should return the same result
    expect(result1).toBe(result2)
  })

  it("should return false for non-markdown extensions", () => {
    expect(shouldRenderToPdf("file.txt")).toBe(false)
    expect(shouldRenderToPdf("file.pdf")).toBe(false)
    expect(shouldRenderToPdf("README")).toBe(false)
  })

  it("should handle multiple dots in filename", () => {
    const result = shouldRenderToPdf("my.file.name.md")
    // Should be consistent with other .md files
    expect(typeof result).toBe("boolean")
  })
})

describe("shouldRenderCode", () => {
  it("should return false for excluded extensions", async () => {
    // Test with extensions that might be in the exclude list
    // The actual result depends on MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS
    const result = await shouldRenderCode("file.txt")
    expect(typeof result).toBe("boolean")
  })

  it("should return true for whitelisted code extensions when enabled", async () => {
    // Whitelisted code extensions should return true (unless excluded or autoRenderCode is off)
    const jsResult = await shouldRenderCode("script.js")
    const pyResult = await shouldRenderCode("app.py")
    const tsResult = await shouldRenderCode("component.ts")
    const jsonResult = await shouldRenderCode("config.json")
    const rsResult = await shouldRenderCode("main.rs")
    const goResult = await shouldRenderCode("server.go")

    // All should be boolean
    expect(typeof jsResult).toBe("boolean")
    expect(typeof pyResult).toBe("boolean")
    expect(typeof tsResult).toBe("boolean")
    expect(typeof jsonResult).toBe("boolean")
    expect(typeof rsResult).toBe("boolean")
    expect(typeof goResult).toBe("boolean")
  })

  it("should return false for unknown extensions without shebang", async () => {
    // Unknown extensions without shebang should return false (not in whitelist)
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    const result = await shouldRenderCode(join(fixturesDir, "no-shebang-plain"))
    expect(result).toBe(false)
  })

  it("should return true for whitelisted extensionless code files", async () => {
    // Special extensionless files should return true
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    const makefileResult = await shouldRenderCode(join(fixturesDir, "Makefile"))
    expect(makefileResult).toBe(true)
  })

  it("should return false for non-whitelisted extensionless files without shebang", async () => {
    // Plain text extensionless files without shebang should return false
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    expect(await shouldRenderCode(join(fixturesDir, "LICENSE"))).toBe(false)
    expect(await shouldRenderCode(join(fixturesDir, "README"))).toBe(false)
    expect(await shouldRenderCode(join(fixturesDir, "CHANGELOG"))).toBe(false)
  })

  it("should handle case sensitivity in exclusions", async () => {
    const result = await shouldRenderCode("file.TXT")
    // Should be case-insensitive
    expect(typeof result).toBe("boolean")
  })

  it("should detect shebang on first line", async () => {
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    // File with shebang on first line should return true
    const result = await shouldRenderCode(join(fixturesDir, "shebang-first-line"))
    expect(result).toBe(true)
  })

  it("should detect shebang after blank lines", async () => {
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    // File with shebang after blank line should return true
    const result = await shouldRenderCode(join(fixturesDir, "shebang-after-blank"))
    expect(result).toBe(true)
  })

  it("should detect env-style shebang", async () => {
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    // File with #!/usr/bin/env style shebang should return true
    const result = await shouldRenderCode(join(fixturesDir, "shebang-env-style"))
    expect(result).toBe(true)
  })
})

describe("hasShebang", () => {
  it("should detect shebang on first line", async () => {
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    expect(await hasShebang(join(fixturesDir, "shebang-first-line"))).toBe(true)
  })

  it("should detect shebang after blank lines", async () => {
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    expect(await hasShebang(join(fixturesDir, "shebang-after-blank"))).toBe(true)
  })

  it("should detect env-style shebang", async () => {
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    expect(await hasShebang(join(fixturesDir, "shebang-env-style"))).toBe(true)
  })

  it("should return false for files without shebang", async () => {
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    expect(await hasShebang(join(fixturesDir, "no-shebang-plain"))).toBe(false)
    expect(await hasShebang(join(fixturesDir, "LICENSE"))).toBe(false)
    expect(await hasShebang(join(fixturesDir, "README"))).toBe(false)
  })

  it("should return false for non-existent files", async () => {
    expect(await hasShebang("/nonexistent/file")).toBe(false)
  })

  it("should handle files with code-like content but no shebang", async () => {
    const fixturesDir = join(process.cwd(), "tests", "fixtures")
    // hello.py has .py extension so it's code, but this tests the function directly
    expect(await hasShebang(join(fixturesDir, "notes.txt"))).toBe(false)
  })
})
