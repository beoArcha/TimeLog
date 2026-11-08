// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ReportView from '@features/reports/ReportView';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { SidebarProjectItem } from '@layouts/parts/sidebar/SidebarProjectItem';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import type { ExportPayload } from '@features/reports/types';

interface MockExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: ExportPayload;
}

const mockReportExportModal = vi.fn();
vi.mock('@features/reports/components/ReportExportModal', () => ({
  default: (props: MockExportModalProps) => {
    mockReportExportModal(props);
    return props.isOpen ? <div data-testid="report-export-modal" /> : null;
  },
  ReportExportModal: (props: MockExportModalProps) => {
    mockReportExportModal(props);
    return props.isOpen ? <div data-testid="report-export-modal" /> : null;
  },
}));

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
    setReportSort: vi.fn(),
    selectedProjectId: null,
    setSelectedProjectId: vi.fn(),
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
      selectedProjectId: 'p1',
      projects: [
        { id: 'p1', name: 'Proj Alpha', color: 'indigo', createdAt: '2026-06-15T00:00:00Z', tags: ['frontend'] },
        { id: 'p2', name: 'Proj Beta', color: 'blue', createdAt: '2026-06-15T00:00:00Z', tags: ['backend'] },
      ],
      tasks: [
        { id: 't1', projectId: 'p1', name: 'Task 1', completed: false, createdAt: '2026-06-15T00:00:00Z' },
        { id: 't2', projectId: 'p2', name: 'Task 2', completed: false, createdAt: '2026-06-15T00:00:00Z' },
      ],
      logs: [
        { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T10:00:00Z', endTime: '2026-06-15T11:00:00Z' }, // 3600s
        { id: 'l2', taskId: 't2', projectId: 'p2', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T12:30:00Z' }, // 1800s
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

    const calls = mockReportExportModal.mock.calls;
    const lastCallProps = calls[calls.length - 1][0];
    const payload = lastCallProps.payload;

    expect(payload.totalSeconds).toBe(3600);
    expect(payload.rows).toHaveLength(1);
    expect(payload.rows[0].projectName).toBe('Proj Alpha');
    expect(payload.rows[0].durationSeconds).toBe(3600);
    expect(payload.projectBreakdown).toHaveLength(1);
    expect(payload.projectBreakdown[0].projectName).toBe('Proj Alpha');
    expect(payload.projectBreakdown[0].seconds).toBe(3600);
    expect(payload.projectBreakdown[0].percentage).toBe(100);
    expect(payload.projectBreakdown[0].tasks).toHaveLength(1);
    expect(payload.projectBreakdown[0].tasks[0].id).toBe('t1');
    expect(payload.projectBreakdown[0].tasks[0].name).toBe('Task 1');

    // Case: Empty intersection of project and tags (p1 has ['frontend'], tag 'backend' active)
    const tagChip = screen.getByTestId('tag-chip-backend');
    fireEvent.click(tagChip);

    await waitFor(() => {
      const updatedCalls = mockReportExportModal.mock.calls;
      const latestPayload = updatedCalls[updatedCalls.length - 1][0].payload;
      expect(latestPayload.totalSeconds).toBe(0);
      expect(latestPayload.rows).toHaveLength(0);
      expect(latestPayload.projectBreakdown).toHaveLength(0);
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
        { id: 'p1', name: 'Alpha Project', color: 'indigo', createdAt: '2026-06-01T00:00:00Z', archived: false, description: null, icon: null, tags: ['frontend'] },
        { id: 'p2', name: 'Beta Project', color: 'emerald', createdAt: '2026-06-01T00:00:00Z', archived: false, description: null, icon: null, tags: ['backend'] },
        { id: 'p3', name: 'Gamma Project', color: 'rose', createdAt: '2026-06-01T00:00:00Z', archived: false, description: null, icon: null, tags: ['frontend'] },
      ],
      tasks: [
        { id: 't1', projectId: 'p1', name: 'Alpha Task', completed: false, createdAt: '2026-06-01T00:00:00Z', status: null, parentTaskId: null },
        { id: 't2', projectId: 'p2', name: 'Beta Task', completed: false, createdAt: '2026-06-01T00:00:00Z', status: null, parentTaskId: null },
        { id: 't3', projectId: 'p3', name: 'Gamma Task', completed: false, createdAt: '2026-06-01T00:00:00Z', status: null, parentTaskId: null },
      ],
      logs: [
        { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T09:00:00Z', endTime: '2026-06-15T10:00:00Z', note: 'Alpha work 1h' },
        { id: 'l2', taskId: 't2', projectId: 'p2', startTime: '2026-06-15T11:00:00Z', endTime: '2026-06-15T13:00:00Z', note: 'Beta work 2h' },
        { id: 'l3', taskId: 't3', projectId: 'p3', startTime: '2026-06-15T14:00:00Z', endTime: '2026-06-15T17:00:00Z', note: 'Gamma work 3h' },
      ],
      reportPeriod: 'all',
      selectedProjectId: null,
      setSelectedProjectId: vi.fn(),
    } as unknown as GuiState;

    it('1. Sidebar -> report: external state change in state.selectedProjectId updates filter and data', () => {
      const { rerender } = render(<ReportView state={multiProjectState} />);

      // Initially All is selected: total shows 6h (1h + 2h + 3h = 21600s)
      expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('report-stat-total').textContent).toContain('06:00:00');
      expect(screen.getAllByText(/Alpha Task/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Beta Task/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Gamma Task/i).length).toBeGreaterThan(0);

      // External update: user selects Alpha in sidebar
      rerender(
        <ReportView
          state={{
            ...multiProjectState,
            selectedProjectId: 'p1',
          }}
        />
      );

      expect(screen.getByTestId('project-filter-p1').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getByTestId('report-stat-total').textContent).toContain('01:00:00');
      expect(screen.getAllByText(/Alpha Task/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Beta Task/i)).toBeNull();
      expect(screen.queryByText(/Gamma Task/i)).toBeNull();

      // External update: user selects Beta in sidebar
      rerender(
        <ReportView
          state={{
            ...multiProjectState,
            selectedProjectId: 'p2',
          }}
        />
      );

      expect(screen.getByTestId('project-filter-p2').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('project-filter-p1').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getByTestId('report-stat-total').textContent).toContain('02:00:00');
      expect(screen.getAllByText(/Beta Task/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Alpha Task/i)).toBeNull();

      // External update: user clears selection in sidebar
      rerender(
        <ReportView
          state={{
            ...multiProjectState,
            selectedProjectId: null,
          }}
        />
      );

      expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('report-stat-total').textContent).toContain('06:00:00');
    });

    it('2. Report -> sidebar: clicking project button calls state.setSelectedProjectId', () => {
      const setSelectedProjectIdSpy = vi.fn();
      const { rerender } = render(
        <ReportView
          state={{
            ...multiProjectState,
            setSelectedProjectId: setSelectedProjectIdSpy,
          }}
        />
      );

      // Click p1
      fireEvent.click(screen.getByTestId('project-filter-p1'));
      expect(setSelectedProjectIdSpy).toHaveBeenCalledWith('p1');

      // Click All
      fireEvent.click(screen.getByTestId('project-filter-all'));
      expect(setSelectedProjectIdSpy).toHaveBeenCalledWith(null);

      // Toggle off: when already selected, clicking it toggles to null
      rerender(
        <ReportView
          state={{
            ...multiProjectState,
            selectedProjectId: 'p1',
            setSelectedProjectId: setSelectedProjectIdSpy,
          }}
        />
      );

      fireEvent.click(screen.getByTestId('project-filter-p1'));
      expect(setSelectedProjectIdSpy).toHaveBeenCalledWith(null);

      // Clearing from Donut Chart
      rerender(
        <ReportView
          state={{
            ...multiProjectState,
            selectedProjectId: 'p2',
            setSelectedProjectId: setSelectedProjectIdSpy,
          }}
        />
      );

      expect(screen.getByTestId('clear-project-filter')).not.toBeNull();
      fireEvent.click(screen.getByTestId('clear-project-filter'));
      expect(setSelectedProjectIdSpy).toHaveBeenCalledWith(null);
    });

    it('3. Project + matching tags: shows only data for the selected project', () => {
      render(
        <ReportView
          state={{
            ...multiProjectState,
            selectedProjectId: 'p1', // p1 has tag 'frontend'
          }}
        />
      );

      // Toggle 'frontend' tag
      const tagBtn = screen.getByTestId('tag-chip-frontend');
      fireEvent.click(tagBtn);

      // p1 matches active tag 'frontend': only p1 data is shown (1h = 01:00:00)
      expect(screen.getByTestId('report-stat-total').textContent).toContain('01:00:00');
      expect(screen.getAllByText(/Alpha Task/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Beta Task/i)).toBeNull();
      expect(screen.queryByText(/Gamma Task/i)).toBeNull();
    });

    it('4. Project + non-matching tags: returns empty results across all report sections', () => {
      render(
        <ReportView
          state={{
            ...multiProjectState,
            selectedProjectId: 'p2', // Beta has tag 'backend'
          }}
        />
      );

      // Toggle 'frontend' tag (Beta does NOT have 'frontend')
      const tagBtn = screen.getByTestId('tag-chip-frontend');
      fireEvent.click(tagBtn);

      // Strict intersection is empty -> 0 results everywhere
      expect(screen.getByTestId('report-stat-total').textContent).toContain('00:00:00');
      expect(screen.queryByText(/Alpha Task/i)).toBeNull();
      expect(screen.queryByText(/Beta Task/i)).toBeNull();
      expect(screen.queryByText(/Gamma Task/i)).toBeNull();
      expect(screen.queryByTestId('report-stat-top-project')).toBeNull();
    });

    it('5. All: restores all projects matching active tags', () => {
      render(
        <ReportView
          state={{
            ...multiProjectState,
            selectedProjectId: null, // All projects
          }}
        />
      );

      // Toggle 'frontend' tag (matches p1 Alpha 1h and p3 Gamma 3h)
      const tagBtn = screen.getByTestId('tag-chip-frontend');
      fireEvent.click(tagBtn);

      // Sum of p1 (1h) and p3 (3h) = 4h (04:00:00)
      expect(screen.getByTestId('report-stat-total').textContent).toContain('04:00:00');
      expect(screen.getAllByText(/Alpha Task/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Gamma Task/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Beta Task/i)).toBeNull();
    });

    it('6. Consistency across KPI, donut chart, activity chart, and export payload', async () => {
      render(
        <ReportView
          state={{
            ...multiProjectState,
            selectedProjectId: 'p1',
          }}
        />
      );

      // KPI
      expect(screen.getByTestId('report-stat-total').textContent).toContain('01:00:00');

      // Charts exist
      expect(screen.getByTestId('stacked-bar-activity-chart')).not.toBeNull();
      expect(screen.getByTestId('project-donut-chart')).not.toBeNull();
      expect(screen.getByTestId('clear-project-filter')).not.toBeNull();

      // Export modal payload consistency
      const exportBtn = screen.getByTestId('report-export-button');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByTestId('report-export-modal')).not.toBeNull();
      });
    });
  });

  describe('Integration: Sidebar ↔ Report Project Filter Synchronization', () => {
    const integrationState: GuiState = {
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

    function IntegrationHarness({ onStateChange }: { onStateChange?: (id: string | null) => void }) {
      const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);

      const handleSetSelectedProjectId = React.useCallback(
        (id: string | null) => {
          setSelectedProjectId(id);
          onStateChange?.(id);
        },
        [onStateChange]
      );

      const sharedState: GuiState = {
        ...integrationState,
        selectedProjectId,
        setSelectedProjectId: handleSetSelectedProjectId,
      };

      return (
        <MockProviders dataState={{ handleDeleteProject: vi.fn() }}>
          <div data-testid="integration-shell">
            <aside data-testid="sidebar-projects-container">
              {sharedState.projects.map((project) => (
                <SidebarProjectItem
                  key={project.id}
                  project={project}
                  isSelected={selectedProjectId === project.id}
                  onSelect={handleSetSelectedProjectId}
                  metrics={null}
                  activeLog={null}
                  totalSeconds={0}
                  locale="en"
                  customTranslations={{}}
                  isFirst={false}
                  isLast={false}
                  isEditingInline={false}
                  inlineEditName=""
                  taskCount={sharedState.tasks.filter((t) => t.projectId === project.id).length}
                  onEditDialog={vi.fn()}
                  onToggleArchive={vi.fn()}
                  onDeleteProject={vi.fn()}
                  onMoveUp={vi.fn()}
                  onMoveDown={vi.fn()}
                  onInlineNameChange={vi.fn()}
                  onCommitInlineRename={vi.fn()}
                  onCancelInlineRename={vi.fn()}
                />
              ))}
            </aside>
            <ReportView state={sharedState} />
          </div>
        </MockProviders>
      );
    }

    it('synchronizes project selection bidirectionally between sidebar and report using single shared state', () => {
      const stateChangeSpy = vi.fn();
      const { container } = render(<IntegrationHarness onStateChange={stateChangeSpy} />);

      // 1. Mount view with selectedProjectId = null
      expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('project-filter-p1').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getByTestId('project-filter-p2').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getAllByText(/"Alpha Task"/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/"Beta Task"/i).length).toBeGreaterThan(0);

      // 2. Select project A via sidebar control
      const sidebarItemA = container.querySelector('#project-item-p1');
      expect(sidebarItemA).not.toBeNull();
      fireEvent.click(sidebarItemA!);

      // 3. Verify state.selectedProjectId has value 'p1'
      expect(stateChangeSpy).toHaveBeenLastCalledWith('p1');

      // 4. Check that report shows data exclusively for project A
      expect(screen.getByTestId('project-filter-p1').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('project-filter-p2').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getAllByText(/"Alpha Task"/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/"Beta Task"/i)).toBeNull();

      // 5. Change project selection in report to B
      const reportFilterB = screen.getByTestId('project-filter-p2');
      fireEvent.click(reportFilterB);

      // 6. Verify shared state has value 'p2'
      expect(stateChangeSpy).toHaveBeenLastCalledWith('p2');

      // 7. Verify report shows data exclusively for project B
      expect(screen.getByTestId('project-filter-p2').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('project-filter-p1').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getAllByText(/"Beta Task"/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/"Alpha Task"/i)).toBeNull();

      // 8. Clear project selection in report
      const reportFilterAll = screen.getByTestId('project-filter-all');
      fireEvent.click(reportFilterAll);

      // 9. Verify state returned to null
      expect(stateChangeSpy).toHaveBeenLastCalledWith(null);
      expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('project-filter-p1').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getByTestId('project-filter-p2').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getAllByText(/"Alpha Task"/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/"Beta Task"/i).length).toBeGreaterThan(0);
    });
  });
});

