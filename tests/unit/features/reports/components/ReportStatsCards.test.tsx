import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import ReportStatsCards from '@features/reports/components/ReportStatsCards';

describe('Unit Tests: ReportStatsCards', () => {
  const mockProps = {
    todaySec: 3600, // 01:00:00
    weekSec: 7200,  // 02:00:00
    monthSec: 10800, // 03:00:00
    theme: 'dark',
    locale: 'en' as const,
    customTranslations: {},
  };

  afterEach(() => {
    cleanup();
  });

  it('should render correct statistics metrics cards', () => {
    render(<ReportStatsCards {...mockProps} />);
    expect(screen.getByText(/01:00:00/i)).not.toBeNull();
    expect(screen.getByText(/02:00:00/i)).not.toBeNull();
    expect(screen.getByText(/03:00:00/i)).not.toBeNull();
  });

  it('should render active period cards when periodTotalSec, dailyAverageSec, and topProject are provided', () => {
    // Arrange
    const props = {
      ...mockProps,
      periodTotalSec: 14400, // 04:00:00
      dailyAverageSec: 3600, // 01:00:00
      topProject: {
        id: 'p1',
        name: 'Alpha Project',
        color: 'violet',
        seconds: 14400,
        percentage: 100,
      },
    };

    // Act
    render(<ReportStatsCards {...props} />);

    // Assert
    expect(screen.getByTestId('report-stat-total')).not.toBeNull();
    expect(screen.getByTestId('report-stat-avg')).not.toBeNull();
    expect(screen.getByTestId('report-stat-top')).not.toBeNull();
    expect(screen.getByTestId('report-stat-total').textContent).toContain('04:00:00');
    expect(screen.getByTestId('report-stat-top').textContent).toContain('Alpha Project');
  });

  it('should toggle content visibility when header is clicked', () => {
    // Arrange
    const { container } = render(<ReportStatsCards {...mockProps} />);
    const header = screen.getByTestId('report-stats-collapsible-header');
    expect(container.querySelector('[data-slot="collapsible-card"]')).not.toBeNull();
    expect(screen.getByTestId('report-stat-today')).not.toBeNull();

    // Act
    fireEvent.click(header);

    // Assert
    expect(screen.queryByTestId('report-stat-today')).toBeNull();
  });
});
