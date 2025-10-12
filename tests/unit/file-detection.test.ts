/**
 * @fileoverview Unit tests for file type detection logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shouldRenderToPdf, shouldRenderCode } from '../../src/utils.js';

// Mock the config module
vi.mock('../../src/config.js', () => ({
  config: {
    markdownExtensions: [],
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

  it('should return false when markdownExtensions is empty', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: [],
        code: { excludeExtensions: [] },
      },
    }));

    const { shouldRenderToPdf } = await import('../../src/utils.js');
    expect(shouldRenderToPdf('file.md')).toBe(false);
  });

  it('should return true for configured markdown extensions', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: ['md', 'markdown'],
        code: { excludeExtensions: [] },
      },
    }));

    const { shouldRenderToPdf } = await import('../../src/utils.js');
    expect(shouldRenderToPdf('README.md')).toBe(true);
    expect(shouldRenderToPdf('docs.markdown')).toBe(true);
  });

  it('should be case insensitive for extensions', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: ['md'],
        code: { excludeExtensions: [] },
      },
    }));

    const { shouldRenderToPdf } = await import('../../src/utils.js');
    expect(shouldRenderToPdf('FILE.MD')).toBe(true);
    expect(shouldRenderToPdf('File.Md')).toBe(true);
  });

  it('should return false for non-configured extensions', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: ['md'],
        code: { excludeExtensions: [] },
      },
    }));

    const { shouldRenderToPdf } = await import('../../src/utils.js');
    expect(shouldRenderToPdf('file.txt')).toBe(false);
    expect(shouldRenderToPdf('file.pdf')).toBe(false);
  });

  it('should handle files without extensions', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: ['md'],
        code: { excludeExtensions: [] },
      },
    }));

    const { shouldRenderToPdf } = await import('../../src/utils.js');
    expect(shouldRenderToPdf('README')).toBe(false);
  });

  it('should handle multiple dots in filename', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: ['md'],
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

  it('should return false when excludeExtensions includes "all"', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: [],
        code: {
          excludeExtensions: ['all'],
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
        markdownExtensions: [],
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

  it('should return true for known code extensions', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: [],
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
    expect(shouldRenderCode('script.js')).toBe(true);
    expect(shouldRenderCode('app.py')).toBe(true);
    expect(shouldRenderCode('main.rs')).toBe(true);
    expect(shouldRenderCode('program.go')).toBe(true);
  });

  it('should return true for unknown extensions (fallback to highlight.js auto-detect)', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: [],
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
    // Unknown extensions return their name from getLanguageFromExtension,
    // which allows highlight.js to attempt auto-detection
    expect(shouldRenderCode('file.xyz')).toBe(true);
    expect(shouldRenderCode('file.unknown')).toBe(true);
  });

  it('should handle case sensitivity in exclusions', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: [],
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

  it('should handle TypeScript files', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: [],
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
    expect(shouldRenderCode('component.ts')).toBe(true);
    expect(shouldRenderCode('component.tsx')).toBe(true);
  });

  it('should handle C/C++ files', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: [],
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
    expect(shouldRenderCode('main.c')).toBe(true);
    expect(shouldRenderCode('main.cpp')).toBe(true);
    expect(shouldRenderCode('header.h')).toBe(true);
  });

  it('should handle shell scripts', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: [],
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
    expect(shouldRenderCode('script.sh')).toBe(true);
    expect(shouldRenderCode('script.bash')).toBe(true);
  });

  it('should handle config files', async () => {
    vi.doMock('../../src/config.js', () => ({
      config: {
        markdownExtensions: [],
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
    expect(shouldRenderCode('config.json')).toBe(true);
    expect(shouldRenderCode('config.yaml')).toBe(true);
    expect(shouldRenderCode('config.yml')).toBe(true);
  });
});

