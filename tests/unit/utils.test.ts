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

  it('should trim whitespace and filter empty strings', () => {
    expect(parseDelimitedString(' foo : bar : baz ', ':')).toEqual(['foo', 'bar', 'baz']);
    expect(parseDelimitedString('foo::bar', ':')).toEqual(['foo', 'bar']);
    expect(parseDelimitedString('foo,  ,bar', ',')).toEqual(['foo', 'bar']);
    expect(parseDelimitedString('', ':')).toEqual([]);
    expect(parseDelimitedString(undefined, ':')).toEqual([]);
  });

  it('should apply transform function', () => {
    const result = parseDelimitedString('FOO,Bar,BAZ', ',', s => s.toLowerCase());
    expect(result).toEqual(['foo', 'bar', 'baz']);
  });

  it('should handle single item', () => {
    const result = parseDelimitedString('single', ':');
    expect(result).toEqual(['single']);
  });
});

describe('getLanguageFromExtension', () => {
  it('should map common extensions to highlight.js language names', () => {
    expect(getLanguageFromExtension('ts')).toBe('typescript');
    expect(getLanguageFromExtension('py')).toBe('python');
    expect(getLanguageFromExtension('rs')).toBe('rust');
    expect(getLanguageFromExtension('md')).toBe('markdown');
  });

  it('should map multiple variants to same language', () => {
    expect(getLanguageFromExtension('js')).toBe('javascript');
    expect(getLanguageFromExtension('jsx')).toBe('javascript');
    expect(getLanguageFromExtension('yaml')).toBe('yaml');
    expect(getLanguageFromExtension('yml')).toBe('yaml');
  });

  it('should return original extension for unknown extensions', () => {
    expect(getLanguageFromExtension('unknown')).toBe('unknown');
    expect(getLanguageFromExtension('xyz')).toBe('xyz');
  });

  it('should handle empty extension', () => {
    expect(getLanguageFromExtension('')).toBe('');
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

  it('should format response with options and multiple copies', () => {
    const result = formatPrintResponse(
      'TestPrinter',
      3,
      ['landscape', 'sides=two-sided-long-edge'],
      '/path/to/file.pdf'
    );
    
    expect(result.content[0].text).toContain('TestPrinter');
    expect(result.content[0].text).toContain('Copies: 3');
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
});

