// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import StackedBarActivityChart from '@features/reports/components/StackedBarActivityChart';
import {
  formatChartDate,
  parseUtcCalendarDate,
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

    // Assert: Formatted date appears in the rendered chart ticks/DOM
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes.some((txt) => txt?.includes('czw.') || txt?.includes('10'))).toBe(true);
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

    // Assert
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes.some((txt) => txt?.includes('Thu') || txt?.includes('10'))).toBe(true);
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

    // Assert
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes.some((txt) => txt?.includes('Do.') || txt?.includes('10.'))).toBe(true);
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
    expect(textNodes.some((txt) => txt?.includes('czw.') || txt?.includes('10'))).toBe(true);
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
      expect(formatChartDate('', 'en')).toBe('');
      expect(formatChartDate(new Date('invalid'), 'en')).toBe('');
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

    it('should return null for invalid calendar dates', () => {
      expect(parseUtcCalendarDate('2026-02-31')).toBeNull(); // Non-existent date
      expect(parseUtcCalendarDate('not-a-date')).toBeNull();
      expect(parseUtcCalendarDate(12345 as unknown as string)).toBeNull();
    });
  });

  describe('resolveDateTimeLocale and getChartDateFormatter', () => {
    it('should normalize system and custom locales', () => {
      expect(resolveDateTimeLocale('pl')).toBe('pl');
      expect(resolveDateTimeLocale('custom')).toBe('en');
      expect(resolveDateTimeLocale('system')).toBeDefined();
      expect(resolveDateTimeLocale(undefined)).toBeDefined();
    });

    it('should cache Intl.DateTimeFormat instances for identical locales', () => {
      const formatter1 = getChartDateFormatter('pl');
      const formatter2 = getChartDateFormatter('pl');
      expect(formatter1).toBe(formatter2);
    });
  });
});
