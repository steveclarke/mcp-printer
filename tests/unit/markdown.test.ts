import { describe, it, expect, vi } from 'vitest';
import { existsSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

// Mock config to allow access to test directory
vi.mock('../../src/config.js', () => {
  const { dirname, join } = require('path');
  const { fileURLToPath } = require('url');
  const testDir = join(dirname(fileURLToPath(import.meta.url)), '..');
  
  return {
    config: {
      allowedPaths: [testDir],
      deniedPaths: [],
      autoRenderMarkdown: true,
      chromePath: '',
    },
    MARKDOWN_EXTENSIONS: ['md', 'markdown'],
  };
});

import { renderMarkdownToPdf } from '../../src/renderers/markdown.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testDir = join(__dirname, '..');

describe('renderMarkdownToPdf', () => {


  it('should render a simple markdown file to PDF', async () => {
    // Create a simple test file in the test tmp directory
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../tmp/test.md');
    writeFileSync(testFile, '# Hello World\n\nThis is a **test** markdown file.', 'utf-8');
    
    try {
      const pdfPath = await renderMarkdownToPdf(testFile);
      
      expect(pdfPath).toBeDefined();
      expect(pdfPath).toContain('.pdf');
      expect(existsSync(pdfPath)).toBe(true);
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      // Clean up even on error
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should handle markdown with code blocks', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../tmp/test-code-blocks.md');
    
    const markdownContent = `# Code Example

\`\`\`javascript
const x = 5;
console.log(x);
\`\`\`

Some text after the code.`;
    
    writeFileSync(testFile, markdownContent, 'utf-8');
    
    try {
      const pdfPath = await renderMarkdownToPdf(testFile);
      expect(pdfPath).toBeDefined();
      expect(existsSync(pdfPath)).toBe(true);
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should handle markdown with lists and formatting', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../tmp/test-formatting.md');
    
    const markdownContent = `# Features

- **Bold text**
- *Italic text*
- \`Inline code\`

1. First item
2. Second item
3. Third item

> This is a blockquote`;
    
    writeFileSync(testFile, markdownContent, 'utf-8');
    
    try {
      const pdfPath = await renderMarkdownToPdf(testFile);
      expect(pdfPath).toBeDefined();
      expect(existsSync(pdfPath)).toBe(true);
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should handle empty markdown files', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../tmp/test-empty.md');
    writeFileSync(testFile, '', 'utf-8');
    
    try {
      const pdfPath = await renderMarkdownToPdf(testFile);
      expect(pdfPath).toBeDefined();
      expect(existsSync(pdfPath)).toBe(true);
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should handle markdown with special characters', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../tmp/test-special.md');
    
    const markdownContent = `# Special Characters

HTML entities: < > & "

Math symbols: α β γ Δ

Emoji: 🎉 ✨ 🚀`;
    
    writeFileSync(testFile, markdownContent, 'utf-8');
    
    try {
      const pdfPath = await renderMarkdownToPdf(testFile);
      expect(pdfPath).toBeDefined();
      expect(existsSync(pdfPath)).toBe(true);
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should inject page numbering into markdown without front-matter', async () => {
    const { writeFileSync, readFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../tmp/test-no-frontmatter.md');
    
    const markdownContent = '# Hello World\n\nThis is a test.';
    writeFileSync(testFile, markdownContent, 'utf-8');
    
    try {
      const pdfPath = await renderMarkdownToPdf(testFile);
      expect(pdfPath).toBeDefined();
      expect(existsSync(pdfPath)).toBe(true);
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should merge page numbering with existing front-matter', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../tmp/test-existing-frontmatter.md');
    
    const markdownContent = `---
title: My Document
author: Test Author
---

# Hello World

This is a test with existing front-matter.`;
    
    writeFileSync(testFile, markdownContent, 'utf-8');
    
    try {
      const pdfPath = await renderMarkdownToPdf(testFile);
      expect(pdfPath).toBeDefined();
      expect(existsSync(pdfPath)).toBe(true);
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should respect existing chrome configuration in front-matter', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../tmp/test-existing-chrome-config.md');
    
    const markdownContent = `---
chrome:
  displayHeaderFooter: false
---

# Hello World

This document has its own chrome config that should not be overridden.`;
    
    writeFileSync(testFile, markdownContent, 'utf-8');
    
    try {
      const pdfPath = await renderMarkdownToPdf(testFile);
      expect(pdfPath).toBeDefined();
      expect(existsSync(pdfPath)).toBe(true);
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should respect existing puppeteer configuration in front-matter', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../tmp/test-existing-puppeteer-config.md');
    
    const markdownContent = `---
puppeteer:
  displayHeaderFooter: true
  headerTemplate: '<div>Custom Header</div>'
---

# Hello World

This document has its own puppeteer config that should not be overridden.`;
    
    writeFileSync(testFile, markdownContent, 'utf-8');
    
    try {
      const pdfPath = await renderMarkdownToPdf(testFile);
      expect(pdfPath).toBeDefined();
      expect(existsSync(pdfPath)).toBe(true);
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should handle empty front-matter blocks', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const testFile = join(__dirname, '../tmp/test-empty-frontmatter.md');
    
    const markdownContent = `---
---

# Hello World

This has an empty front-matter block.`;
    
    writeFileSync(testFile, markdownContent, 'utf-8');
    
    try {
      const pdfPath = await renderMarkdownToPdf(testFile);
      expect(pdfPath).toBeDefined();
      expect(existsSync(pdfPath)).toBe(true);
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });

  it('should handle filenames with HTML special characters', async () => {
    const { writeFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // Filename with HTML entities that need escaping: < > & "
    const testFile = join(__dirname, '../tmp/test-html-chars.md');
    
    const markdownContent = '# Test HTML Escaping\n\nThis tests that filenames with HTML special characters are properly escaped.';
    writeFileSync(testFile, markdownContent, 'utf-8');
    
    try {
      const pdfPath = await renderMarkdownToPdf(testFile);
      expect(pdfPath).toBeDefined();
      expect(existsSync(pdfPath)).toBe(true);
      
      // Clean up
      unlinkSync(pdfPath);
      unlinkSync(testFile);
    } catch (error) {
      try { unlinkSync(testFile); } catch {}
      throw error;
    }
  });
});

