import { describe, it, expect } from 'vitest';
import { getRangeFilterForPeriod, ReportPeriodOptions } from '@features/reports/utils/periodRanges';

const WARSAW = 'Europe/Warsaw';
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
// Wednesday 14:00 local time (CEST, UTC+2); the local week started on Monday 2026-07-13.
const SUMMER_NOW = new Date('2026-07-15T12:00:00Z');

function resolveInWarsaw(
  period: string,
  options: Partial<ReportPeriodOptions> = {}
): ReturnType<typeof getRangeFilterForPeriod> {
  return getRangeFilterForPeriod({ period, now: SUMMER_NOW, timeZone: WARSAW, ...options });
}

describe('getRangeFilterForPeriod', () => {
  describe('today and yesterday', () => {
    it('should start today at local midnight when a log at 00:10 local still has the previous UTC date', () => {
      // Arrange
      const logStartMs = Date.parse('2026-07-14T22:10:00Z');

      // Act
      const { filter, days } = resolveInWarsaw('today');

      // Assert
      expect(filter.from).toBe('2026-07-14T22:00:00Z');
      expect(filter.to).toBe('2026-07-15T22:00:00Z');
      expect(Date.parse(filter.from!)).toBeLessThanOrEqual(logStartMs);
      expect(logStartMs).toBeLessThan(Date.parse(filter.to!));
      expect(days).toBe(1);
    });

    it('should resolve the local day when the UTC date has not rolled over yet', () => {
      // Arrange
      const localJustAfterMidnight = new Date('2026-07-14T22:30:00Z');

      // Act
      const { filter } = resolveInWarsaw('today', { now: localJustAfterMidnight });

      // Assert
      expect(filter.from).toBe('2026-07-14T22:00:00Z');
    });

    it('should resolve yesterday to the previous local day with one day', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = {};

      // Act
      const { filter, days } = resolveInWarsaw('yesterday', options);

      // Assert
      expect(filter.from).toBe('2026-07-13T22:00:00Z');
      expect(filter.to).toBe('2026-07-14T22:00:00Z');
      expect(days).toBe(1);
    });
  });

  describe('week presets', () => {
    it('should resolve the week from local Monday and count the days since Monday including today', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = {};

      // Act
      const { filter, days } = resolveInWarsaw('week', options);

      // Assert
      expect(filter.from).toBe('2026-07-12T22:00:00Z');
      expect(filter.to).toBe('2026-07-19T22:00:00Z');
      expect(days).toBe(3);
    });

    it('should resolve the previous week with seven days', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = {};

      // Act
      const { filter, days } = resolveInWarsaw('lastWeek', options);

      // Assert
      expect(filter.from).toBe('2026-07-05T22:00:00Z');
      expect(filter.to).toBe('2026-07-12T22:00:00Z');
      expect(days).toBe(7);
    });

    it('should resolve a week containing the spring DST transition to seven local days of 167 hours', () => {
      // Arrange
      const sundayOfTransitionWeek = new Date('2026-03-29T12:00:00Z');

      // Act
      const { filter, days } = resolveInWarsaw('week', { now: sundayOfTransitionWeek });

      // Assert
      expect(filter.from).toBe('2026-03-22T23:00:00Z');
      expect(filter.to).toBe('2026-03-29T22:00:00Z');
      expect(Date.parse(filter.to!) - Date.parse(filter.from!)).toBe(7 * DAY_MS - HOUR_MS);
      expect(days).toBe(7);
    });

    it('should resolve the autumn DST transition day as one local day of 25 hours', () => {
      // Arrange
      const transitionDay = new Date('2026-10-25T12:00:00Z');

      // Act
      const { filter, days } = resolveInWarsaw('today', { now: transitionDay });

      // Assert
      expect(filter.from).toBe('2026-10-24T22:00:00Z');
      expect(filter.to).toBe('2026-10-25T23:00:00Z');
      expect(Date.parse(filter.to!) - Date.parse(filter.from!)).toBe(DAY_MS + HOUR_MS);
      expect(days).toBe(1);
    });
  });

  describe('month and year presets', () => {
    it('should resolve the month from its first local day and count the elapsed days of the month', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = {};

      // Act
      const { filter, days } = resolveInWarsaw('month', options);

      // Assert
      expect(filter.from).toBe('2026-06-30T22:00:00Z');
      expect(filter.to).toBe('2026-07-31T22:00:00Z');
      expect(days).toBe(15);
    });

    it('should resolve the previous month with all of its days', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = {};

      // Act
      const { filter, days } = resolveInWarsaw('lastMonth', options);

      // Assert
      expect(filter.from).toBe('2026-05-31T22:00:00Z');
      expect(filter.to).toBe('2026-06-30T22:00:00Z');
      expect(days).toBe(30);
    });

    it('should resolve the year from local New Year and count the day of the year', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = {};

      // Act
      const { filter, days } = resolveInWarsaw('year', options);

      // Assert
      expect(filter.from).toBe('2025-12-31T23:00:00Z');
      expect(filter.to).toBe('2026-12-31T23:00:00Z');
      expect(days).toBe(196);
    });
  });

  describe('last30Days', () => {
    it('should span exactly 30 local days ending with today', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = {};

      // Act
      const { filter, days } = resolveInWarsaw('last30Days', options);

      // Assert
      expect(filter.from).toBe('2026-06-15T22:00:00Z');
      expect(filter.to).toBe('2026-07-15T22:00:00Z');
      expect(Date.parse(filter.to!) - Date.parse(filter.from!)).toBe(30 * DAY_MS);
      expect(days).toBe(30);
    });
  });

  describe('all', () => {
    it('should leave both edges open and use one day when there are no entries', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = { earliestEntryIso: null };

      // Act
      const { filter, days } = resolveInWarsaw('all', options);

      // Assert
      expect(filter.from).toBeUndefined();
      expect(filter.to).toBeUndefined();
      expect(days).toBe(1);
    });

    it('should count local days from the earliest entry through today', () => {
      // Arrange: 00:30 local on 2026-07-11, still 2026-07-10 in UTC
      const earliestEntryIso = '2026-07-10T22:30:00Z';

      // Act
      const { days } = resolveInWarsaw('all', { earliestEntryIso });

      // Assert
      expect(days).toBe(5);
    });

    it('should count the earliest entry on its local day rather than its UTC day', () => {
      // Arrange: 23:30 local on 2026-07-10
      const earliestEntryIso = '2026-07-10T21:30:00Z';

      // Act
      const { days } = resolveInWarsaw('all', { earliestEntryIso });

      // Assert
      expect(days).toBe(6);
    });

    it('should treat an unknown period name like all', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = { earliestEntryIso: '2026-07-13T08:00:00Z' };

      // Act
      const { filter, days } = resolveInWarsaw('not-a-period', options);

      // Assert
      expect(filter.from).toBeUndefined();
      expect(days).toBe(3);
    });
  });

  describe('custom', () => {
    it('should interpret date-only bounds as local days and include the chosen last day', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = { customFrom: '2026-07-01', customTo: '2026-07-03' };

      // Act
      const { filter, days } = resolveInWarsaw('custom', options);

      // Assert
      expect(filter.from).toBe('2026-06-30T22:00:00Z');
      expect(filter.to).toBe('2026-07-03T22:00:00Z');
      expect(days).toBe(3);
    });

    it('should count one day when from and to are the same local day', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = { customFrom: '2026-07-14', customTo: '2026-07-14' };

      // Act
      const { filter, days } = resolveInWarsaw('custom', options);

      // Assert
      expect(filter.from).toBe('2026-07-13T22:00:00Z');
      expect(filter.to).toBe('2026-07-14T22:00:00Z');
      expect(days).toBe(1);
    });

    it('should anchor an open start at the earliest entry and an open end at today', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = { earliestEntryIso: '2026-07-12T08:00:00Z' };

      // Act
      const { filter, days } = resolveInWarsaw('custom', options);

      // Assert
      expect(filter.from).toBeUndefined();
      expect(filter.to).toBeUndefined();
      expect(days).toBe(4);
    });

    it('should resolve an inverted range to bounds that match nothing instead of throwing', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = { customFrom: '2026-07-10', customTo: '2026-07-05' };

      // Act
      const { filter, days } = resolveInWarsaw('custom', options);

      // Assert
      expect(Date.parse(filter.from!)).toBeGreaterThan(Date.parse(filter.to!));
      expect(days).toBe(1);
    });
  });

  describe('includePatches', () => {
    it('should pass the includePatches flag through to the filter', () => {
      // Arrange
      const options: Partial<ReportPeriodOptions> = { includePatches: true };

      // Act
      const { filter } = resolveInWarsaw('today', options);

      // Assert
      expect(filter.includePatches).toBe(true);
    });
  });
});
