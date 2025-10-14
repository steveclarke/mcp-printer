/**
 * @fileoverview Unit tests for page count utilities.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { calculatePhysicalSheets, shouldTriggerConfirmation } from "../../src/utils.js"

// Mock the config module
vi.mock("../../src/config.js", () => ({
  config: {
    confirmIfOverPages: 10, // Default test value
  },
}))

describe("calculatePhysicalSheets", () => {
  it("should return same count for single-sided printing", () => {
    expect(calculatePhysicalSheets(10, false)).toBe(10)
    expect(calculatePhysicalSheets(1, false)).toBe(1)
    expect(calculatePhysicalSheets(100, false)).toBe(100)
  })

  it("should return half (rounded up) for duplex printing", () => {
    expect(calculatePhysicalSheets(10, true)).toBe(5)
    expect(calculatePhysicalSheets(11, true)).toBe(6)
    expect(calculatePhysicalSheets(1, true)).toBe(1)
    expect(calculatePhysicalSheets(2, true)).toBe(1)
    expect(calculatePhysicalSheets(3, true)).toBe(2)
  })

  it("should handle edge cases", () => {
    expect(calculatePhysicalSheets(0, false)).toBe(0)
    expect(calculatePhysicalSheets(0, true)).toBe(0)
  })
})

describe("shouldTriggerConfirmation", () => {
  // Import the mocked config
  let config: { confirmIfOverPages: number }

  beforeEach(async () => {
    // Get the mocked config
    const configModule = await import("../../src/config.js")
    config = configModule.config
    // Reset to default test value
    config.confirmIfOverPages = 10
  })

  it("should return false when threshold is 0 (disabled)", () => {
    config.confirmIfOverPages = 0

    expect(shouldTriggerConfirmation(1)).toBe(false)
    expect(shouldTriggerConfirmation(100)).toBe(false)
    expect(shouldTriggerConfirmation(1000)).toBe(false)
  })

  it("should return true when sheets exceed threshold", () => {
    config.confirmIfOverPages = 10

    expect(shouldTriggerConfirmation(11)).toBe(true)
    expect(shouldTriggerConfirmation(100)).toBe(true)
    expect(shouldTriggerConfirmation(1000)).toBe(true)
  })

  it("should return false when sheets are at or below threshold", () => {
    config.confirmIfOverPages = 10

    expect(shouldTriggerConfirmation(10)).toBe(false)
    expect(shouldTriggerConfirmation(5)).toBe(false)
    expect(shouldTriggerConfirmation(1)).toBe(false)
  })
})
