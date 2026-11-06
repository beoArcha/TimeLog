// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import StackedBarActivityChart from '@features/reports/components/StackedBarActivityChart';
import {
  formatChartDate,
  parseUtcCalendarDate,
  getUtcDateKey,
  resolveDateTimeLocale,
  getChartDateFormatter,
} from '@features/reports/utils/reportDateUtils';
import { aProject, aClampedTimeLog } from '@tests/shared/builders/entity-builders';
import { MockLocaleProvider } from '@tests/shared/mocks/MockProviders';
import type { Locale } from '@bindings/Locale';

describe('Unit Tests: StackedBarActivityChart', () => {
  afterEach(() => {
    cleanup();
  });

  const mockProjects = [
    aProject({ id: 'p1', name: 'Alpha Project', color: 'rose' }),
    aProject({ id: 'p2', name: 'Beta Project', color: 'teal' }),
  ];

  it('should render empty state when clampedLogs is empty', () => {
    // Arrange & Act
    render(
      <StackedBarActivityChart
        clampedLogs={[]}
        projects={mockProjects}
      />
    );

    // Assert
    expect(screen.getByTestId('stacked-chart-empty')).not.toBeNull();
  });

  it('should render stacked bar activity chart when logs are provided', () => {
    // Arrange
    const logs = [
      aClampedTimeLog({
        id: 'cl1',
        projectId: 'p1',
        clampedStartTime: '2026-06-15T10:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
      aClampedTimeLog({
        id: 'cl2',
        projectId: 'p2',
        clampedStartTime: '2026-06-15T11:00:00.000Z',
        clampedDurationSeconds: 7200,
      }),
    ];

    // Act
    render(
      <StackedBarActivityChart
        clampedLogs={logs}
        projects={mockProjects}
      />
    );

    // Assert
    expect(screen.getByTestId('stacked-bar-activity-chart')).not.toBeNull();
    expect(screen.queryByTestId('stacked-chart-empty')).toBeNull();
  });

  it('should toggle content visibility when collapsible header is clicked', () => {
    // Arrange
    render(
      <StackedBarActivityChart
        clampedLogs={[]}
        projects={mockProjects}
      />
    );
    const header = screen.getByTestId('stacked-activity-chart-header');
    expect(screen.getByTestId('stacked-chart-empty')).not.toBeNull();

    // Act
    fireEvent.click(header);

    // Assert
    expect(screen.queryByTestId('stacked-chart-empty')).toBeNull();
  });

  it('should render localized XAxis date labels for Polish (pl)', () => {
    // Arrange: 2026-09-10 is Thursday (czw., 10)
    const logs = [
      aClampedTimeLog({
        id: 'cl-pl',
        projectId: 'p1',
        clampedStartTime: '2026-09-10T08:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
    ];

    // Act
    const { container } = render(
      <StackedBarActivityChart
        clampedLogs={logs}
        projects={mockProjects}
        locale="pl"
      />
    );

    // Assert: Formatted exact date appears in the rendered chart ticks/DOM
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes).toContain('czw., 10');
    expect(textNodes).not.toContain('pt., 11');
    expect(textNodes).not.toContain('śr., 9');
    expect(formatChartDate('2026-09-10', 'pl')).toBe('czw., 10');
  });

  it('should render localized XAxis date labels for English (en)', () => {
    // Arrange: 2026-09-10 is Thursday (10 Thu)
    const logs = [
      aClampedTimeLog({
        id: 'cl-en',
        projectId: 'p1',
        clampedStartTime: '2026-09-10T08:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
    ];

    // Act
    const { container } = render(
      <StackedBarActivityChart
        clampedLogs={logs}
        projects={mockProjects}
        locale="en"
      />
    );

    // Assert: Formatted exact date appears in the rendered chart ticks/DOM
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes).toContain('10 Thu');
    expect(textNodes).not.toContain('11 Fri');
    expect(textNodes).not.toContain('9 Wed');
    expect(formatChartDate('2026-09-10', 'en')).toBe('10 Thu');
  });

  it('should render localized XAxis date labels for German (de)', () => {
    // Arrange: 2026-09-10 is Thursday (Do., 10.)
    const logs = [
      aClampedTimeLog({
        id: 'cl-de',
        projectId: 'p1',
        clampedStartTime: '2026-09-10T08:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
    ];

    // Act
    const { container } = render(
      <StackedBarActivityChart
        clampedLogs={logs}
        projects={mockProjects}
        locale="de"
      />
    );

    // Assert: Formatted exact date appears in the rendered chart ticks/DOM
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes).toContain('Do., 10.');
    expect(textNodes).not.toContain('Fr., 11.');
    expect(textNodes).not.toContain('Mi., 9.');
    expect(formatChartDate('2026-09-10', 'de')).toBe('Do., 10.');
  });

  it('should inherit locale from LocaleContext when prop is omitted', () => {
    // Arrange
    const logs = [
      aClampedTimeLog({
        id: 'cl-ctx',
        projectId: 'p1',
        clampedStartTime: '2026-09-10T08:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
    ];

    // Act: Wrap in MockLocaleProvider with 'pl'
    const { container } = render(
      <MockLocaleProvider value={{ locale: 'pl' as Locale } as unknown as React.ContextType<typeof import('@common/hooks/LocaleProvider').LocaleContext>}>
        <StackedBarActivityChart
          clampedLogs={logs}
          projects={mockProjects}
        />
      </MockLocaleProvider>
    );

    // Assert
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes).toContain('czw., 10');
    expect(textNodes).not.toContain('pt., 11');
  });

  it('should correctly group entries across UTC midnight boundaries and timezone offsets', () => {
    // Arrange:
    // log1: 2026-06-15T01:00:00+04:00 is 2026-06-14T21:00:00Z in UTC (Sunday -> niedz., 14 in pl)
    // log2: 2026-06-14T23:00:00-02:00 is 2026-06-15T01:00:00Z in UTC (Monday -> pon., 15 in pl)
    const logs = [
      aClampedTimeLog({
        id: 'cl-shift-prev-day',
        projectId: 'p1',
        clampedStartTime: '2026-06-15T01:00:00+04:00',
        clampedDurationSeconds: 3600,
      }),
      aClampedTimeLog({
        id: 'cl-shift-next-day',
        projectId: 'p2',
        clampedStartTime: '2026-06-14T23:00:00-02:00',
        clampedDurationSeconds: 7200,
      }),
    ];

    // Act
    const { container } = render(
      <StackedBarActivityChart
        clampedLogs={logs}
        projects={mockProjects}
        locale="pl"
      />
    );

    // Assert: Day grouping respects UTC calendar semantics
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes).toContain('niedz., 14');
    expect(textNodes).toContain('pon., 15');
    // Ensure naïve string slicing (which would place log1 on 2026-06-15 and log2 on 2026-06-14) did not occur
    expect(textNodes).not.toContain('pon., 14');
    expect(textNodes).not.toContain('wt., 15');
  });

  it('should handle month and year boundaries in chart datasets', () => {
    // Arrange: Spanning across month and year boundaries
    const logs = [
      aClampedTimeLog({
        id: 'cl-dec31',
        projectId: 'p1',
        clampedStartTime: '2026-12-31T23:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
      aClampedTimeLog({
        id: 'cl-jan01',
        projectId: 'p2',
        clampedStartTime: '2027-01-01T01:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
    ];

    // Act
    render(
      <StackedBarActivityChart
        clampedLogs={logs}
        projects={mockProjects}
        locale="pl"
      />
    );

    // Assert
    expect(screen.getByTestId('stacked-bar-activity-chart')).not.toBeNull();
  });

  it('should ignore entries with invalid clampedStartTime and not include them in chart data', () => {
    // Arrange: One valid entry (p1 on 2026-09-10) and two invalid entries (p2 with 'invalid-date' and '2026-06-15-invalid')
    const logs = [
      aClampedTimeLog({
        id: 'valid-log',
        projectId: 'p1',
        clampedStartTime: '2026-09-10T10:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
      aClampedTimeLog({
        id: 'invalid-log-1',
        projectId: 'p2',
        clampedStartTime: 'invalid-date',
        clampedDurationSeconds: 7200,
      }),
      aClampedTimeLog({
        id: 'invalid-log-2',
        projectId: 'p2',
        clampedStartTime: '2026-06-15-invalid',
        clampedDurationSeconds: 1800,
      }),
    ];

    // Act
    const { container } = render(
      <StackedBarActivityChart
        clampedLogs={logs}
        projects={mockProjects}
        locale="pl"
      />
    );

    // Assert: Chart renders successfully for valid entries
    expect(screen.getByTestId('stacked-bar-activity-chart')).not.toBeNull();
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);

    // Valid date is formatted and present
    expect(textNodes).toContain('czw., 10');

    // Invalid dates and sliced fragments are not in chart labels
    expect(textNodes).not.toContain('invalid-date');
    expect(textNodes).not.toContain('invalid-da');
    expect(textNodes).not.toContain('2026-06-15');

    // Project p2 was only present in invalid logs, so it should not be listed as an active project
    expect(screen.queryByText('Beta Project')).toBeNull();
    expect(screen.getByText('Alpha Project')).not.toBeNull();
  });

  it('should render empty state if all clampedLogs have invalid clampedStartTime', () => {
    // Arrange: Only invalid logs
    const logs = [
      aClampedTimeLog({
        id: 'invalid-1',
        projectId: 'p1',
        clampedStartTime: 'invalid-date',
        clampedDurationSeconds: 3600,
      }),
    ];

    // Act
    render(
      <StackedBarActivityChart
        clampedLogs={logs}
        projects={mockProjects}
        locale="pl"
      />
    );

    // Assert: Renders empty state since no valid dates exist
    expect(screen.getByTestId('stacked-chart-empty')).not.toBeNull();
    expect(screen.queryByTestId('stacked-bar-activity-chart')).toBeNull();
  });
});

describe('Unit Tests: reportDateUtils', () => {
  describe('formatChartDate', () => {
    it('should format dates for pl, en, and de correctly', () => {
      // 2026-09-10 is Thursday
      expect(formatChartDate('2026-09-10', 'pl')).toBe('czw., 10');
      expect(formatChartDate('2026-09-10', 'en')).toBe('10 Thu');
      expect(formatChartDate('2026-09-10', 'de')).toBe('Do., 10.');
    });

    it('should format month boundary correctly (February 28 to March 1)', () => {
      // 2026 is not a leap year: Feb 28 is Saturday, Mar 1 is Sunday
      expect(formatChartDate('2026-02-28', 'pl')).toBe('sob., 28');
      expect(formatChartDate('2026-03-01', 'pl')).toBe('niedz., 1');

      expect(formatChartDate('2026-02-28', 'en')).toBe('28 Sat');
      expect(formatChartDate('2026-03-01', 'en')).toBe('1 Sun');

      expect(formatChartDate('2026-02-28', 'de')).toBe('Sa., 28.');
      expect(formatChartDate('2026-03-01', 'de')).toBe('So., 1.');
    });

    it('should format leap year boundary correctly (February 29 to March 1)', () => {
      // 2024 is a leap year: Feb 29 is Thursday, Mar 1 is Friday
      expect(formatChartDate('2024-02-29', 'pl')).toBe('czw., 29');
      expect(formatChartDate('2024-03-01', 'pl')).toBe('pt., 1');

      expect(formatChartDate('2024-02-29', 'en')).toBe('29 Thu');
      expect(formatChartDate('2024-03-01', 'en')).toBe('1 Fri');

      expect(formatChartDate('2024-02-29', 'de')).toBe('Do., 29.');
      expect(formatChartDate('2024-03-01', 'de')).toBe('Fr., 1.');
    });

    it('should format year boundary correctly (December 31 to January 1)', () => {
      // 2026-12-31 is Thursday, 2027-01-01 is Friday
      expect(formatChartDate('2026-12-31', 'pl')).toBe('czw., 31');
      expect(formatChartDate('2027-01-01', 'pl')).toBe('pt., 1');

      expect(formatChartDate('2026-12-31', 'en')).toBe('31 Thu');
      expect(formatChartDate('2027-01-01', 'en')).toBe('1 Fri');

      expect(formatChartDate('2026-12-31', 'de')).toBe('Do., 31.');
      expect(formatChartDate('2027-01-01', 'de')).toBe('Fr., 1.');
    });

    it('should handle Date objects directly', () => {
      const date = new Date(Date.UTC(2026, 8, 10)); // September 10, 2026
      expect(formatChartDate(date, 'pl')).toBe('czw., 10');
    });

    it('should safely fall back when dateKey is invalid or malformed', () => {
      expect(formatChartDate('invalid-date', 'pl')).toBe('invalid-date');
      expect(formatChartDate('2026-06-15-invalid', 'pl')).toBe('2026-06-15-invalid');
      expect(formatChartDate('', 'en')).toBe('');
      expect(formatChartDate(new Date('invalid'), 'en')).toBe('');
    });

    it('should safely fall back to english when an invalid locale tag is provided', () => {
      expect(formatChartDate('2026-09-10', 'invalid-locale-xyz' as Locale)).toBe('10 Thu');
    });

    it('should safely fall back to raw input when Intl formatting throws a RangeError', () => {
      const formatSpy = vi.spyOn(Intl.DateTimeFormat.prototype as unknown as Record<string, unknown>, 'format', 'get').mockReturnValue(() => {
        throw new RangeError('Invalid time value');
      });

      expect(formatChartDate('2026-06-15', 'pl')).toBe('2026-06-15');

      formatSpy.mockRestore();
    });

    it('should explicitly log via console.error and propagate unexpected non-RangeError exceptions', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const formatSpy = vi.spyOn(Intl.DateTimeFormat.prototype as unknown as Record<string, unknown>, 'format', 'get').mockReturnValue(() => {
        throw new TypeError('Unexpected format failure');
      });

      expect(() => formatChartDate('2026-06-15', 'pl')).toThrow(TypeError);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to format chart date:',
        expect.any(TypeError)
      );

      formatSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('parseUtcCalendarDate', () => {
    it('should parse YYYY-MM-DD into exact UTC midnight', () => {
      const parsed = parseUtcCalendarDate('2026-06-15');
      expect(parsed).not.toBeNull();
      expect(parsed?.getUTCFullYear()).toBe(2026);
      expect(parsed?.getUTCMonth()).toBe(5); // June (0-indexed)
      expect(parsed?.getUTCDate()).toBe(15);
      expect(parsed?.getUTCHours()).toBe(0);
      expect(parsed?.getUTCMinutes()).toBe(0);
      expect(parsed?.getUTCSeconds()).toBe(0);
    });

    it('should parse ISO timestamp strings anchored to UTC calendar date', () => {
      const startOfDay = parseUtcCalendarDate('2026-06-15T00:00:00.000Z');
      const endOfDay = parseUtcCalendarDate('2026-06-15T23:59:59.999Z');

      expect(startOfDay?.getUTCDate()).toBe(15);
      expect(endOfDay?.getUTCDate()).toBe(15);
      expect(startOfDay?.getTime()).toBe(endOfDay?.getTime());
    });

    it('should correctly account for timezone offsets shifting dates across midnight', () => {
      // 2026-06-15T01:00:00+04:00 is 2026-06-14T21:00:00Z in UTC
      const shiftedBack = parseUtcCalendarDate('2026-06-15T01:00:00+04:00');
      expect(shiftedBack?.getUTCFullYear()).toBe(2026);
      expect(shiftedBack?.getUTCMonth()).toBe(5);
      expect(shiftedBack?.getUTCDate()).toBe(14);

      // 2026-06-14T23:00:00-02:00 is 2026-06-15T01:00:00Z in UTC
      const shiftedForward = parseUtcCalendarDate('2026-06-14T23:00:00-02:00');
      expect(shiftedForward?.getUTCFullYear()).toBe(2026);
      expect(shiftedForward?.getUTCMonth()).toBe(5);
      expect(shiftedForward?.getUTCDate()).toBe(15);
    });

    it('should strictly reject malformed strings with trailing garbage', () => {
      expect(parseUtcCalendarDate('2026-06-15-invalid')).toBeNull();
      expect(parseUtcCalendarDate('2026-06-15extra')).toBeNull();
      expect(parseUtcCalendarDate('2026-06-15T10:00:00Z-extra')).toBeNull();
      expect(parseUtcCalendarDate('2026-06-15T10:00:00Zgarbage')).toBeNull();
    });

    it('should return null for impossible calendar dates and leap years', () => {
      expect(parseUtcCalendarDate('2026-02-31')).toBeNull(); // Non-existent date
      expect(parseUtcCalendarDate('2026-02-29')).toBeNull(); // 2026 is not a leap year
      expect(parseUtcCalendarDate('2026-04-31')).toBeNull(); // April only has 30 days
      expect(parseUtcCalendarDate('2026-13-01')).toBeNull(); // Month 13 is invalid
      expect(parseUtcCalendarDate('2026-00-15')).toBeNull(); // Month 0 is invalid
      expect(parseUtcCalendarDate('2026-06-00')).toBeNull(); // Day 0 is invalid
      expect(parseUtcCalendarDate('not-a-date')).toBeNull();
      expect(parseUtcCalendarDate(12345 as unknown as string)).toBeNull();
    });

    it('should accept valid leap year calendar date (February 29)', () => {
      const leapDay = parseUtcCalendarDate('2024-02-29');
      expect(leapDay).not.toBeNull();
      expect(leapDay?.getUTCFullYear()).toBe(2024);
      expect(leapDay?.getUTCMonth()).toBe(1); // February (0-indexed)
      expect(leapDay?.getUTCDate()).toBe(29);
    });

    it('should return null for impossible time components in ISO strings', () => {
      expect(parseUtcCalendarDate('2026-06-15T25:00:00Z')).toBeNull();
      expect(parseUtcCalendarDate('2026-06-15T12:60:00Z')).toBeNull();
      expect(parseUtcCalendarDate('2026-06-15T12:00:60Z')).toBeNull();
      expect(parseUtcCalendarDate('2026-02-31T12:00:00Z')).toBeNull();
    });
  });

  describe('getUtcDateKey', () => {
    it('should extract YYYY-MM-DD from valid date inputs', () => {
      expect(getUtcDateKey('2026-06-15')).toBe('2026-06-15');
      expect(getUtcDateKey('2026-06-15T00:00:00.000Z')).toBe('2026-06-15');
      expect(getUtcDateKey('2026-06-15T23:59:59.999Z')).toBe('2026-06-15');
    });

    it('should account for timezone offset shifts in date key extraction', () => {
      // 2026-06-15T01:00:00+04:00 is 2026-06-14 in UTC
      expect(getUtcDateKey('2026-06-15T01:00:00+04:00')).toBe('2026-06-14');
      // 2026-06-14T23:00:00-02:00 is 2026-06-15 in UTC
      expect(getUtcDateKey('2026-06-14T23:00:00-02:00')).toBe('2026-06-15');
    });

    it('should extract date key directly from Date object', () => {
      const date = new Date(Date.UTC(2026, 8, 10, 15, 30));
      expect(getUtcDateKey(date)).toBe('2026-09-10');
    });

    it('should return null for malformed or invalid inputs', () => {
      expect(getUtcDateKey('2026-06-15-invalid')).toBeNull();
      expect(getUtcDateKey('invalid-key')).toBeNull();
      expect(getUtcDateKey('')).toBeNull();
      expect(getUtcDateKey(new Date('invalid'))).toBeNull();
    });
  });

  describe('resolveDateTimeLocale and getChartDateFormatter', () => {
    it('should normalize system and custom locales', () => {
      expect(resolveDateTimeLocale('pl')).toBe('pl');
      expect(resolveDateTimeLocale('custom')).toBe('en');
      expect(resolveDateTimeLocale('system')).toBeDefined();
      expect(resolveDateTimeLocale(undefined)).toBeDefined();
    });

    it('should safely fall back to en for invalid or malformed locales without throwing RangeError', () => {
      expect(resolveDateTimeLocale('invalid-locale-xyz')).toBe('en');
      expect(resolveDateTimeLocale('not_a_valid_bcp47!')).toBe('en');
      expect(resolveDateTimeLocale('   ')).toBe('en');
      expect(resolveDateTimeLocale('')).toBeDefined();
    });

    it('should return valid formatter for invalid locale without throwing RangeError', () => {
      expect(() => getChartDateFormatter('invalid-locale-xyz')).not.toThrow();
      const formatter = getChartDateFormatter('invalid-locale-xyz');
      expect(formatter).toBeDefined();
      const date = new Date(Date.UTC(2026, 8, 10));
      expect(formatter.format(date)).toBe('10 Thu');
    });

    it('should cache Intl.DateTimeFormat instances for identical locales', () => {
      const formatter1 = getChartDateFormatter('pl');
      const formatter2 = getChartDateFormatter('pl');
      expect(formatter1).toBe(formatter2);
    });
  });
});
