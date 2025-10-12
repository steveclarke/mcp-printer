/**
 * @fileoverview Unit tests for file security validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { homedir } from 'os';
import { join } from 'path';

// Mock the config and fs modules before importing
vi.mock('../../src/config.js', () => {
  const homeDir = homedir();
  return {
    config: {
      allowedPaths: [homeDir],
      deniedPaths: [
        join(homeDir, '.ssh'),
        join(homeDir, '.gnupg'),
        join(homeDir, '.aws'),
        '/etc',
        '/var',
        '/root',
      ],
    },
  };
});

describe('validateFilePath', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should allow files under home directory', async () => {
    const { validateFilePath } = await import('../../src/file-security.js');
    const homeDir = homedir();
    const testPath = join(homeDir, 'Documents', 'test.txt');
    
    expect(() => validateFilePath(testPath)).not.toThrow();
  });

  it('should deny files in sensitive directories via dotfile blocking', async () => {
    const { validateFilePath } = await import('../../src/file-security.js');
    const homeDir = homedir();
    
    // Test that dotfiles/dotdirs are blocked (new universal rule)
    expect(() => validateFilePath(join(homeDir, '.ssh', 'id_rsa'))).toThrow(/Dotfiles and hidden directories/);
    expect(() => validateFilePath(join(homeDir, '.gnupg', 'private-keys'))).toThrow(/Dotfiles and hidden directories/);
    expect(() => validateFilePath(join(homeDir, '.aws', 'credentials'))).toThrow(/Dotfiles and hidden directories/);
  });

  it('should deny all .env files anywhere via dotfile blocking', async () => {
    const { validateFilePath } = await import('../../src/file-security.js');
    const homeDir = homedir();
    
    // Test that all .env variants are blocked by dotfile rule
    expect(() => validateFilePath(join(homeDir, 'projects', '.env'))).toThrow(/Dotfiles and hidden directories/);
    expect(() => validateFilePath(join(homeDir, 'projects', '.env.local'))).toThrow(/Dotfiles and hidden directories/);
    expect(() => validateFilePath(join(homeDir, 'projects', '.env.production'))).toThrow(/Dotfiles and hidden directories/);
  });

  it('should deny files in system directories', async () => {
    const { validateFilePath } = await import('../../src/file-security.js');
    
    // Test that system directories are blocked
    expect(() => validateFilePath('/etc/passwd')).toThrow(/Access denied/);
    expect(() => validateFilePath('/var/log/system.log')).toThrow(/Access denied/);
    expect(() => validateFilePath('/root/secret.txt')).toThrow(/Access denied/);
  });

  it('should deny files outside allowed paths with helpful error', async () => {
    // Create a custom mock for this test with limited allowed paths
    vi.doMock('../../src/config.js', () => ({
      config: {
        allowedPaths: ['/home/testuser/allowed'],
        deniedPaths: [],
      },
    }));

    const { validateFilePath } = await import('../../src/file-security.js');
    
    try {
      validateFilePath('/tmp/test.txt');
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('outside allowed directories');
      expect(error.message).toContain('MCP_PRINTER_ALLOWED_PATHS');
    }
  });

  it('should deny subdirectories of denied paths', async () => {
    const { validateFilePath } = await import('../../src/file-security.js');
    const homeDir = homedir();
    
    // Subdirectories of denied paths should be denied
    const deepSshPath = join(homeDir, '.ssh', 'subfolder', 'key.pem');
    expect(() => validateFilePath(deepSshPath)).toThrow(/Access denied/);
  });
});

