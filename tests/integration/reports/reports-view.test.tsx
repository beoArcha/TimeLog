// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportView from '@features/reports/ReportView';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Integration Tests: ReportView', () => {
  let mockState: ReturnType<typeof getMockOxyFlowState>;

  beforeEach(() => {
    mockState = getMockOxyFlowState();
    mockState.logs = [
      {
        id: 'l1',
        projectId: 'proj_1',
        taskId: 'task_1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: '2026-06-15T11:00:00Z', // 3600s
        note: 'Log 1',
        editHistory: undefined
      }
    ];
    mockState.projects = [
      { id: 'proj_1', name: 'Project Alpha', color: 'rose', createdAt: '2026-06-12T00:00:00Z' }
    ];
    mockState.tasks = [
      { id: 'task_1', projectId: 'proj_1', parentTaskId: null, name: 'Task One', createdAt: '2026-06-12T00:00:00Z', completed: false }
    ];
    mockState.nowIso = '2026-06-15T12:00:00Z';
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('Given ReportView rendered, When checking headings and metrics, Then it should show title, stats cards and table', () => {
    const stateProp = {
      ...mockState,
      reportPeriod: 'week',
      reportSort: 'duration',
      setReportPeriod: vi.fn(),
      setReportSort: vi.fn(),
    } as unknown as GuiState;

    render(<ReportView state={stateProp} />);

    expect(screen.getByText(/Time Summaries & Reports/i)).toBeTruthy();
    expect(screen.getAllByText(/01:00:00/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Project Alpha')).toBeTruthy();
    expect(screen.getByText('Task One')).toBeTruthy();
  });

  it('Given ReportPeriodSelector active, When sorting buttons clicked, Then it should call setReportSort or setReportPeriod', () => {
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

    const todayBtn = screen.getByRole('button', { name: /today/i });
    fireEvent.click(todayBtn);
    expect(setReportPeriodSpy).toHaveBeenCalledWith('today');

    const selectEl = screen.getByRole('combobox');
    fireEvent.change(selectEl, { target: { value: 'date' } });
    expect(setReportSortSpy).toHaveBeenCalledWith('date');
  });
});
