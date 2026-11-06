import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import ReportStatsCards from '@features/reports/components/ReportStatsCards';
import { RangeBillingResult } from '@common/engine/billing/types';

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
    expect(screen.getByTestId('report-stat-financial')).not.toBeNull();
  });

  it('should render single currency financial KPI card when billingResult has one currency', () => {
    // Arrange
    const singleCurrencyBilling: RangeBillingResult = {
      byCurrency: {
        PLN: {
          currency: 'PLN',
          totalAmount: '3 450.00',
          billableDurationSeconds: 14400,
          nonBillableDurationSeconds: 0,
          unconfiguredDurationSeconds: 0,
        },
      },
      byTask: [],
      totalBillableSeconds: 14400,
      totalNonBillableSeconds: 0,
      totalUnconfiguredSeconds: 0,
    };

    const props = {
      ...mockProps,
      periodTotalSec: 14400,
      dailyAverageSec: 3600,
      billingResult: singleCurrencyBilling,
    };

    // Act
    render(<ReportStatsCards {...props} />);

    // Assert
    const financialCard = screen.getByTestId('report-stat-financial');
    expect(financialCard).not.toBeNull();
    expect(financialCard.textContent).toContain('3 450.00 PLN');
    expect(financialCard.textContent).toContain('04:00:00');
    expect(screen.getByTestId('report-stat-financial-PLN')).not.toBeNull();
  });

  it('should strictly separate currencies into distinct stat cards without merging amounts', () => {
    // Arrange
    const multiCurrencyBilling: RangeBillingResult = {
      byCurrency: {
        PLN: {
          currency: 'PLN',
          totalAmount: '3 450.00',
          billableDurationSeconds: 14400,
          nonBillableDurationSeconds: 0,
          unconfiguredDurationSeconds: 0,
        },
        EUR: {
          currency: 'EUR',
          totalAmount: '1 200.00',
          billableDurationSeconds: 7200,
          nonBillableDurationSeconds: 0,
          unconfiguredDurationSeconds: 0,
        },
      },
      byTask: [],
      totalBillableSeconds: 21600,
      totalNonBillableSeconds: 0,
      totalUnconfiguredSeconds: 0,
    };

    const props = {
      ...mockProps,
      periodTotalSec: 21600,
      dailyAverageSec: 7200,
      billingResult: multiCurrencyBilling,
    };

    // Act
    render(<ReportStatsCards {...props} />);

    // Assert: individual cards rendered for each currency
    const plnCard = screen.getByTestId('report-stat-financial-PLN');
    const eurCard = screen.getByTestId('report-stat-financial-EUR');
    expect(plnCard).not.toBeNull();
    expect(eurCard).not.toBeNull();
    expect(plnCard.textContent).toContain('3 450.00 PLN');
    expect(eurCard.textContent).toContain('1 200.00 EUR');

    // Strict separation: No combined / summed currency string exists
    expect(screen.queryByText(/4 650/)).toBeNull();
  });

  it('should handle zero-rate non_billable tasks correctly with badge indicator', () => {
    // Arrange
    const nonBillableBilling: RangeBillingResult = {
      byCurrency: {
        PLN: {
          currency: 'PLN',
          totalAmount: '0.00',
          billableDurationSeconds: 0,
          nonBillableDurationSeconds: 7200,
          unconfiguredDurationSeconds: 0,
        },
      },
      byTask: [],
      totalBillableSeconds: 0,
      totalNonBillableSeconds: 7200,
      totalUnconfiguredSeconds: 0,
    };

    const props = {
      ...mockProps,
      periodTotalSec: 7200,
      dailyAverageSec: 7200,
      billingResult: nonBillableBilling,
    };

    // Act
    render(<ReportStatsCards {...props} />);

    // Assert
    const financialCard = screen.getByTestId('report-stat-financial');
    expect(financialCard).not.toBeNull();
    expect(financialCard.textContent).toContain('0.00 PLN');
    expect(financialCard.textContent).toContain('02:00:00');
  });

  it('should handle unconfigured rate tasks correctly with fallback status', () => {
    // Arrange
    const unconfiguredBilling: RangeBillingResult = {
      byCurrency: {},
      byTask: [],
      totalBillableSeconds: 0,
      totalNonBillableSeconds: 0,
      totalUnconfiguredSeconds: 5400,
    };

    const props = {
      ...mockProps,
      periodTotalSec: 5400,
      dailyAverageSec: 5400,
      billingResult: unconfiguredBilling,
    };

    // Act
    render(<ReportStatsCards {...props} />);

    // Assert
    const financialCard = screen.getByTestId('report-stat-financial');
    expect(financialCard).not.toBeNull();
    expect(financialCard.textContent).toContain('-');
    expect(financialCard.textContent).toContain('01:30:00');
  });

  it('should display error card when billingError is provided', () => {
    // Arrange
    const props = {
      ...mockProps,
      periodTotalSec: 3600,
      dailyAverageSec: 3600,
      billingError: 'Failed to connect to billing engine',
    };

    // Act
    render(<ReportStatsCards {...props} />);

    // Assert
    const financialCard = screen.getByTestId('report-stat-financial');
    expect(financialCard).not.toBeNull();
    expect(financialCard.textContent).toContain('Failed to connect to billing engine');
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
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByTestId('report-stat-today').closest('[hidden]')).not.toBeNull();
  });
});
