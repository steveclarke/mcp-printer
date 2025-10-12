/**
 * @fileoverview Unit tests for code rendering functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLanguageFromExtension, fixMultilineSpans, renderCodeToPdf } from '../../src/renderers/code.js';
import { unlinkSync } from 'fs';

describe('getLanguageFromExtension', () => {
  it('should map common extensions to highlight.js language names', () => {
    expect(getLanguageFromExtension('file.ts')).toBe('typescript');
    expect(getLanguageFromExtension('script.py')).toBe('python');
    expect(getLanguageFromExtension('main.rs')).toBe('rust');
    expect(getLanguageFromExtension('README.md')).toBe('markdown');
  });

  it('should map multiple variants to same language', () => {
    expect(getLanguageFromExtension('app.js')).toBe('javascript');
    expect(getLanguageFromExtension('component.jsx')).toBe('javascript');
    expect(getLanguageFromExtension('config.yaml')).toBe('yaml');
    expect(getLanguageFromExtension('deploy.yml')).toBe('yaml');
  });

  it('should return original extension for unknown extensions', () => {
    expect(getLanguageFromExtension('file.unknown')).toBe('unknown');
    expect(getLanguageFromExtension('data.xyz')).toBe('xyz');
  });

  it('should handle special files like Makefile', () => {
    expect(getLanguageFromExtension('Makefile')).toBe('makefile');
    expect(getLanguageFromExtension('makefile')).toBe('makefile');
  });
  
  it('should handle full paths', () => {
    expect(getLanguageFromExtension('/path/to/file.ts')).toBe('typescript');
    expect(getLanguageFromExtension('/home/user/script.py')).toBe('python');
  });
});

describe('fixMultilineSpans', () => {
  it('should handle text without spans', () => {
    const input = 'line1\nline2\nline3';
    const result = fixMultilineSpans(input);
    expect(result).toBe('line1\nline2\nline3');
  });

  it('should close and reopen spans across lines', () => {
    const input = '<span class="hljs-keyword">const</span> foo\n<span class="hljs-string">bar</span>';
    const result = fixMultilineSpans(input);
    
    // Each line should be self-contained
    const lines = result.split('\n');
    expect(lines[0]).toContain('const');
    expect(lines[1]).toContain('bar');
  });

  it('should handle nested spans', () => {
    const input = '<span class="outer"><span class="inner">text</span></span>';
    const result = fixMultilineSpans(input);
    expect(result).toContain('text');
  });

  it('should preserve span classes', () => {
    const input = '<span class="hljs-keyword">keyword</span>\ncontinued';
    const result = fixMultilineSpans(input);
    expect(result).toContain('hljs-keyword');
  });

  it('should handle empty lines', () => {
    const input = '<span class="test">line1</span>\n\n<span class="test">line3</span>';
    const result = fixMultilineSpans(input);
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
  });

  it('should handle unclosed spans across multiple lines', () => {
    const input = '<span class="cls1">line1\nline2\nline3</span>';
    const result = fixMultilineSpans(input);
    const lines = result.split('\n');
    
    // Each line should have span closed
    expect(lines[0]).toContain('</span>');
    expect(lines[1]).toContain('</span>');
    expect(lines[2]).toContain('</span>');
  });
});

describe('renderCodeToPdf', () => {
  it('should render a simple JavaScript file to PDF', async () => {
    // Create a simple test file in the test fixtures directory
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../fixtures/test-code.js');
    writeFileSync(testFile, 'const x = 5;\nconsole.log(x);', 'utf-8');
    
    try {
      const pdfPath = await renderCodeToPdf(testFile);
      
      // Check that PDF was created
      expect(pdfPath).toBeDefined();
      expect(pdfPath).toContain('.pdf');
      
      // Check that file exists
      const { existsSync } = await import('fs');
      expect(existsSync(pdfPath)).toBe(true);
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      // Clean up on error
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should handle different languages', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../fixtures/test-code.py');
    writeFileSync(testFile, 'def hello():\n    print("Hello")', 'utf-8');
    
    try {
      const pdfPath = await renderCodeToPdf(testFile);
      expect(pdfPath).toBeDefined();
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should respect line numbers parameter', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../fixtures/test-code.ts');
    writeFileSync(testFile, 'const y = 10;', 'utf-8');
    
    try {
      // With line numbers
      const pdfWithNumbers = await renderCodeToPdf(testFile, true);
      expect(pdfWithNumbers).toBeDefined();
      unlinkSync(pdfWithNumbers);
      
      // Without line numbers
      const pdfWithoutNumbers = await renderCodeToPdf(testFile, false);
      expect(pdfWithoutNumbers).toBeDefined();
      unlinkSync(pdfWithoutNumbers);
      
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should handle empty files', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../fixtures/test-empty.js');
    writeFileSync(testFile, '', 'utf-8');
    
    try {
      const pdfPath = await renderCodeToPdf(testFile);
      expect(pdfPath).toBeDefined();
      
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should handle files with special characters', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../fixtures/test-special-chars.js');
    writeFileSync(testFile, 'const str = "Hello <world> & \"quotes\"";', 'utf-8');
    
    try {
      const pdfPath = await renderCodeToPdf(testFile);
      expect(pdfPath).toBeDefined();
      
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });
});

