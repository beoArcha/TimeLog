// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportPeriodSelector from '@features/reports/components/ReportPeriodSelector';
import { MockProviders } from '@tests/shared/mocks/MockProviders';

describe('Unit Tests: ReportPeriodSelector', () => {
  const setReportPeriodMock = vi.fn();
  const setReportSortMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render period selection buttons and sort select dropdown', () => {
    render(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="today"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
        />
      </MockProviders>
    );

    expect(screen.getByTestId('period-btn-today')).not.toBeNull();
    expect(screen.getByTestId('period-btn-week')).not.toBeNull();
    expect(screen.getByTestId('period-btn-month')).not.toBeNull();
    expect(screen.getByTestId('period-btn-all')).not.toBeNull();
    expect(screen.getByTestId('report-sort-select')).not.toBeNull();
  });

  it('should indicate active period with aria-pressed attribute', () => {
    const { rerender } = render(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="today"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
        />
      </MockProviders>
    );

    expect(screen.getByTestId('period-btn-today').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('period-btn-week').getAttribute('aria-pressed')).toBe('false');

    rerender(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="month"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
        />
      </MockProviders>
    );

    expect(screen.getByTestId('period-btn-today').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('period-btn-month').getAttribute('aria-pressed')).toBe('true');
  });

  it('should trigger setReportPeriod when each period button is clicked', () => {
    const { rerender } = render(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="today"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('period-btn-week'));
    expect(setReportPeriodMock).toHaveBeenCalledWith('week');
    rerender(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="week"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('period-btn-month'));
    expect(setReportPeriodMock).toHaveBeenCalledWith('month');
    rerender(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="month"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('period-btn-all'));
    expect(setReportPeriodMock).toHaveBeenCalledWith('all');
    rerender(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="all"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
        />
      </MockProviders>
    );

    rerender(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="all"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('period-btn-today'));
    expect(setReportPeriodMock).toHaveBeenCalledWith('today');
  });

  it('should trigger setReportSort when sort selection changes', () => {
    render(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="today"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
        />
      </MockProviders>
    );

    const select = screen.getByTestId('report-sort-select');

    fireEvent.change(select, { target: { value: 'date' } });
    expect(setReportSortMock).toHaveBeenCalledWith('date');

    fireEvent.change(select, { target: { value: 'duration' } });
    expect(setReportSortMock).toHaveBeenCalledWith('duration');
  });

  it('should ignore empty value in sort select change', () => {
    render(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="today"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
        />
      </MockProviders>
    );

    const select = screen.getByTestId('report-sort-select');

    fireEvent.change(select, { target: { value: '' } });
    expect(setReportSortMock).not.toHaveBeenCalled();
  });

  it('should render custom date inputs and trigger callbacks when reportPeriod is custom', () => {
    // Arrange
    const setCustomFromMock = vi.fn();
    const setCustomToMock = vi.fn();

    render(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="custom"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
          customFrom="2026-06-01"
          setCustomFrom={setCustomFromMock}
          customTo="2026-06-15"
          setCustomTo={setCustomToMock}
        />
      </MockProviders>
    );

    // Assert
    expect(screen.getByTestId('custom-date-range-panel')).not.toBeNull();
    const fromInput = screen.getByTestId('custom-from-input');
    const toInput = screen.getByTestId('custom-to-input');

    // Act
    fireEvent.change(fromInput, { target: { value: '2026-06-05' } });
    fireEvent.change(toInput, { target: { value: '2026-06-20' } });

    // Assert
    expect(setCustomFromMock).toHaveBeenCalledWith('2026-06-05');
    expect(setCustomToMock).toHaveBeenCalledWith('2026-06-20');
  });

  it('should render tag filter chips and call onToggleTag when clicked', () => {
    const onToggleTagMock = vi.fn();
    const onClearTagsMock = vi.fn();

    render(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="today"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
          availableTags={['dev', 'client', 'internal']}
          selectedTags={['dev']}
          onToggleTag={onToggleTagMock}
          onClearTags={onClearTagsMock}
        />
      </MockProviders>
    );

    expect(screen.getByTestId('report-tag-filter-container')).not.toBeNull();
    const devChip = screen.getByTestId('tag-chip-dev');
    const clientChip = screen.getByTestId('tag-chip-client');

    expect(devChip.getAttribute('aria-pressed')).toBe('true');
    expect(clientChip.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(clientChip);
    expect(onToggleTagMock).toHaveBeenCalledWith('client');

    const clearButton = screen.getByTestId('clear-tags-button');
    fireEvent.click(clearButton);
    expect(onClearTagsMock).toHaveBeenCalled();
  });

  it('should not render tag filter container when availableTags is empty', () => {
    render(
      <MockProviders>
        <ReportPeriodSelector
          reportPeriod="today"
          setReportPeriod={setReportPeriodMock}
          reportSort="duration"
          setReportSort={setReportSortMock}
          availableTags={[]}
          selectedTags={[]}
        />
      </MockProviders>
    );

    expect(screen.queryByTestId('report-tag-filter-container')).toBeNull();
  });
});
