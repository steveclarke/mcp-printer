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

  it('should load string configs from environment with defaults', async () => {
    // Test default values
    delete process.env.MCP_PRINTER_DEFAULT_PRINTER;
    delete process.env.MCP_PRINTER_CHROME_PATH;
    const { config: defaultConfig } = await import('../../src/config.js');
    expect(defaultConfig.defaultPrinter).toBe('');
    expect(defaultConfig.chromePath).toBe('');
    
    vi.resetModules();
    
    // Test loading from environment
    process.env.MCP_PRINTER_DEFAULT_PRINTER = 'MyPrinter';
    process.env.MCP_PRINTER_CHROME_PATH = '/custom/chrome/path';
    const { config: envConfig } = await import('../../src/config.js');
    expect(envConfig.defaultPrinter).toBe('MyPrinter');
    expect(envConfig.chromePath).toBe('/custom/chrome/path');
  });

  it('should parse boolean configs from environment', async () => {
    // Test defaults
    delete process.env.MCP_PRINTER_ENABLE_DUPLEX;
    delete process.env.MCP_PRINTER_ENABLE_MANAGEMENT;
    delete process.env.MCP_PRINTER_FALLBACK_ON_RENDER_ERROR;
    const { config: defaultConfig } = await import('../../src/config.js');
    expect(defaultConfig.enableDuplex).toBe(false);
    expect(defaultConfig.enableManagement).toBe(false);
    expect(defaultConfig.fallbackOnRenderError).toBe(false);
    
    vi.resetModules();
    
    // Test truthy values (true, yes, 1)
    process.env.MCP_PRINTER_ENABLE_DUPLEX = 'true';
    process.env.MCP_PRINTER_ENABLE_MANAGEMENT = 'yes';
    process.env.MCP_PRINTER_FALLBACK_ON_RENDER_ERROR = '1';
    const { config: truthyConfig } = await import('../../src/config.js');
    expect(truthyConfig.enableDuplex).toBe(true);
    expect(truthyConfig.enableManagement).toBe(true);
    expect(truthyConfig.fallbackOnRenderError).toBe(true);
    
    vi.resetModules();
    
    // Test false value
    process.env.MCP_PRINTER_ENABLE_DUPLEX = 'false';
    const { config: falseConfig } = await import('../../src/config.js');
    expect(falseConfig.enableDuplex).toBe(false);
  });

  it('should parse array configs with appropriate delimiters and lowercasing', async () => {
    // Space-delimited array (defaultOptions)
    process.env.MCP_PRINTER_DEFAULT_OPTIONS = 'landscape color=true';
    // Comma-delimited arrays with lowercasing
    process.env.MCP_PRINTER_MARKDOWN_EXTENSIONS = 'MD,Markdown';
    process.env.MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS = 'TXT,Log';
    
    const { config } = await import('../../src/config.js');
    
    expect(config.defaultOptions).toEqual(['landscape', 'color=true']);
    expect(config.markdownExtensions).toEqual(['md', 'markdown']);
    expect(config.code.excludeExtensions).toEqual(['txt', 'log']);
    
    vi.resetModules();
    
    // Test empty arrays
    delete process.env.MCP_PRINTER_DEFAULT_OPTIONS;
    delete process.env.MCP_PRINTER_MARKDOWN_EXTENSIONS;
    delete process.env.MCP_PRINTER_CODE_EXCLUDE_EXTENSIONS;
    
    const { config: emptyConfig } = await import('../../src/config.js');
    expect(emptyConfig.defaultOptions).toEqual([]);
    expect(emptyConfig.markdownExtensions).toEqual([]);
    expect(emptyConfig.code.excludeExtensions).toEqual([]);
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

  it('should parse numeric maxCopies config', async () => {
    delete process.env.MCP_PRINTER_MAX_COPIES;
    const { config: defaultConfig } = await import('../../src/config.js');
    expect(defaultConfig.maxCopies).toBe(10);
    
    vi.resetModules();
    
    process.env.MCP_PRINTER_MAX_COPIES = '50';
    const { config: customConfig } = await import('../../src/config.js');
    expect(customConfig.maxCopies).toBe(50);
    
    vi.resetModules();
    
    process.env.MCP_PRINTER_MAX_COPIES = '0';
    const { config: unlimitedConfig } = await import('../../src/config.js');
    expect(unlimitedConfig.maxCopies).toBe(0);
  });

  it('should load code rendering configs from environment with defaults', async () => {
    // Test defaults
    delete process.env.MCP_PRINTER_CODE_COLOR_SCHEME;
    delete process.env.MCP_PRINTER_CODE_ENABLE_LINE_NUMBERS;
    delete process.env.MCP_PRINTER_CODE_FONT_SIZE;
    delete process.env.MCP_PRINTER_CODE_LINE_SPACING;
    
    const { config: defaultConfig } = await import('../../src/config.js');
    expect(defaultConfig.code.colorScheme).toBe('atom-one-light');
    expect(defaultConfig.code.enableLineNumbers).toBe(true);
    expect(defaultConfig.code.fontSize).toBe('10pt');
    expect(defaultConfig.code.lineSpacing).toBe('1.5');
    
    vi.resetModules();
    
    // Test loading from environment
    process.env.MCP_PRINTER_CODE_COLOR_SCHEME = 'monokai';
    process.env.MCP_PRINTER_CODE_ENABLE_LINE_NUMBERS = 'false';
    process.env.MCP_PRINTER_CODE_FONT_SIZE = '12pt';
    process.env.MCP_PRINTER_CODE_LINE_SPACING = '2.0';
    
    const { config: envConfig } = await import('../../src/config.js');
    expect(envConfig.code.colorScheme).toBe('monokai');
    expect(envConfig.code.enableLineNumbers).toBe(false);
    expect(envConfig.code.fontSize).toBe('12pt');
    expect(envConfig.code.lineSpacing).toBe('2.0');
  });

  it('should handle whitespace in delimited strings', async () => {
    process.env.MCP_PRINTER_DEFAULT_OPTIONS = '  landscape    sides=two-sided-long-edge   color=true  ';
    process.env.MCP_PRINTER_MARKDOWN_EXTENSIONS = ' md , markdown , mdown ';
    process.env.MCP_PRINTER_ALLOWED_PATHS = ' /path/one : /path/two ';
    
    const { config } = await import('../../src/config.js');
    
    expect(config.defaultOptions).toEqual(['landscape', 'sides=two-sided-long-edge', 'color=true']);
    expect(config.markdownExtensions).toEqual(['md', 'markdown', 'mdown']);
    expect(config.allowedPaths).toContain('/path/one');
    expect(config.allowedPaths).toContain('/path/two');
  });
});

