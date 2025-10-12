/**
 * @fileoverview Unit tests for pure utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  parseDelimitedString,
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

