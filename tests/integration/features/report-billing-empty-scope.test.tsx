// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportView from '@features/reports/ReportView';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import { getMockOXyFlowState, setupMatchMediaMock } from '@tests/shared/test-helpers';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { EngineRouter } from '@common/engine/EngineRouter';
import { RangeBillingResult } from '@common/engine/billing/types';

describe('Given a tag filter that matches no project in the report scope', () => {
  let calculateRangeBillingMock: ReturnType<typeof vi.fn>;

  const populatedBillingResult: RangeBillingResult = {
    byCurrency: {
      USD: {
        currency: 'USD',
        totalAmount: '450.00',
        billableDurationSeconds: 10800,
        nonBillableDurationSeconds: 0,
        unconfiguredDurationSeconds: 0,
      },
    },
    byTask: [
      {
        taskId: 't-alpha',
        taskName: 'Alpha Task',
        projectId: 'p-alpha',
        durationSeconds: 10800,
        effectiveRate: '150.00',
        currency: 'USD',
        rateStatus: 'custom',
        amount: '450.00',
      },
    ],
    totalBillableSeconds: 10800,
    totalNonBillableSeconds: 0,
    totalUnconfiguredSeconds: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
    calculateRangeBillingMock = vi.fn().mockResolvedValue(populatedBillingResult);
    vi.spyOn(EngineRouter, 'getInstance').mockReturnValue({
      billing: {
        calculateRangeBilling: calculateRangeBillingMock,
        resolveEffectiveTaskRate: vi.fn(),
      },
    } as unknown as EngineRouter);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('When a tag filter matches no project within the selected project scope', () => {
    it('Then billing shows the empty result consistent with the stats and without querying the engine', async () => {
      // Given
      const mockState = getMockOXyFlowState();
      const projectAlpha = aProject({
        id: 'p-alpha',
        name: 'Alpha Client',
        tags: ['frontend'],
      });
      const projectBeta = aProject({
        id: 'p-beta',
        name: 'Beta Internal',
        tags: ['backend'],
      });

      const taskAlpha = aTask({
        id: 't-alpha',
        projectId: 'p-alpha',
        name: 'Frontend Feature',
      });
      const taskBeta = aTask({
        id: 't-beta',
        projectId: 'p-beta',
        name: 'Backend API',
      });

      const logAlpha = aTimeLog({
        id: 'l-alpha',
        projectId: 'p-alpha',
        taskId: 't-alpha',
        startTime: '2026-06-15T09:00:00Z',
        endTime: '2026-06-15T12:00:00Z',
      });
      const logBeta = aTimeLog({
        id: 'l-beta',
        projectId: 'p-beta',
        taskId: 't-beta',
        startTime: '2026-06-15T13:00:00Z',
        endTime: '2026-06-15T16:00:00Z',
      });

      // Report scope holds only project Alpha
      const stateProp = {
        ...mockState,
        projects: [projectAlpha, projectBeta],
        tasks: [taskAlpha, taskBeta],
        logs: [logAlpha, logBeta],
        nowIso: '2026-06-15T18:00:00Z',
        reportPeriod: 'week',
        reportSort: 'duration',
        reportProjectIds: ['p-alpha'],
        setReportPeriod: vi.fn(),
        setReportSort: vi.fn(),
        toggleReportProject: vi.fn(),
        clearReportProjects: vi.fn(),
      } as unknown as GuiState;

      render(
        <MockProviders state={mockState}>
          <ReportView state={stateProp} />
        </MockProviders>
      );

      // Wait for the initial in-scope billing fetch so the later assertion only sees the tag change
      await waitFor(() => {
        expect(screen.getByTestId('report-billing-collapsible-header')).toBeDefined();
      });

      calculateRangeBillingMock.mockClear();

      // When
      const backendTagChip = screen.getByTestId('tag-chip-backend');
      fireEvent.click(backendTagChip);

      // Then
      await waitFor(() => {
        expect(screen.getByTestId('report-billing-empty')).toBeDefined();
      });

      expect(screen.getByTestId('report-stat-total').textContent).toContain('00:00:00');

      expect(screen.queryByTestId('report-stat-currency-USD')).toBeNull();

      // Billing engine was NOT queried because empty intersection is resolved immediately
      expect(calculateRangeBillingMock).not.toHaveBeenCalled();
    });
  });
});
