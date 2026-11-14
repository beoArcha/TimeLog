// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportView from '@features/reports/ReportView';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import { getMockOXyFlowState, setupMatchMediaMock } from '@tests/shared/test-helpers';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { useReportProjectScope } from '@features/reports/hooks/useReportProjectScope';

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
      const mockState = getMockOXyFlowState();
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
      const mockState = getMockOXyFlowState();

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
      const mockState = getMockOXyFlowState();
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

  describe('Given a report scope independent of the Tasks working project', () => {
    const projects = [
      aProject({ id: 'p1', name: 'Alpha Project', color: 'indigo' }),
      aProject({ id: 'p2', name: 'Beta Project', color: 'emerald' }),
      aProject({ id: 'p3', name: 'Gamma Project', color: 'rose' }),
    ];
    const tasks = [
      aTask({ id: 't1', projectId: 'p1', name: 'Alpha Task' }),
      aTask({ id: 't2', projectId: 'p2', name: 'Beta Task' }),
      aTask({ id: 't3', projectId: 'p3', name: 'Gamma Task' }),
    ];
    const logs = [
      aTimeLog({ id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-06-15T09:00:00Z', endTime: '2026-06-15T10:00:00Z' }),
      aTimeLog({ id: 'l2', projectId: 'p2', taskId: 't2', startTime: '2026-06-15T11:00:00Z', endTime: '2026-06-15T13:00:00Z' }),
      aTimeLog({ id: 'l3', projectId: 'p3', taskId: 't3', startTime: '2026-06-15T14:00:00Z', endTime: '2026-06-15T17:00:00Z' }),
    ];

    function ScopeHarness({ onWorkingProjectChange }: { onWorkingProjectChange: (id: string | null) => void }) {
      const mockState = getMockOXyFlowState();
      const scope = useReportProjectScope(projects);
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
        reportProjectIds: scope.reportProjectIds,
        toggleReportProject: scope.toggleReportProject,
        clearReportProjects: scope.clearReportProjects,
        selectedProjectId: 'p3',
        setSelectedProjectId: onWorkingProjectChange,
      } as unknown as GuiState;

      return (
        <MockProviders state={mockState}>
          <ReportView state={stateProp} />
        </MockProviders>
      );
    }

    describe('When the user selects two projects with the filter chips', () => {
      it('Then totals and logs cover both projects and the working project is untouched', () => {
        // Given
        const onWorkingProjectChange = vi.fn();
        render(<ScopeHarness onWorkingProjectChange={onWorkingProjectChange} />);
        expect(screen.getByTestId('report-stat-total').textContent).toContain('06:00:00');

        // When
        fireEvent.click(screen.getByTestId('project-filter-p1'));
        fireEvent.click(screen.getByTestId('project-filter-p2'));

        // Then
        expect(screen.getByTestId('project-filter-p1').getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByTestId('project-filter-p2').getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('false');
        expect(screen.getByTestId('report-stat-total').textContent).toContain('03:00:00');
        expect(screen.getAllByText(/"Alpha Task"/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/"Beta Task"/i).length).toBeGreaterThan(0);
        expect(screen.queryByText(/"Gamma Task"/i)).toBeNull();
        expect(onWorkingProjectChange).not.toHaveBeenCalled();
      });
    });

    describe('When the user clicks All after selecting projects', () => {
      it('Then every project is shown again and All is the only pressed chip', () => {
        // Given
        render(<ScopeHarness onWorkingProjectChange={vi.fn()} />);
        fireEvent.click(screen.getByTestId('project-filter-p1'));
        fireEvent.click(screen.getByTestId('project-filter-p2'));

        // When
        fireEvent.click(screen.getByTestId('project-filter-all'));

        // Then
        expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByTestId('project-filter-p1').getAttribute('aria-pressed')).toBe('false');
        expect(screen.getByTestId('project-filter-p2').getAttribute('aria-pressed')).toBe('false');
        expect(screen.getByTestId('report-stat-total').textContent).toContain('06:00:00');
        expect(screen.getAllByText(/"Gamma Task"/i).length).toBeGreaterThan(0);
      });
    });

    describe('When the only selected project is toggled off again', () => {
      it('Then the report shows all projects because an empty selection means All', () => {
        // Given
        render(<ScopeHarness onWorkingProjectChange={vi.fn()} />);
        fireEvent.click(screen.getByTestId('project-filter-p1'));
        expect(screen.getByTestId('report-stat-total').textContent).toContain('01:00:00');

        // When
        fireEvent.click(screen.getByTestId('project-filter-p1'));

        // Then
        expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByTestId('report-stat-total').textContent).toContain('06:00:00');
      });
    });
  });
});
