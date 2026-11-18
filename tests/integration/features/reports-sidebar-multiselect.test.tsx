// @vitest-environment jsdom
import React, { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FullLayoutBuilder from '@layouts/builders/FullLayoutBuilder';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import { getMockOXyFlowState, setupMatchMediaMock } from '@tests/shared/test-helpers';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { useReportProjectScope } from '@features/reports/hooks/useReportProjectScope';

const mockSharedProps = {
  isCompactExpanded: false,
  setIsCompactExpanded: vi.fn(),
  showToast: vi.fn(),
  handleMinimizeToTray: vi.fn(),
  setLayoutVariant: vi.fn(),
  currentProjectId: null,
  lastNonCompactVariant: 'full' as const,
  alwaysOnTopSmall: false,
  setAlwaysOnTopSmall: vi.fn(),
  dockPosition: 'right' as const,
  onToggleDock: vi.fn(),
};

describe('Given Reports is active in Full layout', () => {
  const projectA = aProject({ id: 'p1', name: 'Alpha Project', color: 'indigo' });
  const projectB = aProject({ id: 'p2', name: 'Beta Project', color: 'emerald' });
  const projectC = aProject({ id: 'p3', name: 'Gamma Project', color: 'rose' });
  const projects = [projectA, projectB, projectC];

  const taskA = aTask({ id: 't1', projectId: 'p1', name: 'Alpha Task' });
  const taskB = aTask({ id: 't2', projectId: 'p2', name: 'Beta Task' });
  const taskC = aTask({ id: 't3', projectId: 'p3', name: 'Gamma Task' });
  const tasks = [taskA, taskB, taskC];

  const logA = aTimeLog({
    id: 'l1',
    projectId: 'p1',
    taskId: 't1',
    startTime: '2026-06-15T09:00:00Z',
    endTime: '2026-06-15T10:00:00Z',
  });
  const logB = aTimeLog({
    id: 'l2',
    projectId: 'p2',
    taskId: 't2',
    startTime: '2026-06-15T11:00:00Z',
    endTime: '2026-06-15T13:00:00Z',
  });
  const logC = aTimeLog({
    id: 'l3',
    projectId: 'p3',
    taskId: 't3',
    startTime: '2026-06-15T14:00:00Z',
    endTime: '2026-06-15T17:00:00Z',
  });
  const logs = [logA, logB, logC];

  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function LayoutHarness({
    initialTab = 'reports',
    initialWorkingProject = 'p1',
    onWorkingProjectChange = vi.fn(),
  }: {
    initialTab?: 'reports' | 'tasks';
    initialWorkingProject?: string | null;
    onWorkingProjectChange?: (id: string | null) => void;
  }) {
    const mockState = getMockOXyFlowState();
    const scope = useReportProjectScope(projects);
    const [selectedProject, setSelectedProject] = useState<string | null>(initialWorkingProject);

    const handleSelectProject = (id: string | null) => {
      setSelectedProject(id);
      onWorkingProjectChange(id);
    };

    const stateProp = {
      ...mockState,
      projects,
      tasks,
      logs,
      nowIso: '2026-06-15T18:00:00Z',
      reportPeriod: 'all',
      reportSort: 'duration',
      setReportPeriod: vi.fn(),
      setReportSort: vi.fn(),
      activeLargeTab: initialTab,
      activeView: initialTab,
      selectedProjectId: selectedProject,
      setSelectedProjectId: handleSelectProject,
      ...scope,
    } as unknown as GuiState;

    return (
      <MockProviders state={{ ...mockState, projects }}>
        <FullLayoutBuilder state={stateProp} {...mockSharedProps} />
      </MockProviders>
    );
  }

  describe('When the user clicks two sidebar projects', () => {
    it('Then the report scope contains both and the cards reflect it', () => {
      // Given
      const onWorkingProjectChange = vi.fn();
      render(<LayoutHarness initialTab="reports" onWorkingProjectChange={onWorkingProjectChange} />);

      const totalStatCard = screen.getByTestId('report-stat-total');
      expect(totalStatCard.textContent).toContain('06:00:00');

      const projectRow1 = screen.getByTestId('sidebar-project-p1');
      const projectRow2 = screen.getByTestId('sidebar-project-p2');

      // When
      fireEvent.click(projectRow1);
      fireEvent.click(projectRow2);

      // Then
      expect(projectRow1.getAttribute('aria-pressed')).toBe('true');
      expect(projectRow2.getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('project-selected-check-p1')).toBeDefined();
      expect(screen.getByTestId('project-selected-check-p2')).toBeDefined();
      expect(screen.queryByTestId('project-selected-check-p3')).toBeNull();

      expect(totalStatCard.textContent).toContain('03:00:00');
      expect(onWorkingProjectChange).not.toHaveBeenCalled();
    });
  });

  describe('When clicking reset', () => {
    it('Then scope is all and cards reflect all projects', () => {
      // Given
      render(<LayoutHarness initialTab="reports" />);
      const projectRow1 = screen.getByTestId('sidebar-project-p1');
      const projectRow2 = screen.getByTestId('sidebar-project-p2');

      fireEvent.click(projectRow1);
      fireEvent.click(projectRow2);
      expect(screen.getByTestId('report-stat-total').textContent).toContain('03:00:00');

      // When
      const resetBtn = screen.getByTestId('sidebar-reset-scope');
      fireEvent.click(resetBtn);

      // Then
      expect(projectRow1.getAttribute('aria-pressed')).toBe('false');
      expect(projectRow2.getAttribute('aria-pressed')).toBe('false');
      expect(screen.queryByTestId('project-selected-check-p1')).toBeNull();
      expect(screen.queryByTestId('project-selected-check-p2')).toBeNull();
      expect(screen.getByTestId('report-stat-total').textContent).toContain('06:00:00');
    });
  });

  describe('When the user activates a sidebar project with keyboard', () => {
    it('Then Enter and Space keys toggle the project in report scope', () => {
      // Given
      render(<LayoutHarness initialTab="reports" />);
      const projectRow1 = screen.getByTestId('sidebar-project-p1');

      // When
      fireEvent.keyDown(projectRow1, { key: 'Enter' });

      // Then
      expect(projectRow1.getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('project-selected-check-p1')).toBeDefined();

      // When
      fireEvent.keyDown(projectRow1, { key: ' ' });

      // Then
      expect(projectRow1.getAttribute('aria-pressed')).toBe('false');
      expect(screen.queryByTestId('project-selected-check-p1')).toBeNull();
    });
  });
});

describe('Given Tasks is active in Full layout', () => {
  const projectA = aProject({ id: 'p1', name: 'Alpha Project', color: 'indigo' });
  const projectB = aProject({ id: 'p2', name: 'Beta Project', color: 'emerald' });
  const projects = [projectA, projectB];

  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('When the user clicks a sidebar project', () => {
    it('Then sidebar click selects the working project and does not change the report scope', () => {
      // Given
      const onWorkingProjectChange = vi.fn();
      const mockState = getMockOXyFlowState();

      function TasksHarness() {
        const scope = useReportProjectScope(projects);
        const [selectedProjectId, setSelectedProjectId] = useState<string | null>('p1');
        const handleSelect = (id: string | null) => {
          setSelectedProjectId(id);
          onWorkingProjectChange(id);
        };

        const stateProp = {
          ...mockState,
          projects,
          tasks: [],
          logs: [],
          nowIso: '2026-06-15T18:00:00Z',
          activeLargeTab: 'tasks',
          activeView: 'tasks',
          selectedProjectId,
          setSelectedProjectId: handleSelect,
          ...scope,
        } as unknown as GuiState;

        return (
          <MockProviders state={{ ...mockState, projects }}>
            <FullLayoutBuilder state={stateProp} {...mockSharedProps} />
          </MockProviders>
        );
      }

      render(<TasksHarness />);
      const projectRow2 = screen.getByTestId('sidebar-project-p2');

      // When
      fireEvent.click(projectRow2);

      // Then
      expect(onWorkingProjectChange).toHaveBeenCalledWith('p2');
      expect(screen.queryByTestId('project-selected-check-p2')).toBeNull();
      expect(projectRow2.getAttribute('aria-pressed')).toBeNull();
    });
  });
});
