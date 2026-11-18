// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import ReportBillingCard from '@features/reports/components/ReportBillingCard';
import { RangeBillingResult } from '@common/engine/billing/types';

describe('Unit Tests: ReportBillingCard', () => {
  afterEach(() => {
    cleanup();
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

  it('should render currency stat cards and task breakdown when billing data is returned', () => {
    // Arrange
    const result = mockBillingResult;

    // Act
    render(<ReportBillingCard billingResult={result} />);

    // Assert
    expect(screen.getByTestId('report-billing-collapsible-header')).toBeTruthy();
    expect(screen.getByTestId('report-stat-currency-USD')).toBeTruthy();
    expect(screen.getByTestId('report-stat-currency-EUR')).toBeTruthy();
    expect(screen.getByTestId('task-rate-status-t-1')).toBeTruthy();
  });

  it('should render empty state when byCurrency is empty', () => {
    // Arrange
    const emptyResult: RangeBillingResult = {
      byCurrency: {},
      byTask: [],
      totalBillableSeconds: 0,
      totalNonBillableSeconds: 1800,
      totalUnconfiguredSeconds: 3600,
    };

    // Act
    render(<ReportBillingCard billingResult={emptyResult} />);

    // Assert
    expect(screen.getByTestId('report-billing-collapsible-header')).toBeTruthy();
    expect(screen.getByTestId('report-billing-empty')).toBeTruthy();
  });

  it('should render visible error alert when billingError is provided', () => {
    // Arrange
    const errorMessage = 'Billing calculation failed';

    // Act
    render(<ReportBillingCard billingError={errorMessage} />);

    // Assert
    expect(screen.getByTestId('report-billing-collapsible-header')).toBeTruthy();
    expect(screen.getByTestId('report-billing-error')).toBeTruthy();
  });

  it('should render zero-rate non_billable and unconfigured tasks in task table correctly', () => {
    // Arrange
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
    render(<ReportBillingCard billingResult={variedBillingResult} />);

    // Assert
    expect(screen.getByTestId('task-rate-status-t-non-billable')).toBeTruthy();
    expect(screen.getByTestId('task-rate-status-t-unconfigured')).toBeTruthy();
  });

  it('should render nothing when billingResult is null and isLoading is false', () => {
    // Arrange
    const result = null;

    // Act
    const { container } = render(<ReportBillingCard billingResult={result} isLoading={false} />);

    // Assert
    expect(container.firstChild).toBeNull();
  });
});
