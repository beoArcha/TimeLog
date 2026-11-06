// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import ReportPeriodPrintHeader from '@features/reports/components/ReportPeriodPrintHeader';
import { formatCalendarDate, formatCustomDateRange } from '@features/reports/utils/reportDateUtils';

describe('Unit Tests: ReportPeriodPrintHeader & Date Formatting Helpers', () => {
  afterEach(() => {
    cleanup();
  });

  describe('formatCalendarDate', () => {
    it('formats UTC ISO date string into locale calendar format', () => {
      const enDate = formatCalendarDate('2026-06-15T12:00:00Z', 'en');
      expect(enDate).toBe('06/15/2026');

      const plDate = formatCalendarDate('2026-06-15T12:00:00Z', 'pl');
      expect(plDate).toBe('15.06.2026');
    });

    it('returns empty string for invalid dates', () => {
      expect(formatCalendarDate('invalid-date', 'en')).toBe('');
      expect(formatCalendarDate('', 'en')).toBe('');
    });

    it('formats ancient UTC dates (years 0001-0099) safely without 1900s century jumping', () => {
      const ancient = formatCalendarDate('0042-05-10T00:00:00Z', 'en');
      expect(ancient).toContain('42');
      expect(ancient).not.toContain('1942');
    });
  });

  describe('formatCustomDateRange', () => {
    it('formats a complete date range with localized dash', () => {
      const result = formatCustomDateRange('2026-06-01', '2026-06-30', 'en');
      expect(result.fromStr).toBe('06/01/2026');
      expect(result.toStr).toBe('06/30/2026');
      expect(result.label).toBe('06/01/2026 — 06/30/2026');
    });

    it('formats open-ended start range (from only)', () => {
      const result = formatCustomDateRange('2026-06-01', undefined, 'en');
      expect(result.fromStr).toBe('06/01/2026');
      expect(result.toStr).toBeNull();
      expect(result.label).toBe('≥ 06/01/2026');
    });

    it('formats open-ended end range (to only)', () => {
      const result = formatCustomDateRange(undefined, '2026-06-30', 'en');
      expect(result.fromStr).toBeNull();
      expect(result.toStr).toBe('06/30/2026');
      expect(result.label).toBe('≤ 06/30/2026');
    });

    it('returns nulls when neither from nor to is valid', () => {
      const result = formatCustomDateRange('invalid', 'garbage', 'en');
      expect(result.fromStr).toBeNull();
      expect(result.toStr).toBeNull();
      expect(result.label).toBeNull();
    });
  });

  describe('ReportPeriodPrintHeader component', () => {
    it('has hidden print:flex visibility classes so it is print-only', () => {
      render(<ReportPeriodPrintHeader reportPeriod="today" />);
      const header = screen.getByTestId('report-print-period-header');
      expect(header).not.toBeNull();
      expect(header.className).toContain('hidden');
      expect(header.className).toContain('print:flex');
    });

    it('renders translated presets correctly', () => {
      const { rerender } = render(<ReportPeriodPrintHeader reportPeriod="today" />);
      expect(screen.getByText('Today')).not.toBeNull();

      rerender(<ReportPeriodPrintHeader reportPeriod="yesterday" />);
      expect(screen.getByText('Yesterday')).not.toBeNull();

      rerender(<ReportPeriodPrintHeader reportPeriod="week" />);
      expect(screen.getByText('Week')).not.toBeNull();

      rerender(<ReportPeriodPrintHeader reportPeriod="lastWeek" />);
      expect(screen.getByText('Last Week')).not.toBeNull();

      rerender(<ReportPeriodPrintHeader reportPeriod="month" />);
      expect(screen.getByText('Month')).not.toBeNull();

      rerender(<ReportPeriodPrintHeader reportPeriod="lastMonth" />);
      expect(screen.getByText('Last Month')).not.toBeNull();

      rerender(<ReportPeriodPrintHeader reportPeriod="last30Days" />);
      expect(screen.getByText('Last 30 Days')).not.toBeNull();

      rerender(<ReportPeriodPrintHeader reportPeriod="year" />);
      expect(screen.getByText('This Year')).not.toBeNull();

      rerender(<ReportPeriodPrintHeader reportPeriod="all" />);
      expect(screen.getByText('All')).not.toBeNull();
    });

    it('renders custom date range when reportPeriod is custom with from and to', () => {
      render(
        <ReportPeriodPrintHeader
          reportPeriod="custom"
          customFrom="2026-06-01"
          customTo="2026-06-15"
        />
      );
      expect(screen.getByText(/Custom: 06\/01\/2026 — 06\/15\/2026/i)).not.toBeNull();
    });

    it('renders custom range gracefully when dates are missing or invalid', () => {
      render(
        <ReportPeriodPrintHeader
          reportPeriod="custom"
          customFrom="invalid-from"
          customTo="invalid-to"
        />
      );
      expect(screen.getByText('Custom')).not.toBeNull();
    });
  });
});
