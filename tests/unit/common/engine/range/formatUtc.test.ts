import { describe, it, expect } from 'vitest';
import { formatUtc } from '@common/engine/range/formatUtc';

describe('formatUtc', () => {
  it('should drop the milliseconds of a whole-second instant', () => {
    // Arrange
    const instant = Date.parse('2026-06-15T10:00:00Z');

    // Act
    const result = formatUtc(instant);

    // Assert
    expect(result).toBe('2026-06-15T10:00:00Z');
  });

  it('should truncate a sub-second part instead of rounding it', () => {
    // Arrange
    const instant = Date.parse('2026-06-15T10:00:00.999Z');

    // Act
    const result = formatUtc(instant);

    // Assert
    expect(result).toBe('2026-06-15T10:00:00Z');
  });

  it('should truncate towards the earlier second before 1970', () => {
    // Arrange
    const instant = -500;

    // Act
    const result = formatUtc(instant);

    // Assert
    expect(result).toBe('1969-12-31T23:59:59Z');
  });
});
