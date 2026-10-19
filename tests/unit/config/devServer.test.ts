import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { resolveDevServerConfig, DEFAULT_DEV_CONFIG } from '../../../config/devServer';

describe('resolveDevServerConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-config-test-'));
    delete process.env.DEV_HOST;
    delete process.env.DEV_PORT;
    delete process.env.DEV_PROTOCOL;
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    delete process.env.DEV_HOST;
    delete process.env.DEV_PORT;
    delete process.env.DEV_PROTOCOL;
  });

  it('should return default fallback config when dev.config.json is absent', () => {
    // Arrange: Empty temporary directory with no config file

    // Act
    const config = resolveDevServerConfig(tempDir);

    // Assert
    expect(config.protocol).toBe('http');
    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(3000);
    expect(config.url).toBe(DEFAULT_DEV_CONFIG.url);
  });

  it('should parse custom host and port from dev.config.json', () => {
    // Arrange
    const customConfig = {
      protocol: 'http',
      host: '127.0.0.1',
      port: 3008,
    };
    fs.writeFileSync(path.join(tempDir, 'dev.config.json'), JSON.stringify(customConfig), 'utf-8');

    // Act
    const config = resolveDevServerConfig(tempDir);

    // Assert
    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(3008);
    expect(config.url).toBe('http://127.0.0.1:3008/');
  });

  it('should prioritize environment variable overrides over config file', () => {
    // Arrange
    const fileConfig = {
      protocol: 'http',
      host: '127.0.0.1',
      port: 3000,
    };
    fs.writeFileSync(path.join(tempDir, 'dev.config.json'), JSON.stringify(fileConfig), 'utf-8');
    process.env.DEV_PORT = '3005';
    process.env.DEV_HOST = '127.0.0.1';

    // Act
    const config = resolveDevServerConfig(tempDir);

    // Assert
    expect(config.port).toBe(3005);
    expect(config.host).toBe('127.0.0.1');
    expect(config.url).toBe('http://127.0.0.1:3005/');
  });

  it('should gracefully fallback when dev.config.json contains malformed JSON', () => {
    // Arrange
    fs.writeFileSync(path.join(tempDir, 'dev.config.json'), '{ malformed json: true, ', 'utf-8');

    // Act
    const config = resolveDevServerConfig(tempDir);

    // Assert
    expect(config.protocol).toBe('http');
    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(3000);
    expect(config.url).toBe(DEFAULT_DEV_CONFIG.url);
  });
});
