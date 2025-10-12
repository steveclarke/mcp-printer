/**
 * @fileoverview Unit tests for configuration parsing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { homedir } from 'os';
import { join } from 'path';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules and environment before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use default printer when not configured', async () => {
    delete process.env.MCP_PRINTER_DEFAULT_PRINTER;
    const { config } = await import('../../src/config.js');
    expect(config.defaultPrinter).toBe('');
  });

  it('should load default printer from environment', async () => {
    process.env.MCP_PRINTER_DEFAULT_PRINTER = 'MyPrinter';
    const { config } = await import('../../src/config.js');
    expect(config.defaultPrinter).toBe('MyPrinter');
  });

  it('should default enableDuplex to false', async () => {
    delete process.env.MCP_PRINTER_ENABLE_DUPLEX;
    const { config } = await import('../../src/config.js');
    expect(config.enableDuplex).toBe(false);
  });

  it('should parse enableDuplex from environment (true)', async () => {
    process.env.MCP_PRINTER_ENABLE_DUPLEX = 'true';
    const { config } = await import('../../src/config.js');
    expect(config.enableDuplex).toBe(true);
  });

  it('should parse enableDuplex from environment (yes)', async () => {
    process.env.MCP_PRINTER_ENABLE_DUPLEX = 'yes';
    const { config } = await import('../../src/config.js');
    expect(config.enableDuplex).toBe(true);
  });

  it('should parse enableDuplex from environment (1)', async () => {
    process.env.MCP_PRINTER_ENABLE_DUPLEX = '1';
    const { config } = await import('../../src/config.js');
    expect(config.enableDuplex).toBe(true);
  });

  it('should parse enableDuplex from environment (false)', async () => {
    process.env.MCP_PRINTER_ENABLE_DUPLEX = 'false';
    const { config } = await import('../../src/config.js');
    expect(config.enableDuplex).toBe(false);
  });

  it('should parse defaultOptions from space-delimited string', async () => {
    process.env.MCP_PRINTER_DEFAULT_OPTIONS = 'landscape color=true';
    const { config } = await import('../../src/config.js');
    expect(config.defaultOptions).toEqual(['landscape', 'color=true']);
  });

  it('should handle empty defaultOptions', async () => {
    delete process.env.MCP_PRINTER_DEFAULT_OPTIONS;
    const { config } = await import('../../src/config.js');
    expect(config.defaultOptions).toEqual([]);
  });

  it('should load chromePath from environment', async () => {
    process.env.MCP_PRINTER_CHROME_PATH = '/custom/chrome/path';
    const { config } = await import('../../src/config.js');
    expect(config.chromePath).toBe('/custom/chrome/path');
  });

  it('should use empty chromePath by default', async () => {
    delete process.env.MCP_PRINTER_CHROME_PATH;
    const { config } = await import('../../src/config.js');
    expect(config.chromePath).toBe('');
  });

  it('should parse markdownExtensions from comma-delimited string', async () => {
    process.env.MCP_PRINTER_MARKDOWN_EXTENSIONS = 'md,markdown,mdown';
    const { config } = await import('../../src/config.js');
    expect(config.markdownExtensions).toEqual(['md', 'markdown', 'mdown']);
  });

  it('should lowercase markdownExtensions', async () => {
    process.env.MCP_PRINTER_MARKDOWN_EXTENSIONS = 'MD,Markdown';
    const { config } = await import('../../src/config.js');
    expect(config.markdownExtensions).toEqual(['md', 'markdown']);
  });

  it('should handle empty markdownExtensions', async () => {
    delete process.env.MCP_PRINTER_MARKDOWN_EXTENSIONS;
    const { config } = await import('../../src/config.js');
    expect(config.markdownExtensions).toEqual([]);
  });

  it('should default enableManagement to false', async () => {
    delete process.env.MCP_PRINTER_ENABLE_MANAGEMENT;
    const { config } = await import('../../src/config.js');
    expect(config.enableManagement).toBe(false);
  });

  it('should parse enableManagement from environment', async () => {
    process.env.MCP_PRINTER_ENABLE_MANAGEMENT = 'true';
    const { config } = await import('../../src/config.js');
    expect(config.enableManagement).toBe(true);
  });

  it('should default fallbackOnRenderError to false', async () => {
    delete process.env.MCP_PRINTER_FALLBACK_ON_RENDER_ERROR;
    const { config } = await import('../../src/config.js');
    expect(config.fallbackOnRenderError).toBe(false);
  });

  it('should parse fallbackOnRenderError from environment', async () => {
    process.env.MCP_PRINTER_FALLBACK_ON_RENDER_ERROR = 'true';
    const { config } = await import('../../src/config.js');
    expect(config.fallbackOnRenderError).toBe(true);
  });

  it('should include home directory in allowedPaths by default', async () => {
    delete process.env.MCP_PRINTER_ALLOWED_PATHS;
    const { config } = await import('../../src/config.js');
    const homeDir = homedir();
    expect(config.allowedPaths).toContain(homeDir);
  });

  it('should merge user-provided allowedPaths with defaults', async () => {
    process.env.MCP_PRINTER_ALLOWED_PATHS = '/custom/path:/another/path';
    const { config } = await import('../../src/config.js');
    const homeDir = homedir();
    expect(config.allowedPaths).toContain(homeDir);
    expect(config.allowedPaths).toContain('/custom/path');
    expect(config.allowedPaths).toContain('/another/path');
  });

  it('should include default denied paths', async () => {
    delete process.env.MCP_PRINTER_DENIED_PATHS;
    const { config } = await import('../../src/config.js');
    const homeDir = homedir();
    expect(config.deniedPaths).toContain(join(homeDir, '.ssh'));
    expect(config.deniedPaths).toContain(join(homeDir, '.gnupg'));
    expect(config.deniedPaths).toContain(join(homeDir, '.aws'));
    expect(config.deniedPaths).toContain('/etc');
  });

  it('should merge user-provided deniedPaths with defaults', async () => {
    process.env.MCP_PRINTER_DENIED_PATHS = '/custom/denied:/another/denied';
    const { config } = await import('../../src/config.js');
    expect(config.deniedPaths).toContain('/custom/denied');
    expect(config.deniedPaths).toContain('/another/denied');
    expect(config.deniedPaths).toContain('/etc'); // Still includes defaults
  });

  it('should default maxCopies to 10', async () => {
    delete process.env.MCP_PRINTER_MAX_COPIES;
    const { config } = await import('../../src/config.js');
    expect(config.maxCopies).toBe(10);
  });

  it('should parse maxCopies from environment', async () => {
    process.env.MCP_PRINTER_MAX_COPIES = '50';
    const { config } = await import('../../src/config.js');
    expect(config.maxCopies).toBe(50);
  });

  it('should parse maxCopies as 0 for unlimited', async () => {
    process.env.MCP_PRINTER_MAX_COPIES = '0';
    const { config } = await import('../../src/config.js');
    expect(config.maxCopies).toBe(0);
  });

  it('should parse code.excludeExtensions from comma-delimited string', async () => {
    process.env.MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS = 'txt,log,bin';
    const { config } = await import('../../src/config.js');
    expect(config.code.excludeExtensions).toEqual(['txt', 'log', 'bin']);
  });

  it('should lowercase code.excludeExtensions', async () => {
    process.env.MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS = 'TXT,Log';
    const { config } = await import('../../src/config.js');
    expect(config.code.excludeExtensions).toEqual(['txt', 'log']);
  });

  it('should default code.excludeExtensions to empty array', async () => {
    delete process.env.MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS;
    const { config } = await import('../../src/config.js');
    expect(config.code.excludeExtensions).toEqual([]);
  });

  it('should default code.colorScheme to atom-one-light', async () => {
    delete process.env.MCP_PRINTER_CODE_COLOR_SCHEME;
    const { config } = await import('../../src/config.js');
    expect(config.code.colorScheme).toBe('atom-one-light');
  });

  it('should load code.colorScheme from environment', async () => {
    process.env.MCP_PRINTER_CODE_COLOR_SCHEME = 'monokai';
    const { config } = await import('../../src/config.js');
    expect(config.code.colorScheme).toBe('monokai');
  });

  it('should default code.enableLineNumbers to true', async () => {
    delete process.env.MCP_PRINTER_CODE_ENABLE_LINE_NUMBERS;
    const { config } = await import('../../src/config.js');
    expect(config.code.enableLineNumbers).toBe(true);
  });

  it('should parse code.enableLineNumbers from environment', async () => {
    process.env.MCP_PRINTER_CODE_ENABLE_LINE_NUMBERS = 'false';
    const { config } = await import('../../src/config.js');
    expect(config.code.enableLineNumbers).toBe(false);
  });

  it('should default code.fontSize to 10pt', async () => {
    delete process.env.MCP_PRINTER_CODE_FONT_SIZE;
    const { config } = await import('../../src/config.js');
    expect(config.code.fontSize).toBe('10pt');
  });

  it('should load code.fontSize from environment', async () => {
    process.env.MCP_PRINTER_CODE_FONT_SIZE = '12pt';
    const { config } = await import('../../src/config.js');
    expect(config.code.fontSize).toBe('12pt');
  });

  it('should default code.lineSpacing to 1.5', async () => {
    delete process.env.MCP_PRINTER_CODE_LINE_SPACING;
    const { config } = await import('../../src/config.js');
    expect(config.code.lineSpacing).toBe('1.5');
  });

  it('should load code.lineSpacing from environment', async () => {
    process.env.MCP_PRINTER_CODE_LINE_SPACING = '2.0';
    const { config } = await import('../../src/config.js');
    expect(config.code.lineSpacing).toBe('2.0');
  });

  it('should handle multiple space-separated options', async () => {
    process.env.MCP_PRINTER_DEFAULT_OPTIONS = '  landscape    sides=two-sided-long-edge   color=true  ';
    const { config } = await import('../../src/config.js');
    expect(config.defaultOptions).toEqual(['landscape', 'sides=two-sided-long-edge', 'color=true']);
  });

  it('should handle comma-separated markdownExtensions with spaces', async () => {
    process.env.MCP_PRINTER_MARKDOWN_EXTENSIONS = ' md , markdown , mdown ';
    const { config } = await import('../../src/config.js');
    expect(config.markdownExtensions).toEqual(['md', 'markdown', 'mdown']);
  });

  it('should handle colon-separated paths with spaces', async () => {
    process.env.MCP_PRINTER_ALLOWED_PATHS = ' /path/one : /path/two ';
    const { config } = await import('../../src/config.js');
    expect(config.allowedPaths).toContain('/path/one');
    expect(config.allowedPaths).toContain('/path/two');
  });
});

