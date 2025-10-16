/**
 * @fileoverview Adapter layer for @printers/printers library.
 * Wraps the native printing library and provides a consistent interface for MCP tools.
 */

import {
  getAllPrinters,
  getPrinterByName,
  getDefaultPrinter as libGetDefaultPrinter,
  type Printer,
  type PrinterJob,
  type PrintJobOptions,
  type SimplePrintOptions,
} from "@printers/printers"

/**
 * Options for printing a file.
 */
export interface PrintOptions {
  copies?: number
  simpleOptions?: Partial<SimplePrintOptions>
  jobName?: string
  waitForCompletion?: boolean
}

/**
 * Result from a print operation.
 */
export interface PrintResult {
  jobId?: string | number
  printerName: string
  success: boolean
}

/**
 * List all available printers on the system.
 *
 * @returns Array of printer objects
 * @throws {Error} If the library fails to enumerate printers
 */
export function listAllPrinters(): Printer[] {
  try {
    return getAllPrinters()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to list printers: ${message}`)
  }
}

/**
 * Get the default printer from the system.
 *
 * @returns The default printer, or null if no default is set
 * @throws {Error} If the library fails to get default printer
 */
export function getDefaultPrinter(): Printer | null {
  try {
    return libGetDefaultPrinter() || null
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to get default printer: ${message}`)
  }
}

/**
 * Get active print jobs for a printer or all printers.
 *
 * @param printerName - Optional printer name to filter jobs
 * @returns Array of job information objects
 * @throws {Error} If the library fails to query jobs
 */
export function getPrinterQueue(printerName?: string): PrinterJob[] {
  try {
    if (printerName) {
      const printer = getPrinterByName(printerName)
      if (!printer) {
        throw new Error(`Printer "${printerName}" not found`)
      }
      return printer.getActiveJobs()
    } else {
      // Get jobs from all printers
      const printers = getAllPrinters()
      const allJobs: PrinterJob[] = []

      for (const printerInfo of printers) {
        const printer = getPrinterByName(printerInfo.name)
        if (printer) {
          const jobs = printer.getActiveJobs()
          allJobs.push(...jobs)
        }
      }

      return allJobs
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to get print queue: ${message}`)
  }
}

/**
 * Print a file to the specified printer.
 *
 * @param filePath - Absolute path to the file to print
 * @param printerName - Name of the printer to use (uses default if not specified)
 * @param options - Print options including copies and CUPS options
 * @returns Print result with job ID and printer name
 * @throws {Error} If printing fails or printer not found
 */
export async function printFile(
  filePath: string,
  printerName?: string,
  options: PrintOptions = {}
): Promise<PrintResult> {
  try {
    // Determine which printer to use
    let targetPrinter: Printer | null = null
    let actualPrinterName: string

    if (printerName) {
      targetPrinter = getPrinterByName(printerName)
      if (!targetPrinter) {
        throw new Error(`Printer "${printerName}" not found`)
      }
      actualPrinterName = printerName
    } else {
      // Use default printer
      const defaultPrinter = getDefaultPrinter()
      if (!defaultPrinter) {
        throw new Error("No default printer set and no printer specified")
      }
      actualPrinterName = defaultPrinter.name
      targetPrinter = defaultPrinter
    }

    // Build print options for the library
    const printOptions: PrintJobOptions = {
      jobName: options.jobName || `MCP Print Job`,
      waitForCompletion: options.waitForCompletion ?? true,
    }

    // Use SimplePrintOptions for all platforms
    if (options.simpleOptions && Object.keys(options.simpleOptions).length > 0) {
      printOptions.simple = options.simpleOptions
    }

    // Handle copies
    if (options.copies && options.copies > 1) {
      if (!printOptions.simple) printOptions.simple = {}
      printOptions.simple.copies = options.copies
    }

    // Print the file
    const jobId = await targetPrinter.printFile(filePath, printOptions)

    return {
      jobId,
      printerName: actualPrinterName,
      success: true,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to print file: ${message}`)
  }
}

/**
 * Cancel a print job.
 *
 * Note: The @printers/printers library does not currently expose job cancellation
 * through its API. This function will attempt to use system commands as a fallback.
 *
 * @param jobId - Job ID to cancel
 * @param printerName - Optional printer name
 * @throws {Error} If cancellation fails or is not supported
 */
export async function cancelJob(jobId: string, printerName?: string): Promise<void> {
  if (process.platform === "win32") {
    throw new Error("Job cancellation is not yet supported on Windows")
  }

  // The library doesn't expose a cancel method on jobs
  // We'll need to use system commands as a fallback
  const { execa } = await import("execa")

  try {
    const args: string[] = []
    if (printerName) {
      // Get printer to find systemName for CUPS command
      const printer = getPrinterByName(printerName)
      const cupsName = printer?.systemName || printerName
      args.push("-P", cupsName)
    }
    args.push(jobId)

    await execa("cancel", args)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to cancel job: ${message}`)
  }
}

/**
 * Cancel all jobs for a specific printer.
 *
 * Note: Uses system commands as the library doesn't expose job cancellation.
 *
 * @param printerName - Name of the printer
 * @throws {Error} If cancellation fails
 */
export async function cancelAllJobs(printerName: string): Promise<void> {
  if (process.platform === "win32") {
    throw new Error("Bulk job cancellation is not yet supported on Windows")
  }

  const { execa } = await import("execa")

  try {
    // Verify printer exists
    const printer = getPrinterByName(printerName)
    if (!printer) {
      throw new Error(`Printer "${printerName}" not found`)
    }

    // Use CUPS cancel command to cancel all jobs
    // Use systemName for CUPS command
    const cupsName = printer.systemName || printer.name
    await execa("cancel", ["-a", cupsName])
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to cancel all jobs: ${message}`)
  }
}

/**
 * Set a printer as the default printer.
 *
 * Note: Uses system commands as the library doesn't expose this functionality.
 *
 * @param printerName - Name of the printer to set as default
 * @throws {Error} If setting default printer fails
 */
export async function setDefaultPrinter(printerName: string): Promise<void> {
  if (process.platform === "win32") {
    throw new Error(
      "Setting default printer is not yet supported on Windows. Use Windows Settings."
    )
  }

  const { execa } = await import("execa")

  try {
    // Verify printer exists
    const printer = getPrinterByName(printerName)
    if (!printer) {
      throw new Error(`Printer "${printerName}" not found`)
    }

    // Use lpoptions to set default printer
    // Use systemName if available (CUPS internal name), otherwise fall back to display name
    const cupsName = printer.systemName || printer.name
    await execa("lpoptions", ["-d", cupsName])
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to set default printer: ${message}`)
  }
}

/**
 * Format printer information for display.
 *
 * @param printers - Array of printer objects
 * @returns Formatted string suitable for MCP response
 */
export function formatPrinterList(printers: Printer[]): string {
  if (printers.length === 0) {
    return "No printers found"
  }

  const lines: string[] = []

  for (const printer of printers) {
    const defaultMarker = printer.isDefault ? " (default)" : ""
    const state = printer.state || "unknown"
    lines.push(`printer ${printer.name} is ${state}${defaultMarker}`)
  }

  // Add a line showing which is the default
  const defaultPrinter = printers.find((p) => p.isDefault)
  if (defaultPrinter) {
    lines.push(`system default destination: ${defaultPrinter.name}`)
  } else {
    lines.push("no system default destination")
  }

  return lines.join("\n")
}

/**
 * Format print queue information for display.
 *
 * @param jobs - Array of job objects
 * @param printerName - Optional printer name for context
 * @returns Formatted string suitable for MCP response
 */
export function formatPrintQueue(jobs: PrinterJob[], printerName?: string): string {
  if (jobs.length === 0) {
    const prefix = printerName ? `${printerName} ` : ""
    return `${prefix}is ready\nno entries`
  }

  const lines: string[] = []

  if (printerName) {
    lines.push(`Rank\tOwner\tJob\tFiles\t\t\tTotal Size`)
  }

  for (const job of jobs) {
    const rank = "-" // Library doesn't expose priority/rank
    const owner = "user" // Library doesn't expose owner info
    const id = job.id
    const name = job.name || "untitled"
    const state = job.state
    const age = Math.round(job.ageSeconds)

    lines.push(`${rank}\t${owner}\t${id}\t${name}\t\t${state} (${age}s)`)
  }

  return lines.join("\n")
}
