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
  detectDateSpan,
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

  it('should disambiguate dates with month labels when date range spans multiple months in pl', () => {
    // Arrange: 2026-09-10 (Thursday) and 2026-10-10 (Saturday)
    const logs = [
      aClampedTimeLog({
        id: 'cl-sep10',
        projectId: 'p1',
        clampedStartTime: '2026-09-10T08:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
      aClampedTimeLog({
        id: 'cl-oct10',
        projectId: 'p2',
        clampedStartTime: '2026-10-10T08:00:00.000Z',
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

    // Assert: Formatted labels include abbreviated month to prevent identical '10' collision
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes).toContain('czw., 10 wrz');
    expect(textNodes).toContain('sob., 10 paź');
    expect(textNodes).not.toContain('czw., 10');
    expect(textNodes).not.toContain('sob., 10');
  });

  it('should disambiguate dates with month labels when date range spans multiple months in en', () => {
    // Arrange: 2026-09-10 (Thursday) and 2026-10-10 (Saturday)
    const logs = [
      aClampedTimeLog({
        id: 'cl-sep10-en',
        projectId: 'p1',
        clampedStartTime: '2026-09-10T08:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
      aClampedTimeLog({
        id: 'cl-oct10-en',
        projectId: 'p2',
        clampedStartTime: '2026-10-10T08:00:00.000Z',
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

    // Assert: English format includes month (Thu, Sep 10 and Sat, Oct 10)
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes).toContain('Thu, Sep 10');
    expect(textNodes).toContain('Sat, Oct 10');
    expect(textNodes).not.toContain('10 Thu');
    expect(textNodes).not.toContain('10 Sat');
  });

  it('should disambiguate dates with month labels when date range spans multiple months in de', () => {
    // Arrange: 2026-09-10 (Thursday) and 2026-10-10 (Saturday)
    const logs = [
      aClampedTimeLog({
        id: 'cl-sep10-de',
        projectId: 'p1',
        clampedStartTime: '2026-09-10T08:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
      aClampedTimeLog({
        id: 'cl-oct10-de',
        projectId: 'p2',
        clampedStartTime: '2026-10-10T08:00:00.000Z',
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

    // Assert: German format includes month (Do., 10. Sept. and Sa., 10. Okt.)
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes).toContain('Do., 10. Sept.');
    expect(textNodes).toContain('Sa., 10. Okt.');
    expect(textNodes).not.toContain('Do., 10.');
    expect(textNodes).not.toContain('Sa., 10.');
  });

  it('should disambiguate dates with month and year across multi-year transitions in pl', () => {
    // Arrange: Spanning across month and year boundaries (2026-12-31 and 2027-01-01)
    const logs = [
      aClampedTimeLog({
        id: 'cl-dec31-pl',
        projectId: 'p1',
        clampedStartTime: '2026-12-31T23:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
      aClampedTimeLog({
        id: 'cl-jan01-pl',
        projectId: 'p2',
        clampedStartTime: '2027-01-01T01:00:00.000Z',
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

    // Assert: Labels contain weekday, day, month, and 4-digit year in Polish
    expect(screen.getByTestId('stacked-bar-activity-chart')).not.toBeNull();
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes).toContain('czw., 31 gru 2026');
    expect(textNodes).toContain('pt., 1 sty 2027');
  });

  it('should disambiguate dates with month and year across multi-year transitions in en', () => {
    // Arrange: 2026-12-31 and 2027-01-01 in en
    const logs = [
      aClampedTimeLog({
        id: 'cl-dec31-en',
        projectId: 'p1',
        clampedStartTime: '2026-12-31T23:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
      aClampedTimeLog({
        id: 'cl-jan01-en',
        projectId: 'p2',
        clampedStartTime: '2027-01-01T01:00:00.000Z',
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

    // Assert: English format includes month and year
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes).toContain('Thu, Dec 31, 2026');
    expect(textNodes).toContain('Fri, Jan 1, 2027');
  });

  it('should disambiguate dates with month and year across multi-year transitions in de', () => {
    // Arrange: 2026-12-31 and 2027-01-01 in de
    const logs = [
      aClampedTimeLog({
        id: 'cl-dec31-de',
        projectId: 'p1',
        clampedStartTime: '2026-12-31T23:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
      aClampedTimeLog({
        id: 'cl-jan01-de',
        projectId: 'p2',
        clampedStartTime: '2027-01-01T01:00:00.000Z',
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

    // Assert: German format includes month and year
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes).toContain('Do., 31. Dez. 2026');
    expect(textNodes).toContain('Fr., 1. Jan. 2027');
  });

  it('should keep compact labels without month or year when range is within a single month', () => {
    // Arrange: 2026-09-10 and 2026-09-11 (both in September 2026)
    const logs = [
      aClampedTimeLog({
        id: 'cl-sep10-single',
        projectId: 'p1',
        clampedStartTime: '2026-09-10T08:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
      aClampedTimeLog({
        id: 'cl-sep11-single',
        projectId: 'p2',
        clampedStartTime: '2026-09-11T08:00:00.000Z',
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

    // Assert: Compact format (no month name, no year)
    const textNodes = Array.from(container.querySelectorAll('text')).map((n) => n.textContent);
    expect(textNodes).toContain('czw., 10');
    expect(textNodes).toContain('pt., 11');
    expect(textNodes).not.toContain('wrz');
    expect(textNodes).not.toContain('2026');
  });

  it('should ignore entries with invalid clampedStartTime and not include them in chart data', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

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

    // Verify console.warn was called with log id and invalid clampedStartTime
    expect(warnSpy).toHaveBeenCalledWith(
      '[StackedBarActivityChart] Skipping log invalid-log-1 due to invalid clampedStartTime: "invalid-date"'
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[StackedBarActivityChart] Skipping log invalid-log-2 due to invalid clampedStartTime: "2026-06-15-invalid"'
    );
    expect(warnSpy).toHaveBeenCalledTimes(2);

    warnSpy.mockRestore();
  });

  it('should render empty state if all clampedLogs have invalid clampedStartTime', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

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

    expect(warnSpy).toHaveBeenCalledWith(
      '[StackedBarActivityChart] Skipping log invalid-1 due to invalid clampedStartTime: "invalid-date"'
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });
});

describe('Unit Tests: reportDateUtils', () => {
  describe('detectDateSpan', () => {
    it('should return false for hasMultipleMonths and hasMultipleYears when dates array is empty or has single entry', () => {
      expect(detectDateSpan([])).toEqual({
        hasMultipleMonths: false,
        hasMultipleYears: false,
      });

      expect(detectDateSpan(['2026-09-10'])).toEqual({
        hasMultipleMonths: false,
        hasMultipleYears: false,
      });

      expect(detectDateSpan([new Date(Date.UTC(2026, 8, 10))])).toEqual({
        hasMultipleMonths: false,
        hasMultipleYears: false,
      });
    });

    it('should return false for hasMultipleMonths and hasMultipleYears when all dates are within the same month and year', () => {
      expect(detectDateSpan(['2026-09-01', '2026-09-10', '2026-09-30'])).toEqual({
        hasMultipleMonths: false,
        hasMultipleYears: false,
      });
    });

    it('should detect multiple months within the same year', () => {
      expect(detectDateSpan(['2026-09-10', '2026-10-10'])).toEqual({
        hasMultipleMonths: true,
        hasMultipleYears: false,
      });
    });

    it('should detect multiple years across year boundaries and imply multiple months', () => {
      expect(detectDateSpan(['2026-12-31', '2027-01-01'])).toEqual({
        hasMultipleMonths: true,
        hasMultipleYears: true,
      });
    });

    it('should detect multiple years even if month index is identical (e.g. May 2026 to May 2027)', () => {
      expect(detectDateSpan(['2026-05-10', '2027-05-10'])).toEqual({
        hasMultipleMonths: true,
        hasMultipleYears: true,
      });
    });

    it('should safely ignore invalid dates', () => {
      expect(detectDateSpan(['invalid-date', '2026-09-10', '2026-09-15'])).toEqual({
        hasMultipleMonths: false,
        hasMultipleYears: false,
      });

      expect(detectDateSpan(['invalid-1', 'invalid-2'])).toEqual({
        hasMultipleMonths: false,
        hasMultipleYears: false,
      });
    });
  });

  describe('formatChartDate', () => {
    it('should format dates for pl, en, and de correctly with default options (compact)', () => {
      // 2026-09-10 is Thursday
      expect(formatChartDate('2026-09-10', 'pl')).toBe('czw., 10');
      expect(formatChartDate('2026-09-10', 'en')).toBe('10 Thu');
      expect(formatChartDate('2026-09-10', 'de')).toBe('Do., 10.');
    });

    it('should format dates with includeMonth option for pl, en, and de', () => {
      // 2026-09-10: Thursday, Sep 10
      expect(formatChartDate('2026-09-10', 'pl', { includeMonth: true })).toBe('czw., 10 wrz');
      expect(formatChartDate('2026-09-10', 'en', { includeMonth: true })).toBe('Thu, Sep 10');
      expect(formatChartDate('2026-09-10', 'de', { includeMonth: true })).toBe('Do., 10. Sept.');

      // 2026-10-10: Saturday, Oct 10
      expect(formatChartDate('2026-10-10', 'pl', { includeMonth: true })).toBe('sob., 10 paź');
      expect(formatChartDate('2026-10-10', 'en', { includeMonth: true })).toBe('Sat, Oct 10');
      expect(formatChartDate('2026-10-10', 'de', { includeMonth: true })).toBe('Sa., 10. Okt.');
    });

    it('should format dates with includeYear option (4-digit numeric default) for pl, en, and de', () => {
      // 2026-12-31 and 2027-01-01
      expect(formatChartDate('2026-12-31', 'pl', { includeYear: true })).toBe('czw., 31 gru 2026');
      expect(formatChartDate('2027-01-01', 'pl', { includeYear: true })).toBe('pt., 1 sty 2027');

      expect(formatChartDate('2026-12-31', 'en', { includeYear: true })).toBe('Thu, Dec 31, 2026');
      expect(formatChartDate('2027-01-01', 'en', { includeYear: true })).toBe('Fri, Jan 1, 2027');

      expect(formatChartDate('2026-12-31', 'de', { includeYear: true })).toBe('Do., 31. Dez. 2026');
      expect(formatChartDate('2027-01-01', 'de', { includeYear: true })).toBe('Fr., 1. Jan. 2027');
    });

    it('should format dates with yearFormat 2-digit for pl, en, and de', () => {
      expect(formatChartDate('2026-12-31', 'pl', { includeYear: true, yearFormat: '2-digit' })).toBe('czw., 31 gru 26');
      expect(formatChartDate('2027-01-01', 'pl', { includeYear: true, yearFormat: '2-digit' })).toBe('pt., 1 sty 27');

      expect(formatChartDate('2026-12-31', 'en', { includeYear: true, yearFormat: '2-digit' })).toBe('Thu, Dec 31, 26');
      expect(formatChartDate('2027-01-01', 'en', { includeYear: true, yearFormat: '2-digit' })).toBe('Fri, Jan 1, 27');

      expect(formatChartDate('2026-12-31', 'de', { includeYear: true, yearFormat: '2-digit' })).toBe('Do., 31. Dez. 26');
      expect(formatChartDate('2027-01-01', 'de', { includeYear: true, yearFormat: '2-digit' })).toBe('Fr., 1. Jan. 27');
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

    it('should preserve actual calendar years 0001-0099 without mapping to 1900-1999', () => {
      const parsed42 = parseUtcCalendarDate('0042-05-10');
      expect(parsed42).not.toBeNull();
      expect(parsed42?.getUTCFullYear()).toBe(42);
      expect(parsed42?.getUTCMonth()).toBe(4);
      expect(parsed42?.getUTCDate()).toBe(10);

      const parsed99 = parseUtcCalendarDate('0099-12-31');
      expect(parsed99).not.toBeNull();
      expect(parsed99?.getUTCFullYear()).toBe(99);
      expect(parsed99?.getUTCMonth()).toBe(11);
      expect(parsed99?.getUTCDate()).toBe(31);

      const parsed1 = parseUtcCalendarDate('0001-01-01');
      expect(parsed1).not.toBeNull();
      expect(parsed1?.getUTCFullYear()).toBe(1);
      expect(parsed1?.getUTCMonth()).toBe(0);
      expect(parsed1?.getUTCDate()).toBe(1);

      const parsedIso42 = parseUtcCalendarDate('0042-05-10T14:30:00.000Z');
      expect(parsedIso42).not.toBeNull();
      expect(parsedIso42?.getUTCFullYear()).toBe(42);
      expect(parsedIso42?.getUTCMonth()).toBe(4);
      expect(parsedIso42?.getUTCDate()).toBe(10);

      const dateObj = new Date(Date.UTC(42, 4, 10));
      dateObj.setUTCFullYear(42);
      const parsedDateObj = parseUtcCalendarDate(dateObj);
      expect(parsedDateObj).not.toBeNull();
      expect(parsedDateObj?.getUTCFullYear()).toBe(42);
      expect(parsedDateObj?.getUTCMonth()).toBe(4);
      expect(parsedDateObj?.getUTCDate()).toBe(10);

      // Validate leap year handling in 0001-0099
      expect(parseUtcCalendarDate('0099-02-29')).toBeNull(); // 99 is not leap
      const leap96 = parseUtcCalendarDate('0096-02-29'); // 96 is leap
      expect(leap96).not.toBeNull();
      expect(leap96?.getUTCFullYear()).toBe(96);
      expect(leap96?.getUTCMonth()).toBe(1);
      expect(leap96?.getUTCDate()).toBe(29);
    });
  });

  describe('getUtcDateKey', () => {
    it('should extract YYYY-MM-DD from valid date inputs', () => {
      expect(getUtcDateKey('2026-06-15')).toBe('2026-06-15');
      expect(getUtcDateKey('2026-06-15T00:00:00.000Z')).toBe('2026-06-15');
      expect(getUtcDateKey('2026-06-15T23:59:59.999Z')).toBe('2026-06-15');
    });

    it('should preserve 4-digit year representation for years 0001 to 0099', () => {
      expect(getUtcDateKey('0042-05-10')).toBe('0042-05-10');
      expect(getUtcDateKey('0099-12-31')).toBe('0099-12-31');
      expect(getUtcDateKey('0001-01-01')).toBe('0001-01-01');
      expect(getUtcDateKey('0042-05-10T12:00:00Z')).toBe('0042-05-10');
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

    it('should cache Intl.DateTimeFormat instances for identical locales and identical options', () => {
      const formatter1 = getChartDateFormatter('pl');
      const formatter2 = getChartDateFormatter('pl');
      expect(formatter1).toBe(formatter2);

      const formatterMonth1 = getChartDateFormatter('pl', { includeMonth: true });
      const formatterMonth2 = getChartDateFormatter('pl', { includeMonth: true });
      expect(formatterMonth1).toBe(formatterMonth2);
    });

    it('should create and cache distinct formatters when formatting options differ', () => {
      const compactFormatter = getChartDateFormatter('pl');
      const monthFormatter = getChartDateFormatter('pl', { includeMonth: true });
      const yearFormatter = getChartDateFormatter('pl', { includeYear: true });
      const twoDigitYearFormatter = getChartDateFormatter('pl', { includeYear: true, yearFormat: '2-digit' });

      expect(compactFormatter).not.toBe(monthFormatter);
      expect(compactFormatter).not.toBe(yearFormatter);
      expect(monthFormatter).not.toBe(yearFormatter);
      expect(yearFormatter).not.toBe(twoDigitYearFormatter);
    });
  });
});
