/**
 * @fileoverview Integration tests for preview_print_job tool and print_file confirmation logic.
 */

import { describe, it, expect, vi } from "vitest"
import { unlinkSync } from "fs"

// Mock config to allow access to test directory
vi.mock("../../src/config.js", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { dirname, join } = require("path")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { fileURLToPath } = require("url")
  const mockTestDir = join(dirname(fileURLToPath(import.meta.url)), "..")

  return {
    config: {
      allowedPaths: [mockTestDir],
      deniedPaths: [],
      autoRenderMarkdown: true,
      autoRenderCode: true,
      chromePath: "",
      confirmIfOverPages: 0,
      autoDuplex: false,
      defaultOptions: [],
      fallbackOnRenderError: false,
      code: {
        excludeExtensions: [],
        colorScheme: "atom-one-light",
        autoLineNumbers: true,
        fontSize: "10pt",
        lineSpacing: "1.5",
      },
    },
    MARKDOWN_EXTENSIONS: ["md", "markdown"],
  }
})

import { join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import { renderMarkdownToPdf } from "../../src/renderers/markdown.js"
import { renderCodeToPdf } from "../../src/renderers/code.js"
import { getPdfPageCount, calculatePhysicalSheets } from "../../src/utils.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixturesDir = join(__dirname, "../fixtures")

describe("preview_print_job integration", () => {
  describe("getPdfPageCount", () => {
    it("should count pages in a markdown-rendered PDF", async () => {
      const markdownFile = join(fixturesDir, "markdown-test-short.md")
      const pdfPath = await renderMarkdownToPdf(markdownFile)

      try {
        const pageCount = await getPdfPageCount(pdfPath)
        expect(pageCount).toBeGreaterThan(0)
        expect(pageCount).toBeLessThan(5) // Short markdown should be only a few pages
      } finally {
        unlinkSync(pdfPath)
      }
    }, 30000)

    it("should count pages in a code-rendered PDF", async () => {
      const codeFile = join(fixturesDir, "hello.py")
      const pdfPath = await renderCodeToPdf(codeFile)

      try {
        const pageCount = await getPdfPageCount(pdfPath)
        expect(pageCount).toBe(1) // Small Python file should be 1 page
      } finally {
        unlinkSync(pdfPath)
      }
    }, 30000)

    it("should handle longer markdown documents", async () => {
      const markdownFile = join(fixturesDir, "markdown-reference.md")
      const pdfPath = await renderMarkdownToPdf(markdownFile)

      try {
        const pageCount = await getPdfPageCount(pdfPath)
        expect(pageCount).toBeGreaterThanOrEqual(3) // Reference doc should be multiple pages
      } finally {
        unlinkSync(pdfPath)
      }
    }, 30000)
  })

  describe("Physical sheets calculation", () => {
    it("should calculate duplex sheets correctly for even pages", () => {
      const physicalSheets = calculatePhysicalSheets(10, true)
      expect(physicalSheets).toBe(5) // 10 pages = 5 sheets duplex
    })

    it("should calculate duplex sheets correctly for odd pages", () => {
      const physicalSheets = calculatePhysicalSheets(11, true)
      expect(physicalSheets).toBe(6) // 11 pages = 6 sheets duplex (last sheet single-sided)
    })

    it("should calculate single-sided sheets correctly", () => {
      const physicalSheets = calculatePhysicalSheets(10, false)
      expect(physicalSheets).toBe(10) // 10 pages = 10 sheets single-sided
    })
  })

  describe("End-to-end preview workflow", () => {
    it("should preview a small markdown file", async () => {
      const markdownFile = join(fixturesDir, "markdown-test-short.md")
      const pdfPath = await renderMarkdownToPdf(markdownFile)

      try {
        const pageCount = await getPdfPageCount(pdfPath)
        const physicalSheets = calculatePhysicalSheets(pageCount, true)

        expect(pageCount).toBeGreaterThan(0)
        expect(physicalSheets).toBeLessThanOrEqual(pageCount)
      } finally {
        unlinkSync(pdfPath)
      }
    }, 30000)

    it("should preview a code file", async () => {
      const codeFile = join(fixturesDir, "types.ts")
      const pdfPath = await renderCodeToPdf(codeFile)

      try {
        const pageCount = await getPdfPageCount(pdfPath)
        const physicalSheets = calculatePhysicalSheets(pageCount, false)

        expect(pageCount).toBeGreaterThan(0)
        expect(physicalSheets).toBe(pageCount) // Single-sided
      } finally {
        unlinkSync(pdfPath)
      }
    }, 30000)
  })
})
