// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportView from '@features/reports/ReportView';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('Given ReportView component', () => {
  let mockState: ReturnType<typeof getMockOxyFlowState>;

  beforeEach(() => {
    mockState = getMockOxyFlowState();
    const project = aProject({ id: 'proj_1', name: 'Project Alpha', color: 'rose' });
    const task = aTask({ id: 'task_1', projectId: 'proj_1', parentTaskId: null, name: 'Task One', completed: false });
    const log = aTimeLog({
      id: 'l1',
      projectId: 'proj_1',
      taskId: 'task_1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
      note: 'Log 1',
    });

    mockState.projects = [project];
    mockState.tasks = [task];
    mockState.logs = [log];
    mockState.nowIso = '2026-06-15T12:00:00Z';
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('When rendered with active time logs', () => {
    it('Then it should render the report dashboard with metrics, projects and tasks', () => {
      // Given
      const stateProp = {
        ...mockState,
        reportPeriod: 'week',
        reportSort: 'duration',
        setReportPeriod: vi.fn(),
        setReportSort: vi.fn(),
      } as unknown as GuiState;

      // When
      render(<ReportView state={stateProp} />);

      // Then
      expect(screen.getByRole('heading', { level: 2 })).toBeDefined();
      expect(screen.getAllByText(/01:00:00/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Project Alpha').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Task One')).toBeDefined();
    });
  });

  describe('When report period and sort criteria are changed', () => {
    it('Then it should notify state coordinator with selected filters', () => {
      // Given
      const setReportPeriodSpy = vi.fn();
      const setReportSortSpy = vi.fn();

      const stateProp = {
        ...mockState,
        reportPeriod: 'week',
        reportSort: 'duration',
        setReportPeriod: setReportPeriodSpy,
        setReportSort: setReportSortSpy,
      } as unknown as GuiState;

      render(<ReportView state={stateProp} />);

      // When
      const todayBtn = screen.getByRole('button', { name: /today/i });
      fireEvent.click(todayBtn);

      const selectEl = screen.getByRole('combobox');
      fireEvent.change(selectEl, { target: { value: 'date' } });

      // Then
      expect(setReportPeriodSpy).toHaveBeenCalledWith('today');
      expect(setReportSortSpy).toHaveBeenCalledWith('date');
    });
  });
});
