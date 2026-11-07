// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ReportBillingCard from '@features/reports/components/ReportBillingCard';
import { EngineRouter } from '@common/engine/EngineRouter';
import { RangeBillingResult } from '@common/engine/billing/types';

describe('Unit Tests: ReportBillingCard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockBillingResult: RangeBillingResult = {
    byCurrency: {
      USD: {
        currency: 'USD',
        totalAmount: '450.00',
        billableDurationSeconds: 14400,
        nonBillableDurationSeconds: 3600,
        unconfiguredDurationSeconds: 1800,
      },
      EUR: {
        currency: 'EUR',
        totalAmount: '200.00',
        billableDurationSeconds: 7200,
        nonBillableDurationSeconds: 0,
        unconfiguredDurationSeconds: 0,
      },
    },
    byTask: [
      {
        taskId: 't-1',
        taskName: 'Backend Architecture',
        projectId: 'p-1',
        durationSeconds: 14400,
        effectiveRate: '112.50',
        currency: 'USD',
        rateStatus: 'custom',
        amount: '450.00',
      },
    ],
    totalBillableSeconds: 21600,
    totalNonBillableSeconds: 3600,
    totalUnconfiguredSeconds: 1800,
  };

  it('should render currency stat cards and task breakdown when billing data is returned', async () => {
    const mockCalculate = vi.fn().mockResolvedValue(mockBillingResult);
    vi.spyOn(EngineRouter, 'getInstance').mockReturnValue({
      billing: {
        calculateRangeBilling: mockCalculate,
        resolveEffectiveTaskRate: vi.fn(),
      },
    } as unknown as EngineRouter);

    render(
      <ReportBillingCard
        reportPeriod="thisWeek"
        nowIso="2026-10-31T12:00:00.000Z"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('report-billing-collapsible-header')).toBeTruthy();
    });

    // Check currencies cards
    expect(screen.getByTestId('report-stat-currency-USD')).toBeTruthy();
    expect(screen.getByTestId('report-stat-currency-EUR')).toBeTruthy();
    expect(screen.getAllByText('450.00 USD').length).toBe(2);
    expect(screen.getByText('200.00 EUR')).toBeTruthy();

    // Check task breakdown
    expect(screen.getByText('Backend Architecture')).toBeTruthy();
    expect(screen.getByText('custom')).toBeTruthy();
  });

  it('should render empty state when byCurrency is empty', async () => {
    const emptyResult: RangeBillingResult = {
      byCurrency: {},
      byTask: [],
      totalBillableSeconds: 0,
      totalNonBillableSeconds: 1800,
      totalUnconfiguredSeconds: 3600,
    };

    const mockCalculate = vi.fn().mockResolvedValue(emptyResult);
    vi.spyOn(EngineRouter, 'getInstance').mockReturnValue({
      billing: {
        calculateRangeBilling: mockCalculate,
        resolveEffectiveTaskRate: vi.fn(),
      },
    } as unknown as EngineRouter);

    render(
      <ReportBillingCard
        reportPeriod="today"
        nowIso="2026-10-31T12:00:00.000Z"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('report-billing-empty')).toBeTruthy();
    });
  });

  it('should render visible error alert instead of returning null when billing calculation fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Arrange: Mock billing engine failure
    const mockCalculate = vi.fn().mockRejectedValue(new Error('SQLite billing query failed'));
    vi.spyOn(EngineRouter, 'getInstance').mockReturnValue({
      billing: {
        calculateRangeBilling: mockCalculate,
        resolveEffectiveTaskRate: vi.fn(),
      },
    } as unknown as EngineRouter);

    // Act
    render(
      <ReportBillingCard
        reportPeriod="month"
        nowIso="2026-10-31T12:00:00.000Z"
      />
    );

    // Assert: Collapsible header exists and visible alert is displayed to user
    await waitFor(() => {
      expect(screen.getByTestId('report-billing-error')).toBeTruthy();
    });
    // Raw technical error should NOT be shown in the UI
    expect(screen.queryByText('SQLite billing query failed')).toBeNull();
    // User gets friendly translated message
    expect(screen.getAllByText('Failed to calculate range billing').length).toBeGreaterThan(0);
    expect(screen.getByTestId('report-billing-collapsible-header')).toBeTruthy();
    // Technical details are logged to console.error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ReportBillingCard] Billing calculation failed:'),
      expect.objectContaining({ error: expect.any(Error) })
    );
  });

  it('should render zero-rate non_billable and unconfigured tasks in task table correctly', async () => {
    // Arrange: Billing result with non_billable and unconfigured tasks
    const variedBillingResult: RangeBillingResult = {
      byCurrency: {
        PLN: {
          currency: 'PLN',
          totalAmount: '0.00',
          billableDurationSeconds: 0,
          nonBillableDurationSeconds: 3600,
          unconfiguredDurationSeconds: 1800,
        },
      },
      byTask: [
        {
          taskId: 't-non-billable',
          taskName: 'Internal Sync Meeting',
          projectId: 'p-1',
          durationSeconds: 3600,
          effectiveRate: null,
          currency: 'PLN',
          rateStatus: 'non_billable',
          amount: '0.00',
        },
        {
          taskId: 't-unconfigured',
          taskName: 'Unassigned Research',
          projectId: 'p-1',
          durationSeconds: 1800,
          effectiveRate: null,
          currency: null,
          rateStatus: 'unconfigured',
          amount: null,
        },
      ],
      totalBillableSeconds: 0,
      totalNonBillableSeconds: 3600,
      totalUnconfiguredSeconds: 1800,
    };

    // Act
    render(
      <ReportBillingCard
        reportPeriod="thisWeek"
        billingResult={variedBillingResult}
      />
    );

    // Assert
    expect(screen.getByText('Internal Sync Meeting')).toBeTruthy();
    expect(screen.getByText('Unassigned Research')).toBeTruthy();
    expect(screen.getByTestId('task-rate-status-t-non-billable')).toBeTruthy();
    expect(screen.getByTestId('task-rate-status-t-unconfigured')).toBeTruthy();
    expect(screen.getByTestId('task-rate-status-t-non-billable').textContent).toBe('non_billable');
    expect(screen.getByTestId('task-rate-status-t-unconfigured').textContent).toBe('unconfigured');
  });

  it('should render controlled billingError directly without fetching', () => {
    // Act
    render(
      <ReportBillingCard
        reportPeriod="thisWeek"
        billingError="Direct controlled error message"
      />
    );

    // Assert
    expect(screen.getByTestId('report-billing-error')).toBeTruthy();
    expect(screen.getByText('Direct controlled error message')).toBeTruthy();
  });

  it('should pass selectedProjectIds to billing calculation filter when provided', async () => {
    const mockCalculate = vi.fn().mockResolvedValue(mockBillingResult);
    vi.spyOn(EngineRouter, 'getInstance').mockReturnValue({
      billing: {
        calculateRangeBilling: mockCalculate,
        resolveEffectiveTaskRate: vi.fn(),
      },
    } as unknown as EngineRouter);

    render(
      <ReportBillingCard
        reportPeriod="thisWeek"
        nowIso="2026-10-31T12:00:00.000Z"
        selectedProjectIds={['p-1', 'p-2']}
      />
    );

    await waitFor(() => {
      expect(mockCalculate).toHaveBeenCalledWith(
        expect.objectContaining({
          projectIds: ['p-1', 'p-2'],
        }),
        '2026-10-31T12:00:00.000Z'
      );
    });
  });
});
