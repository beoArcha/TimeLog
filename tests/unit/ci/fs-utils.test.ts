import { describe, expect, it } from 'vitest';
import { detectTextEncoding, extractFilePath } from '../../../scripts/ci/fs-utils.js';

describe('fs-utils', () => {
  describe('extractFilePath', () => {
    it('should normalize Windows backslashes to forward slashes when given a string path', () => {
      // Arrange
      const rawPath = 'src\\engine\\timer.rs';

      // Act
      const result = extractFilePath(rawPath);

      // Assert
      expect(result).toBe('src/engine/timer.rs');
    });

    it('should join array segments into a POSIX path when given Tarpaulin PathBuf segments', () => {
      // Arrange
      const rawSegments = ['src', 'engine', 'mod.rs'];

      // Act
      const result = extractFilePath(rawSegments);

      // Assert
      expect(result).toBe('src/engine/mod.rs');
    });

    it('should extract path property when given an object with path field', () => {
      // Arrange
      const fileObject = { path: 'src\\repositories\\task.rs' };

      // Act
      const result = extractFilePath(fileObject);

      // Assert
      expect(result).toBe('src/repositories/task.rs');
    });

    it('should return empty string when given a null or undefined path', () => {
      // Arrange & Act & Assert
      expect(extractFilePath(null)).toBe('');
      expect(extractFilePath(undefined)).toBe('');
    });
  });

  describe('detectTextEncoding', () => {
    it('should detect utf16le when buffer starts with UTF-16LE byte order mark', () => {
      // Arrange
      const bomBuffer = Buffer.from([0xff, 0xfe, 0x61, 0x00]);

      // Act
      const encoding = detectTextEncoding(bomBuffer);

      // Assert
      expect(encoding).toBe('utf16le');
    });

    it('should detect utf16le when buffer contains alternating null bytes from PowerShell redirection', () => {
      // Arrange
      const utf16leBuffer = Buffer.from('test output stream from powershell', 'utf16le');

      // Act
      const encoding = detectTextEncoding(utf16leBuffer);

      // Assert
      expect(encoding).toBe('utf16le');
    });

    it('should detect utf8 when buffer contains regular UTF-8 text', () => {
      // Arrange
      const utf8Buffer = Buffer.from('test output stream standard linux', 'utf8');

      // Act
      const encoding = detectTextEncoding(utf8Buffer);

      // Assert
      expect(encoding).toBe('utf8');
    });
  });
});
