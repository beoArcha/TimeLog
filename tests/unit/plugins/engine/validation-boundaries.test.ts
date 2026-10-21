import { describe, it, expect } from 'vitest';
import {
  validateProjectName,
  validateTaskName,
  validateTag,
  validateDescription,
  sanitizeText,
  MAX_NAME_LENGTH,
  MAX_TAG_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from '@plugins/engine/validation';
import { EngineValidationError } from '@common/exceptions';

describe('Validation Boundaries and Input Sanitization', () => {
  describe('sanitizeText', () => {
    it('should strip non-printable ASCII control characters when provided', () => {
      // Arrange
      const dirty = 'Hello\x00\x07\x1BWorld\x7F!';

      // Act
      const result = sanitizeText(dirty);

      // Assert
      expect(result).toBe('HelloWorld!');
    });

    it('should preserve newlines and tabs when allowNewlinesAndTabs is true', () => {
      // Arrange
      const formatted = 'Line 1\nLine 2\tIndented\x00Clean';

      // Act
      const result = sanitizeText(formatted, true);

      // Assert
      expect(result).toBe('Line 1\nLine 2\tIndentedClean');
    });

    it('should return empty string when input is empty or nullish', () => {
      // Arrange & Act & Assert
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null as unknown as string)).toBe('');
    });
  });

  describe('validateProjectName', () => {
    it('should throw EngineValidationError when project name exceeds 1000 characters', () => {
      // Arrange
      const overlyLongName = 'A'.repeat(MAX_NAME_LENGTH + 1);

      // Act & Assert
      expect(() => validateProjectName(overlyLongName, [])).toThrow(EngineValidationError);
      expect(() => validateProjectName(overlyLongName, [])).toThrow(
        `Project name exceeds maximum length of ${MAX_NAME_LENGTH} characters`
      );
    });

    it('should pass when project name is exactly 1000 characters', () => {
      // Arrange
      const exactLimitName = 'A'.repeat(MAX_NAME_LENGTH);

      // Act & Assert
      expect(() => validateProjectName(exactLimitName, [])).not.toThrow();
    });

    it('should throw EngineValidationError when project name contains only control characters and whitespace', () => {
      // Arrange
      const whitespaceAndControl = '   \x00\x07\x1B   ';

      // Act & Assert
      expect(() => validateProjectName(whitespaceAndControl, [])).toThrow(
        'Project name cannot be empty'
      );
    });

    it('should throw EngineValidationError when project name is not a string', () => {
      // Arrange & Act & Assert
      expect(() => validateProjectName(12345 as unknown as string, [])).toThrow(
        'Project name must be a string'
      );
    });
  });

  describe('validateTaskName', () => {
    it('should throw EngineValidationError when task name exceeds 1000 characters', () => {
      // Arrange
      const overlyLongName = 'T'.repeat(MAX_NAME_LENGTH + 1);

      // Act & Assert
      expect(() => validateTaskName(overlyLongName)).toThrow(EngineValidationError);
      expect(() => validateTaskName(overlyLongName)).toThrow(
        `Task name exceeds maximum length of ${MAX_NAME_LENGTH} characters`
      );
    });

    it('should pass when task name is exactly 1000 characters', () => {
      // Arrange
      const exactLimitName = 'T'.repeat(MAX_NAME_LENGTH);

      // Act & Assert
      expect(() => validateTaskName(exactLimitName)).not.toThrow();
    });

    it('should throw EngineValidationError when task name contains only control characters and whitespace', () => {
      // Arrange
      const controlOnly = '\x00\x1F   ';

      // Act & Assert
      expect(() => validateTaskName(controlOnly)).toThrow('Task name cannot be empty');
    });

    it('should throw EngineValidationError when task name is not a string', () => {
      // Arrange & Act & Assert
      expect(() => validateTaskName(null as unknown as string)).toThrow(
        'Task name must be a string'
      );
    });
  });

  describe('validateTag', () => {
    it('should throw EngineValidationError when tag exceeds 100 characters', () => {
      // Arrange
      const longTag = 'tag_'.repeat(30); // 120 chars

      // Act & Assert
      expect(() => validateTag(longTag)).toThrow(EngineValidationError);
      expect(() => validateTag(longTag)).toThrow(
        `Tag exceeds maximum length of ${MAX_TAG_LENGTH} characters`
      );
    });

    it('should return trimmed sanitized tag when valid', () => {
      // Arrange
      const validTag = '  urgent-v1\x00  ';

      // Act
      const result = validateTag(validTag);

      // Assert
      expect(result).toBe('urgent-v1');
    });

    it('should throw EngineValidationError when tag is empty or whitespace-only', () => {
      // Arrange & Act & Assert
      expect(() => validateTag('   ')).toThrow('Tag cannot be empty');
    });
  });

  describe('validateDescription', () => {
    it('should throw EngineValidationError when description exceeds 10000 characters', () => {
      // Arrange
      const overlyLongDesc = 'D'.repeat(MAX_DESCRIPTION_LENGTH + 1);

      // Act & Assert
      expect(() => validateDescription(overlyLongDesc)).toThrow(EngineValidationError);
      expect(() => validateDescription(overlyLongDesc)).toThrow(
        `Description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters`
      );
    });

    it('should return null when description is null, undefined, or empty whitespace', () => {
      // Arrange & Act & Assert
      expect(validateDescription(null)).toBeNull();
      expect(validateDescription(undefined)).toBeNull();
      expect(validateDescription('   \n\t   ')).toBeNull();
    });

    it('should preserve newlines and tabs while stripping control characters', () => {
      // Arrange
      const desc = '  Heading\n- Item 1\tIndented\x00  ';

      // Act
      const result = validateDescription(desc);

      // Assert
      expect(result).toBe('Heading\n- Item 1\tIndented');
    });
  });
});
