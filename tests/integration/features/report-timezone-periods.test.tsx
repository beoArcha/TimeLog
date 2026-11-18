// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportView from '@features/reports/ReportView';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import { getMockOXyFlowState, setupMatchMediaMock } from '@tests/shared/test-helpers';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { EngineRouter } from '@common/engine/EngineRouter';

describe('Given a log from 00:10 to 00:50 local time in Europe/Warsaw while the UTC date is still the previous day', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
    vi.spyOn(EngineRouter, 'getInstance').mockReturnValue({
      billing: {
        calculateRangeBilling: vi.fn().mockResolvedValue({
          byCurrency: {},
          byTask: [],
          totalBillableSeconds: 0,
          totalNonBillableSeconds: 0,
          totalUnconfiguredSeconds: 0,
        }),
        resolveEffectiveTaskRate: vi.fn(),
      },
    } as unknown as EngineRouter);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function renderReport(reportPeriod: string): void {
    const mockState = getMockOXyFlowState();
    const project = aProject({ id: 'p1', name: 'Alpha Corp' });
    const task = aTask({ id: 't1', projectId: 'p1', name: 'Night Shift' });
    // 22:10Z-22:50Z is 00:10-00:50 on 2026-07-15 in Warsaw (CEST, UTC+2)
    const log = aTimeLog({
      id: 'l1',
      projectId: 'p1',
      taskId: 't1',
      startTime: '2026-07-14T22:10:00Z',
      endTime: '2026-07-14T22:50:00Z',
    });

    const state = {
      ...mockState,
      projects: [project],
      tasks: [task],
      logs: [log],
      nowIso: '2026-07-15T12:00:00Z',
      reportPeriod,
      reportSort: 'duration',
      setReportPeriod: vi.fn(),
      setReportSort: vi.fn(),
      toggleReportProject: vi.fn(),
      clearReportProjects: vi.fn(),
    } as unknown as GuiState;

    render(
      <MockProviders state={mockState} settingsState={{ timezone: 'Europe/Warsaw', resolvedTimezone: 'Europe/Warsaw' }}>
        <ReportView state={state} />
      </MockProviders>
    );
  }

  describe('When the Today report is shown', () => {
    it('Then the period total and the Today card are 00:40:00', async () => {
      // Given
      // the log above and the user timezone Europe/Warsaw

      // When
      renderReport('today');

      // Then
      await waitFor(() => {
        expect(screen.getByTestId('report-stat-total').textContent).toContain('00:40:00');
      });
      expect(screen.getByTestId('report-stat-today').textContent).toContain('00:40:00');
    });
  });

  describe('When the Yesterday report is shown', () => {
    it('Then the period total is 00:00:00', async () => {
      // Given
      // the log above and the user timezone Europe/Warsaw

      // When
      renderReport('yesterday');

      // Then
      await waitFor(() => {
        expect(screen.getByTestId('report-stat-total').textContent).toContain('00:00:00');
      });
    });
  });
});
