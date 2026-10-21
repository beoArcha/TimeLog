import { describe, it, expect } from 'vitest';
import {
  calculateLogDurationSeconds,
  calculateStartOfWeek,
} from '@features/reports/utils/reportCalculator';

describe('Unit: reportCalculator - Durations and Week Calculation', () => {
  describe('calculateLogDurationSeconds', () => {
    const referenceNowMs = new Date('2026-07-15T12:00:00.000Z').getTime();

    it('should calculate accurate duration for normal positive time range', () => {
      // Arrange
      const startTime = '2026-07-15T10:00:00.000Z';
      const endTime = '2026-07-15T11:00:00.000Z';

      // Act
      const duration = calculateLogDurationSeconds(startTime, endTime, referenceNowMs);

      // Assert
      expect(duration).toBe(3600);
    });

    it('should return 0 when start time equals end time', () => {
      // Arrange
      const startTime = '2026-07-15T10:00:00.000Z';

      // Act
      const duration = calculateLogDurationSeconds(startTime, startTime, referenceNowMs);

      // Assert
      expect(duration).toBe(0);
    });

    it('should clamp to 0 when end time is before start time (negative duration)', () => {
      // Arrange
      const startTime = '2026-07-15T11:00:00.000Z';
      const endTime = '2026-07-15T10:00:00.000Z';

      // Act
      const duration = calculateLogDurationSeconds(startTime, endTime, referenceNowMs);

      // Assert
      expect(duration).toBe(0);
    });

    it('should fallback to referenceNowMs when endTime is null or undefined', () => {
      // Arrange
      const startTime = '2026-07-15T11:00:00.000Z';

      // Act
      const durationNull = calculateLogDurationSeconds(startTime, null, referenceNowMs);
      const durationUndefined = calculateLogDurationSeconds(startTime, undefined, referenceNowMs);

      // Assert
      expect(durationNull).toBe(3600);
      expect(durationUndefined).toBe(3600);
    });

    it('should floor fractional seconds correctly', () => {
      // Arrange
      const startTime = '2026-07-15T10:00:00.000Z';
      const endTime = '2026-07-15T10:00:01.999Z';

      // Act
      const duration = calculateLogDurationSeconds(startTime, endTime, referenceNowMs);

      // Assert
      expect(duration).toBe(1);
    });
  });

  describe('calculateStartOfWeek', () => {
    it('should calculate Monday 00:00:00 when input date is already Monday', () => {
      // Arrange
      const monday = new Date('2026-07-13T10:15:30Z');

      // Act
      const startOfWeekMs = calculateStartOfWeek(monday);
      const startOfWeek = new Date(startOfWeekMs);

      // Assert
      expect(startOfWeek.getDay()).toBe(1);
      expect(startOfWeek.getDate()).toBe(13);
      expect(startOfWeek.getHours()).toBe(0);
      expect(startOfWeek.getMinutes()).toBe(0);
      expect(startOfWeek.getSeconds()).toBe(0);
    });

    it('should calculate Monday 00:00:00 for mid-week Wednesday date', () => {
      // Arrange
      const wednesday = new Date('2026-07-15T14:30:00Z');

      // Act
      const startOfWeekMs = calculateStartOfWeek(wednesday);
      const startOfWeek = new Date(startOfWeekMs);

      // Assert
      expect(startOfWeek.getDay()).toBe(1);
      expect(startOfWeek.getDate()).toBe(13);
      expect(startOfWeek.getHours()).toBe(0);
      expect(startOfWeek.getMinutes()).toBe(0);
      expect(startOfWeek.getSeconds()).toBe(0);
    });

    it('should calculate Monday for Sunday date across week boundary', () => {
      // Arrange
      const sunday = new Date('2026-07-19T18:00:00Z');

      // Act
      const startOfWeekMs = calculateStartOfWeek(sunday);
      const startOfWeek = new Date(startOfWeekMs);

      // Assert
      expect(startOfWeek.getDay()).toBe(1);
      expect(startOfWeek.getDate()).toBe(13);
    });
  });
});
