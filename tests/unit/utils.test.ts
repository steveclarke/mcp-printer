/**
 * @fileoverview Unit tests for pure utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  parseDelimitedString,
  getLanguageFromExtension,
  fixMultilineSpans,
  formatPrintResponse,
} from '../../src/utils.js';

describe('parseDelimitedString', () => {
  it('should parse colon-delimited string', () => {
    const result = parseDelimitedString('foo:bar:baz', ':');
    expect(result).toEqual(['foo', 'bar', 'baz']);
  });

  it('should parse comma-delimited string', () => {
    const result = parseDelimitedString('a,b,c', ',');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should parse space-delimited string with regex', () => {
    const result = parseDelimitedString('opt1 opt2  opt3', /\s+/);
    expect(result).toEqual(['opt1', 'opt2', 'opt3']);
  });

  it('should trim whitespace from items', () => {
    const result = parseDelimitedString(' foo : bar : baz ', ':');
    expect(result).toEqual(['foo', 'bar', 'baz']);
  });

  it('should filter out empty strings', () => {
    const result = parseDelimitedString('foo::bar', ':');
    expect(result).toEqual(['foo', 'bar']);
  });

  it('should return empty array for undefined value', () => {
    const result = parseDelimitedString(undefined, ':');
    expect(result).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    const result = parseDelimitedString('', ':');
    expect(result).toEqual([]);
  });

  it('should apply transform function', () => {
    const result = parseDelimitedString('FOO,Bar,BAZ', ',', s => s.toLowerCase());
    expect(result).toEqual(['foo', 'bar', 'baz']);
  });

  it('should handle single item', () => {
    const result = parseDelimitedString('single', ':');
    expect(result).toEqual(['single']);
  });

  it('should handle whitespace-only items', () => {
    const result = parseDelimitedString('foo,  ,bar', ',');
    expect(result).toEqual(['foo', 'bar']);
  });
});

describe('getLanguageFromExtension', () => {
  it('should map common JavaScript extensions', () => {
    expect(getLanguageFromExtension('js')).toBe('javascript');
    expect(getLanguageFromExtension('jsx')).toBe('javascript');
  });

  it('should map TypeScript extensions', () => {
    expect(getLanguageFromExtension('ts')).toBe('typescript');
    expect(getLanguageFromExtension('tsx')).toBe('typescript');
  });

  it('should map Python extension', () => {
    expect(getLanguageFromExtension('py')).toBe('python');
  });

  it('should map C/C++ extensions', () => {
    expect(getLanguageFromExtension('c')).toBe('c');
    expect(getLanguageFromExtension('cpp')).toBe('cpp');
    expect(getLanguageFromExtension('cc')).toBe('cpp');
    expect(getLanguageFromExtension('cxx')).toBe('cpp');
    expect(getLanguageFromExtension('h')).toBe('c');
    expect(getLanguageFromExtension('hpp')).toBe('cpp');
  });

  it('should map shell script extensions', () => {
    expect(getLanguageFromExtension('sh')).toBe('bash');
    expect(getLanguageFromExtension('bash')).toBe('bash');
    expect(getLanguageFromExtension('zsh')).toBe('bash');
    expect(getLanguageFromExtension('fish')).toBe('bash');
  });

  it('should map data format extensions', () => {
    expect(getLanguageFromExtension('json')).toBe('json');
    expect(getLanguageFromExtension('yaml')).toBe('yaml');
    expect(getLanguageFromExtension('yml')).toBe('yaml');
    expect(getLanguageFromExtension('xml')).toBe('xml');
  });

  it('should map Rust extension', () => {
    expect(getLanguageFromExtension('rs')).toBe('rust');
  });

  it('should map Go extension', () => {
    expect(getLanguageFromExtension('go')).toBe('go');
  });

  it('should return original extension for unknown extensions', () => {
    expect(getLanguageFromExtension('unknown')).toBe('unknown');
    expect(getLanguageFromExtension('xyz')).toBe('xyz');
  });

  it('should handle empty extension', () => {
    expect(getLanguageFromExtension('')).toBe('');
  });

  it('should map markdown extension', () => {
    expect(getLanguageFromExtension('md')).toBe('markdown');
  });

  it('should map dockerfile extension', () => {
    expect(getLanguageFromExtension('dockerfile')).toBe('dockerfile');
  });

  it('should map makefile extensions', () => {
    expect(getLanguageFromExtension('makefile')).toBe('makefile');
    expect(getLanguageFromExtension('mk')).toBe('makefile');
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

describe('formatPrintResponse', () => {
  it('should format basic response without options', () => {
    const result = formatPrintResponse('TestPrinter', 1, [], '/path/to/file.txt');
    
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('TestPrinter');
    expect(result.content[0].text).toContain('Copies: 1');
    expect(result.content[0].text).toContain('/path/to/file.txt');
    expect(result.content[0].text).not.toContain('Options:');
  });

  it('should format response with options', () => {
    const result = formatPrintResponse(
      'TestPrinter',
      2,
      ['landscape', 'sides=two-sided-long-edge'],
      '/path/to/file.pdf'
    );
    
    expect(result.content[0].text).toContain('TestPrinter');
    expect(result.content[0].text).toContain('Copies: 2');
    expect(result.content[0].text).toContain('Options: landscape, sides=two-sided-long-edge');
    expect(result.content[0].text).toContain('/path/to/file.pdf');
  });

  it('should include render type when provided', () => {
    const result = formatPrintResponse(
      'TestPrinter',
      1,
      [],
      '/path/to/file.md',
      'markdown → PDF'
    );
    
    expect(result.content[0].text).toContain('Rendered: markdown → PDF');
  });

  it('should not include render note when not provided', () => {
    const result = formatPrintResponse('TestPrinter', 1, [], '/path/to/file.txt');
    expect(result.content[0].text).not.toContain('Rendered:');
  });

  it('should handle multiple copies', () => {
    const result = formatPrintResponse('TestPrinter', 5, [], '/path/to/file.txt');
    expect(result.content[0].text).toContain('Copies: 5');
  });

  it('should format with all features', () => {
    const result = formatPrintResponse(
      'MyPrinter',
      3,
      ['duplex', 'color=true'],
      '/documents/report.md',
      'markdown → PDF'
    );
    
    const text = result.content[0].text;
    expect(text).toContain('MyPrinter');
    expect(text).toContain('Copies: 3');
    expect(text).toContain('Options: duplex, color=true');
    expect(text).toContain('/documents/report.md');
    expect(text).toContain('Rendered: markdown → PDF');
  });

  it('should include checkmark in response', () => {
    const result = formatPrintResponse('TestPrinter', 1, [], '/path/to/file.txt');
    expect(result.content[0].text).toContain('✓');
  });
});

