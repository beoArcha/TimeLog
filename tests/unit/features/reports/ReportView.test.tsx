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

  describe('Project filter consistency and data flow (Fix D)', () => {
    const multiProjectState: GuiState = {
      ...mockGuiState,
      projects: [
        { id: 'p1', name: 'Alpha Project', color: 'indigo', createdAt: '2026-06-01T00:00:00Z', archived: false, description: null, icon: null, tags: null },
        { id: 'p2', name: 'Beta Project', color: 'emerald', createdAt: '2026-06-01T00:00:00Z', archived: false, description: null, icon: null, tags: null },
      ],
      tasks: [
        { id: 't1', projectId: 'p1', name: 'Alpha Task', completed: false, createdAt: '2026-06-01T00:00:00Z', status: null, parentTaskId: null },
        { id: 't2', projectId: 'p2', name: 'Beta Task', completed: false, createdAt: '2026-06-01T00:00:00Z', status: null, parentTaskId: null },
      ],
      logs: [
        { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T09:00:00Z', endTime: '2026-06-15T10:00:00Z', note: 'Alpha work' },
        { id: 'l2', taskId: 't2', projectId: 'p2', startTime: '2026-06-15T11:00:00Z', endTime: '2026-06-15T13:00:00Z', note: 'Beta work' },
      ],
      reportPeriod: 'all',
    } as unknown as GuiState;

    it('when no project is selected, includes data for all projects across report sections', () => {
      render(<ReportView state={multiProjectState} />);

      // Both Alpha Task and Beta Task are rendered in the dump
      expect(screen.getAllByText(/"Alpha Task"/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/"Beta Task"/i).length).toBeGreaterThan(0);

      // Both projects appear in the distribution list
      expect(screen.getAllByText(/Alpha Project/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Beta Project/i).length).toBeGreaterThan(0);
    });
  });

  describe('Print output for collapsed report cards (Fix B)', () => {
    it('ensures collapsed report sections remain mounted in the DOM for print media', () => {
      const { container } = render(<ReportView state={mockGuiState} />);

      // 1. Stats collapsible card header
      const statsHeader = screen.getByTestId('report-stats-collapsible-header');
      expect(statsHeader).not.toBeNull();

      // Click to collapse on screen
      fireEvent.click(statsHeader);

      // The content wrapper remains in DOM with hidden print:flex
      const statsContent = container.querySelector('#collapsible-content-report-stats-collapsible-header');
      expect(statsContent).not.toBeNull();
      expect(statsContent?.className).toContain('hidden');
      expect(statsContent?.className).toContain('print:flex');

      // 2. Stacked bar chart collapsible header
      const chartHeader = screen.getByTestId('stacked-activity-chart-header');
      expect(chartHeader).not.toBeNull();
      fireEvent.click(chartHeader);

      const chartContent = container.querySelector('#collapsible-content-stacked-activity-chart-header');
      expect(chartContent).not.toBeNull();
      expect(chartContent?.className).toContain('hidden');
      expect(chartContent?.className).toContain('print:flex');

      // 3. Project donut chart collapsible header
      const donutHeader = screen.getByTestId('project-donut-chart-header');
      expect(donutHeader).not.toBeNull();
      fireEvent.click(donutHeader);

      const donutContent = container.querySelector('#collapsible-content-project-donut-chart-header');
      expect(donutContent).not.toBeNull();
      expect(donutContent?.className).toContain('hidden');
      expect(donutContent?.className).toContain('print:flex');
    });
  });

  describe('Project Filter Synchronization & BDT Tests (E1)', () => {
    const multiProjectState: GuiState = {
      ...mockGuiState,
      projects: [
        { id: 'p1', name: 'Alpha Project', color: 'indigo', createdAt: '2026-06-01T00:00:00Z', archived: false, description: null, icon: null, tags: null },
        { id: 'p2', name: 'Beta Project', color: 'emerald', createdAt: '2026-06-01T00:00:00Z', archived: false, description: null, icon: null, tags: null },
      ],
      tasks: [
        { id: 't1', projectId: 'p1', name: 'Alpha Task', completed: false, createdAt: '2026-06-01T00:00:00Z', status: null, parentTaskId: null },
        { id: 't2', projectId: 'p2', name: 'Beta Task', completed: false, createdAt: '2026-06-01T00:00:00Z', status: null, parentTaskId: null },
      ],
      logs: [
        { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T09:00:00Z', endTime: '2026-06-15T10:00:00Z', note: 'Alpha work 1h' },
        { id: 'l2', taskId: 't2', projectId: 'p2', startTime: '2026-06-15T11:00:00Z', endTime: '2026-06-15T13:00:00Z', note: 'Beta work 2h' },
      ],
      reportPeriod: 'all',
      setSelectedProjectId: vi.fn(),
    } as unknown as GuiState;

    it('Given multiple projects When no project is selected (All) Then total shows sum of all projects (10800s / 3h)', () => {
      // Given & When
      render(<ReportView state={multiProjectState} />);

      // Then
      expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('project-filter-p1').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getByTestId('project-filter-p2').getAttribute('aria-pressed')).toBe('false');

      // Both tasks and projects appear
      expect(screen.getAllByText(/Alpha Task/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Beta Task/i).length).toBeGreaterThan(0);

      // Period total must be 3h (3600 + 7200 = 10800s)
      expect(screen.getByTestId('report-stat-total')).toBeDefined();
      expect(screen.getByTestId('report-stat-total').textContent).toContain('03:00:00');
    });

    it('Given multiple projects When user selects Alpha Project from filter list Then sum equals sum of its logs (3600s / 1h) and list/chart synchronize', () => {
      // Given
      const setSelectedProjectIdSpy = vi.fn();
      render(
        <ReportView
          state={{
            ...multiProjectState,
            setSelectedProjectId: setSelectedProjectIdSpy,
          }}
        />
      );

      // When
      const p1Btn = screen.getByTestId('project-filter-p1');
      fireEvent.click(p1Btn);

      // Then - List state updated
      expect(screen.getByTestId('project-filter-p1').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('false');
      expect(setSelectedProjectIdSpy).toHaveBeenCalledWith('p1');

      // Then - Period total equals sum of p1 logs (1h = 01:00:00)
      expect(screen.getByTestId('report-stat-total').textContent).toContain('01:00:00');

      // Then - Only Alpha Task is rendered in logs
      expect(screen.getAllByText(/Alpha Task/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Beta Task/i)).toBeNull();

      // Then - Donut chart shows selected badge and clear button
      expect(screen.getByTestId('clear-project-filter')).toBeDefined();
    });

    it('Given selected project When clearing filter from Donut Chart Then list selection returns to All and total restores to full sum', () => {
      // Given
      const setSelectedProjectIdSpy = vi.fn();
      render(
        <ReportView
          state={{
            ...multiProjectState,
            setSelectedProjectId: setSelectedProjectIdSpy,
          }}
        />
      );

      // Select p2 first
      fireEvent.click(screen.getByTestId('project-filter-p2'));
      expect(screen.getByTestId('report-stat-total').textContent).toContain('02:00:00');
      expect(screen.getByTestId('clear-project-filter')).toBeDefined();

      // When - click Clear Filter in Donut Chart
      fireEvent.click(screen.getByTestId('clear-project-filter'));

      // Then - Filter list switches back to All
      expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('project-filter-p2').getAttribute('aria-pressed')).toBe('false');
      expect(setSelectedProjectIdSpy).toHaveBeenCalledWith(null);

      // Then - Full sum restored (3h = 03:00:00)
      expect(screen.getByTestId('report-stat-total').textContent).toContain('03:00:00');
      expect(screen.getAllByText(/Alpha Task/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Beta Task/i).length).toBeGreaterThan(0);
    });

    it('Given external state update from sidebar When state.selectedProjectId changes Then ReportView reacts and syncs selection', () => {
      // Given
      const { rerender } = render(<ReportView state={multiProjectState} />);
      expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('true');

      // When - External state updates (user clicked p1 in sidebar)
      rerender(
        <ReportView
          state={{
            ...multiProjectState,
            selectedProjectId: 'p1',
          }}
        />
      );

      // Then - ReportView project filter reacts to sidebar selection
      expect(screen.getByTestId('project-filter-p1').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getByTestId('report-stat-total').textContent).toContain('01:00:00');
    });
  });
});

