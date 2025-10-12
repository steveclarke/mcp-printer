/**
 * @fileoverview Unit tests for file type detection logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shouldRenderToPdf, shouldRenderCode } from '../../src/utils.js';

// Mock the config module
vi.mock('../../src/config.js', () => ({
  MARKDOWN_EXTENSIONS: ['md', 'markdown'],
  config: {
    enableMarkdownRender: false,
    enableCodeRender: true,
    code: {
      excludeExtensions: [],
      enableLineNumbers: true,
      colorScheme: 'atom-one-light',
      fontSize: '10pt',
      lineSpacing: '1.5',
    },
  },
}));

describe('shouldRenderToPdf', () => {
  beforeEach(async () => {
    // Reset modules to get a fresh config
    vi.resetModules();
  });

  it('should return false when enableMarkdownRender is false', async () => {
    vi.doMock('../../src/config.js', () => ({
      MARKDOWN_EXTENSIONS: ['md', 'markdown'],
      config: {
        enableMarkdownRender: false,
        enableCodeRender: true,
        code: { excludeExtensions: [] },
      },
    }));

    const { shouldRenderToPdf } = await import('../../src/utils.js');
    expect(shouldRenderToPdf('file.md')).toBe(false);
  });

  it('should return true for standard markdown extensions when enabled', async () => {
    vi.doMock('../../src/config.js', () => ({
      MARKDOWN_EXTENSIONS: ['md', 'markdown'],
      config: {
        enableMarkdownRender: true,
        enableCodeRender: true,
        code: { excludeExtensions: [] },
      },
    }));

    const { shouldRenderToPdf } = await import('../../src/utils.js');
    expect(shouldRenderToPdf('README.md')).toBe(true);
    expect(shouldRenderToPdf('docs.markdown')).toBe(true);
  });

  it('should be case insensitive for extensions', async () => {
    vi.doMock('../../src/config.js', () => ({
      MARKDOWN_EXTENSIONS: ['md', 'markdown'],
      config: {
        enableMarkdownRender: true,
        enableCodeRender: true,
        code: { excludeExtensions: [] },
      },
    }));

    const { shouldRenderToPdf } = await import('../../src/utils.js');
    expect(shouldRenderToPdf('FILE.MD')).toBe(true);
    expect(shouldRenderToPdf('File.Md')).toBe(true);
  });

  it('should return false for non-markdown extensions and files without extensions', async () => {
    vi.doMock('../../src/config.js', () => ({
      MARKDOWN_EXTENSIONS: ['md', 'markdown'],
      config: {
        enableMarkdownRender: true,
        enableCodeRender: true,
        code: { excludeExtensions: [] },
      },
    }));

    const { shouldRenderToPdf } = await import('../../src/utils.js');
    expect(shouldRenderToPdf('file.txt')).toBe(false);
    expect(shouldRenderToPdf('file.pdf')).toBe(false);
    expect(shouldRenderToPdf('README')).toBe(false);
  });

  it('should handle multiple dots in filename', async () => {
    vi.doMock('../../src/config.js', () => ({
      MARKDOWN_EXTENSIONS: ['md', 'markdown'],
      config: {
        enableMarkdownRender: true,
        enableCodeRender: true,
        code: { excludeExtensions: [] },
      },
    }));

    const { shouldRenderToPdf } = await import('../../src/utils.js');
    expect(shouldRenderToPdf('my.file.name.md')).toBe(true);
  });
});

describe('shouldRenderCode', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return false when enableCodeRender is false', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        enableMarkdownRender: false,
        enableCodeRender: false,
        code: {
          excludeExtensions: [],
          enableLineNumbers: true,
          colorScheme: 'atom-one-light',
          fontSize: '10pt',
          lineSpacing: '1.5',
        },
      },
    }));

    const { shouldRenderCode } = await import('../../src/utils.js');
    expect(shouldRenderCode('file.js')).toBe(false);
    expect(shouldRenderCode('file.py')).toBe(false);
  });

  it('should return false for excluded extensions', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        enableMarkdownRender: false,
        enableCodeRender: true,
        code: {
          excludeExtensions: ['txt', 'log'],
          enableLineNumbers: true,
          colorScheme: 'atom-one-light',
          fontSize: '10pt',
          lineSpacing: '1.5',
        },
      },
    }));

    const { shouldRenderCode } = await import('../../src/utils.js');
    expect(shouldRenderCode('file.txt')).toBe(false);
    expect(shouldRenderCode('error.log')).toBe(false);
  });

  it('should return true for known and unknown code extensions when enabled', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        enableMarkdownRender: false,
        enableCodeRender: true,
        code: {
          excludeExtensions: [],
          enableLineNumbers: true,
          colorScheme: 'atom-one-light',
          fontSize: '10pt',
          lineSpacing: '1.5',
        },
      },
    }));

    const { shouldRenderCode } = await import('../../src/utils.js');
    // Known code extensions should work
    expect(shouldRenderCode('script.js')).toBe(true);
    expect(shouldRenderCode('app.py')).toBe(true);
    expect(shouldRenderCode('component.ts')).toBe(true);
    expect(shouldRenderCode('config.json')).toBe(true);
    
    // Unknown extensions should fallback to highlight.js auto-detection
    expect(shouldRenderCode('file.xyz')).toBe(true);
    expect(shouldRenderCode('file.unknown')).toBe(true);
  });

  it('should handle case sensitivity in exclusions', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        enableMarkdownRender: false,
        enableCodeRender: true,
        code: {
          excludeExtensions: ['txt'],
          enableLineNumbers: true,
          colorScheme: 'atom-one-light',
          fontSize: '10pt',
          lineSpacing: '1.5',
        },
      },
    }));

    const { shouldRenderCode } = await import('../../src/utils.js');
    expect(shouldRenderCode('file.TXT')).toBe(false); // Should be case-insensitive
  });
});

