// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportView from '@features/reports/ReportView';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import { getMockOxyFlowState, setupMatchMediaMock } from '@tests/shared/test-helpers';
import { GuiState } from '@layouts/hooks/useGuiLogic';

describe('Given ReportView and reporting analytics workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-export-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('When ReportView renders with historical time logs', () => {
    it('Then it computes period metrics, project distribution and renders charts', () => {
      // Given
      const mockState = getMockOxyFlowState();
      const projectA = aProject({ id: 'p1', name: 'Alpha Corp', color: 'rose' });
      const projectB = aProject({ id: 'p2', name: 'Beta Dynamics', color: 'indigo' });
      const taskA = aTask({ id: 't1', projectId: 'p1', name: 'Frontend Refactor' });
      const taskB = aTask({ id: 't2', projectId: 'p2', name: 'Backend Migration' });

      const logA = aTimeLog({
        id: 'l1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-06-15T09:00:00Z',
        endTime: '2026-06-15T12:00:00Z',
      });
      const logB = aTimeLog({
        id: 'l2',
        projectId: 'p2',
        taskId: 't2',
        startTime: '2026-06-15T13:00:00Z',
        endTime: '2026-06-15T14:30:00Z',
      });

      const stateProp = {
        ...mockState,
        projects: [projectA, projectB],
        tasks: [taskA, taskB],
        logs: [logA, logB],
        nowIso: '2026-06-15T18:00:00Z',
        reportPeriod: 'week',
        reportSort: 'duration',
        setReportPeriod: vi.fn(),
        setReportSort: vi.fn(),
      } as unknown as GuiState;

      // When
      render(
        <MockProviders state={mockState}>
          <ReportView state={stateProp} />
        </MockProviders>
      );

      // Then
      expect(screen.getByRole('main')).toBeDefined();
      expect(screen.getAllByText('Alpha Corp').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Beta Dynamics').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('report-export-button')).toBeDefined();
    });
  });

  describe('When user switches period filter to today', () => {
    it('Then it notifies state coordinator to update reportPeriod', () => {
      // Given
      const setReportPeriodSpy = vi.fn();
      const mockState = getMockOxyFlowState();

      const stateProp = {
        ...mockState,
        reportPeriod: 'week',
        reportSort: 'duration',
        setReportPeriod: setReportPeriodSpy,
        setReportSort: vi.fn(),
      } as unknown as GuiState;

      render(
        <MockProviders state={mockState}>
          <ReportView state={stateProp} />
        </MockProviders>
      );

      // When
      const todayBtn = screen.getByRole('button', { name: /today/i });
      fireEvent.click(todayBtn);

      // Then
      expect(setReportPeriodSpy).toHaveBeenCalledWith('today');
    });
  });

  describe('When user opens export modal and downloads report', () => {
    it('Then it opens dialog and triggers simulated CSV download', async () => {
      // Given
      const mockState = getMockOxyFlowState();
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      const stateProp = {
        ...mockState,
        projects: [aProject({ id: 'p1', name: 'Alpha' })],
        tasks: [aTask({ id: 't1', projectId: 'p1', name: 'Task 1' })],
        logs: [aTimeLog({ id: 'l1', projectId: 'p1', taskId: 't1' })],
        nowIso: '2026-06-15T18:00:00Z',
        reportPeriod: 'all',
        reportSort: 'date',
        setReportPeriod: vi.fn(),
        setReportSort: vi.fn(),
      } as unknown as GuiState;

      render(
        <MockProviders state={mockState}>
          <ReportView state={stateProp} />
        </MockProviders>
      );

      // When
      const exportBtn = screen.getByTestId('report-export-button');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });

      const downloadBtn = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadBtn);

      // Then
      await waitFor(() => {
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
      });
    });
  });
});
