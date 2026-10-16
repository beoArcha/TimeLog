import { describe, it, expect } from 'vitest';
import {
  formatSeconds,
  formatFriendlyDuration,
} from '@features/timelogs/utils/TimelogUtils';

describe('TimelogUtils', () => {
  describe('formatSeconds', () => {
    it('should format seconds cleanly as HH:MM:SS for typical durations', () => {
      // Arrange & Act & Assert
      expect(formatSeconds(0)).toBe('00:00:00');
      expect(formatSeconds(45)).toBe('00:00:45');
      expect(formatSeconds(60)).toBe('00:01:00');
      expect(formatSeconds(75)).toBe('00:01:15');
      expect(formatSeconds(59 * 60 + 59)).toBe('00:59:59');
      expect(formatSeconds(3600)).toBe('01:00:00');
      expect(formatSeconds(3665)).toBe('01:01:05');
      expect(formatSeconds(10 * 3600 + 45 * 60 + 12)).toBe('10:45:12');
    });

    it('should format large second limits correctly without truncation', () => {
      // Arrange & Act
      const formatted = formatSeconds(99 * 3600 + 59 * 60 + 59);

      // Assert
      expect(formatted).toBe('99:59:59');
    });
  });

  describe('formatFriendlyDuration', () => {
    it('should return seconds format when under one minute', () => {
      // Arrange & Act & Assert
      expect(formatFriendlyDuration(0)).toBe('0s');
      expect(formatFriendlyDuration(59)).toBe('59s');
    });

    it('should return minutes and seconds format when under one hour', () => {
      // Arrange & Act & Assert
      expect(formatFriendlyDuration(60)).toBe('1m 0s');
      expect(formatFriendlyDuration(125)).toBe('2m 5s');
    });

    it('should return hours and minutes format when starting from one hour', () => {
      // Arrange & Act & Assert
      expect(formatFriendlyDuration(3600)).toBe('1h 0m');
      expect(formatFriendlyDuration(3660)).toBe('1h 1m');
      expect(formatFriendlyDuration(7380)).toBe('2h 3m');
    });

    it('should handle extremely large durations cleanly', () => {
      // Arrange
      const largeSeconds = 450 * 3600 + 15 * 60;

      // Act
      const formatted = formatFriendlyDuration(largeSeconds);

      // Assert
      expect(formatted).toBe('450h 15m');
    });
  });
});
