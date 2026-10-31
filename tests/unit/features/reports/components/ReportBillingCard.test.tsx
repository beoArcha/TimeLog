// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
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
});
