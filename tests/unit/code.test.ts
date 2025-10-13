/**
 * @fileoverview Unit tests for code rendering functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { unlinkSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

// Mock config to allow access to test directory
vi.mock("../../src/config.js", () => {
  const { dirname, join } = require("path")
  const { fileURLToPath } = require("url")
  const testDir = join(dirname(fileURLToPath(import.meta.url)), "..")

  return {
    config: {
      allowedPaths: [testDir],
      deniedPaths: [],
      autoRenderCode: true,
      chromePath: "",
      code: {
        excludeExtensions: [],
        colorScheme: "atom-one-light",
        enableLineNumbers: true,
        fontSize: "10pt",
        lineSpacing: "1.5",
      },
    },
    MARKDOWN_EXTENSIONS: ["md", "markdown"],
  }
})

import {
  getLanguageFromExtension,
  fixMultilineSpans,
  renderCodeToPdf,
} from "../../src/renderers/code.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const testDir = join(__dirname, "..")

describe("getLanguageFromExtension", () => {
  it("should map whitelisted extensions to highlight.js language names", () => {
    expect(getLanguageFromExtension("file.ts")).toBe("typescript")
    expect(getLanguageFromExtension("script.py")).toBe("python")
    expect(getLanguageFromExtension("main.rs")).toBe("rust")
    expect(getLanguageFromExtension("README.md")).toBe("markdown")
    expect(getLanguageFromExtension("app.go")).toBe("go")
    expect(getLanguageFromExtension("style.css")).toBe("css")
  })

  it("should map multiple variants to same language", () => {
    expect(getLanguageFromExtension("app.js")).toBe("javascript")
    expect(getLanguageFromExtension("component.jsx")).toBe("javascript")
    expect(getLanguageFromExtension("config.yaml")).toBe("yaml")
    expect(getLanguageFromExtension("deploy.yml")).toBe("yaml")
    expect(getLanguageFromExtension("util.cpp")).toBe("cpp")
    expect(getLanguageFromExtension("util.cc")).toBe("cpp")
    expect(getLanguageFromExtension("util.cxx")).toBe("cpp")
  })

  it("should return empty string for unknown extensions (strict whitelist)", () => {
    expect(getLanguageFromExtension("file.unknown")).toBe("")
    expect(getLanguageFromExtension("data.xyz")).toBe("")
    expect(getLanguageFromExtension("notes.txt")).toBe("")
    expect(getLanguageFromExtension("backup.bak")).toBe("")
  })

  it("should handle extensionless whitelisted code files", () => {
    expect(getLanguageFromExtension("Makefile")).toBe("makefile")
    expect(getLanguageFromExtension("Dockerfile")).toBe("dockerfile")
    expect(getLanguageFromExtension("Gemfile")).toBe("ruby")
    expect(getLanguageFromExtension("Rakefile")).toBe("ruby")
    expect(getLanguageFromExtension("Vagrantfile")).toBe("ruby")
  })

  it("should return empty string for non-whitelisted extensionless files", () => {
    expect(getLanguageFromExtension("LICENSE")).toBe("")
    expect(getLanguageFromExtension("README")).toBe("")
    expect(getLanguageFromExtension("CHANGELOG")).toBe("")
  })

  it("should handle full paths correctly", () => {
    expect(getLanguageFromExtension("/path/to/file.ts")).toBe("typescript")
    expect(getLanguageFromExtension("/home/user/script.py")).toBe("python")
    expect(getLanguageFromExtension("/home/user/Makefile")).toBe("makefile")
    expect(getLanguageFromExtension("/home/user/LICENSE")).toBe("")
  })

  it("should handle Sass files using SCSS highlighting", () => {
    expect(getLanguageFromExtension("style.sass")).toBe("scss")
    expect(getLanguageFromExtension("style.scss")).toBe("scss")
  })
})

describe("fixMultilineSpans", () => {
  it("should handle text without spans", () => {
    const input = "line1\nline2\nline3"
    const result = fixMultilineSpans(input)
    expect(result).toBe("line1\nline2\nline3")
  })

  it("should close and reopen spans across lines", () => {
    const input =
      '<span class="hljs-keyword">const</span> foo\n<span class="hljs-string">bar</span>'
    const result = fixMultilineSpans(input)

    // Each line should be self-contained
    const lines = result.split("\n")
    expect(lines[0]).toContain("const")
    expect(lines[1]).toContain("bar")
  })

  it("should handle nested spans", () => {
    const input = '<span class="outer"><span class="inner">text</span></span>'
    const result = fixMultilineSpans(input)
    expect(result).toContain("text")
  })

  it("should preserve span classes", () => {
    const input = '<span class="hljs-keyword">keyword</span>\ncontinued'
    const result = fixMultilineSpans(input)
    expect(result).toContain("hljs-keyword")
  })

  it("should handle empty lines", () => {
    const input = '<span class="test">line1</span>\n\n<span class="test">line3</span>'
    const result = fixMultilineSpans(input)
    const lines = result.split("\n")
    expect(lines).toHaveLength(3)
  })

  it("should handle unclosed spans across multiple lines", () => {
    const input = '<span class="cls1">line1\nline2\nline3</span>'
    const result = fixMultilineSpans(input)
    const lines = result.split("\n")

    // Each line should have span closed
    expect(lines[0]).toContain("</span>")
    expect(lines[1]).toContain("</span>")
    expect(lines[2]).toContain("</span>")
  })
})

describe("renderCodeToPdf", () => {
  it("should render a simple JavaScript file to PDF", async () => {
    // Create a simple test file in the test tmp directory
    const { writeFileSync } = await import("fs")
    const { join, dirname } = await import("path")
    const { fileURLToPath } = await import("url")

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const testFile = join(__dirname, "../tmp/test-code.js")
    writeFileSync(testFile, "const x = 5;\nconsole.log(x);", "utf-8")

    try {
      const pdfPath = await renderCodeToPdf(testFile)

      // Check that PDF was created
      expect(pdfPath).toBeDefined()
      expect(pdfPath).toContain(".pdf")

      // Check that file exists
      const { existsSync } = await import("fs")
      expect(existsSync(pdfPath)).toBe(true)

      // Clean up
      unlinkSync(pdfPath)
      unlinkSync(testFile)
    } catch (error) {
      // Clean up on error
      try {
        unlinkSync(testFile)
      } catch {}
      throw error
    }
  })

  it("should handle different languages", async () => {
    const { writeFileSync } = await import("fs")
    const { join, dirname } = await import("path")
    const { fileURLToPath } = await import("url")

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const testFile = join(__dirname, "../tmp/test-code.py")
    writeFileSync(testFile, 'def hello():\n    print("Hello")', "utf-8")

    try {
      const pdfPath = await renderCodeToPdf(testFile)
      expect(pdfPath).toBeDefined()

      // Clean up
      unlinkSync(pdfPath)
      unlinkSync(testFile)
    } catch (error) {
      try {
        unlinkSync(testFile)
      } catch {}
      throw error
    }
  })

  it("should respect line numbers parameter", async () => {
    const { writeFileSync } = await import("fs")
    const { join, dirname } = await import("path")
    const { fileURLToPath } = await import("url")

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const testFile = join(__dirname, "../tmp/test-code.ts")
    writeFileSync(testFile, "const y = 10;", "utf-8")

    try {
      // With line numbers
      const pdfWithNumbers = await renderCodeToPdf(testFile, { lineNumbers: true })
      expect(pdfWithNumbers).toBeDefined()
      unlinkSync(pdfWithNumbers)

      // Without line numbers
      const pdfWithoutNumbers = await renderCodeToPdf(testFile, { lineNumbers: false })
      expect(pdfWithoutNumbers).toBeDefined()
      unlinkSync(pdfWithoutNumbers)

      unlinkSync(testFile)
    } catch (error) {
      try {
        unlinkSync(testFile)
      } catch {}
      throw error
    }
  })

  it("should handle empty files", async () => {
    const { writeFileSync } = await import("fs")
    const { join, dirname } = await import("path")
    const { fileURLToPath } = await import("url")

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const testFile = join(__dirname, "../tmp/test-empty.js")
    writeFileSync(testFile, "", "utf-8")

    try {
      const pdfPath = await renderCodeToPdf(testFile)
      expect(pdfPath).toBeDefined()

      unlinkSync(pdfPath)
      unlinkSync(testFile)
    } catch (error) {
      try {
        unlinkSync(testFile)
      } catch {}
      throw error
    }
  })

  it("should handle files with special characters", async () => {
    const { writeFileSync } = await import("fs")
    const { join, dirname } = await import("path")
    const { fileURLToPath } = await import("url")

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const testFile = join(__dirname, "../tmp/test-special-chars.js")
    writeFileSync(testFile, 'const str = "Hello <world> & \"quotes\"";', "utf-8")

    try {
      const pdfPath = await renderCodeToPdf(testFile)
      expect(pdfPath).toBeDefined()

      unlinkSync(pdfPath)
      unlinkSync(testFile)
    } catch (error) {
      try {
        unlinkSync(testFile)
      } catch {}
      throw error
    }
  })
})
