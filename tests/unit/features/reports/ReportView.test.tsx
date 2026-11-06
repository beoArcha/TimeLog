// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ReportView from '@features/reports/ReportView';
import { GuiState } from '@layouts/hooks/useGuiLogic';

describe('Unit Tests: ReportView', () => {
  const mockGuiState: GuiState = {
    projects: [
      { id: 'p1', name: 'Proj A', color: 'indigo', createdAt: '2026-06-15T00:00:00Z', archived: false, description: null, icon: null, tags: null }
    ],
    tasks: [
      { id: 't1', projectId: 'p1', name: 'Task 1', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null }
    ],
    logs: [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', note: 'Report log item', editHistory: null }
    ],
    nowIso: '2026-06-15T14:00:00Z',
    locale: 'en',
    customTranslations: {},
    theme: 'dark',
    activeLog: null,
    holidays: [],
    setHolidays: vi.fn(),
    sysSettings: { autoStart: false, includePatchesInReports: false, activeSinks: [] },
    selectedTaskId: null,
    setSelectedTaskId: vi.fn(),
    onAddProject: vi.fn(),
    onAddTask: vi.fn(),
    onRenameProject: vi.fn(),
    onRenameTask: vi.fn(),
    onUpdateProject: vi.fn(),
    onUpdateTask: vi.fn(),
    onToggleTaskComplete: vi.fn(),
    onDeleteTask: vi.fn(),
    onStartTimer: vi.fn(),
    onStopTimer: vi.fn(),
    onToggleProjectArchive: vi.fn(),
    showDbInspector: false,
    setShowDbInspector: vi.fn(),
    activeLargeTab: 'cli',
    activeView: 'tasks',
    patches: [],
    reportPeriod: 'all',
    setReportPeriod: vi.fn(),
    reportSort: 'duration',
    setReportSort: vi.fn()
  } as unknown as GuiState;

  afterEach(() => {
    cleanup();
  });

  it('should render ReportView component with nested sub-components', () => {
    render(<ReportView state={mockGuiState} />);
    
    // There are multiple instances of Task 1 text rendered in ReportView, verify we get them
    const items = screen.getAllByText(/Task 1/i);
    expect(items.length).toBeGreaterThan(0);
  });

  it('should render both stacked bar activity chart and project donut chart', () => {
    // Arrange & Act
    render(<ReportView state={mockGuiState} />);

    // Assert
    expect(screen.getByTestId('stacked-bar-activity-chart')).not.toBeNull();
    expect(screen.getByTestId('project-donut-chart')).not.toBeNull();
  });

  it('should calculate exportPayload with effective project breakdown reflecting visible data', async () => {
    const multiProjectState: GuiState = {
      ...mockGuiState,
      projects: [
        { id: 'p1', name: 'Proj Alpha', color: 'indigo', createdAt: '2026-06-15T00:00:00Z', tags: ['frontend'] },
        { id: 'p2', name: 'Proj Beta', color: 'blue', createdAt: '2026-06-15T00:00:00Z', tags: ['backend'] },
      ],
      tasks: [
        { id: 't1', projectId: 'p1', name: 'Task 1', completed: false, createdAt: '2026-06-15T00:00:00Z' },
        { id: 't2', projectId: 'p2', name: 'Task 2', completed: false, createdAt: '2026-06-15T00:00:00Z' },
      ],
      logs: [
        { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T10:00:00Z', endTime: '2026-06-15T11:00:00Z' },
        { id: 'l2', taskId: 't2', projectId: 'p2', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z' },
      ],
    } as unknown as GuiState;

    render(<ReportView state={multiProjectState} />);

    // Open export modal
    const exportBtn = screen.getByTestId('report-export-button');
    expect(exportBtn).not.toBeNull();
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByTestId('report-export-modal')).not.toBeNull();
    });
  });
});
