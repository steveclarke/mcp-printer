/**
 * @fileoverview Unit tests for page count utilities.
 */

import { describe, it, expect } from "vitest"
import { calculatePhysicalSheets, shouldTriggerConfirmation } from "../../src/utils.js"
import { config } from "../../src/config.js"

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
  it("should return false when threshold is 0 (disabled)", () => {
    // Save original value
    const originalValue = config.confirmIfOverPages

    // Set to 0 (disabled)
    Object.defineProperty(config, "confirmIfOverPages", { value: 0, writable: true })

    expect(shouldTriggerConfirmation(1)).toBe(false)
    expect(shouldTriggerConfirmation(100)).toBe(false)
    expect(shouldTriggerConfirmation(1000)).toBe(false)

    // Restore original value
    Object.defineProperty(config, "confirmIfOverPages", { value: originalValue, writable: true })
  })

  it("should return true when sheets exceed threshold", () => {
    // Save original value
    const originalValue = config.confirmIfOverPages

    // Set threshold to 10
    Object.defineProperty(config, "confirmIfOverPages", { value: 10, writable: true })

    expect(shouldTriggerConfirmation(11)).toBe(true)
    expect(shouldTriggerConfirmation(100)).toBe(true)
    expect(shouldTriggerConfirmation(1000)).toBe(true)

    // Restore original value
    Object.defineProperty(config, "confirmIfOverPages", { value: originalValue, writable: true })
  })

  it("should return false when sheets are at or below threshold", () => {
    // Save original value
    const originalValue = config.confirmIfOverPages

    // Set threshold to 10
    Object.defineProperty(config, "confirmIfOverPages", { value: 10, writable: true })

    expect(shouldTriggerConfirmation(10)).toBe(false)
    expect(shouldTriggerConfirmation(5)).toBe(false)
    expect(shouldTriggerConfirmation(1)).toBe(false)

    // Restore original value
    Object.defineProperty(config, "confirmIfOverPages", { value: originalValue, writable: true })
  })
})
