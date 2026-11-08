// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportLogList from '@features/reports/components/ReportLogList';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

describe('Unit & Integration Tests: ReportLogList Hierarchical Grouping & Collapsible Sections', () => {
  afterEach(() => {
    cleanup();
  });

  const mockProjects: Project[] = [
    {
      id: 'proj-alpha',
      name: 'Alpha Project',
      color: 'indigo',
      createdAt: '2026-06-15T00:00:00Z',
      tags: ['fintech', 'priority'],
    },
    {
      id: 'proj-beta',
      name: 'Beta Project',
      color: 'emerald',
      createdAt: '2026-06-15T00:00:00Z',
      tags: ['internal'],
    },
  ];

  const mockTasks: Task[] = [
    {
      id: 'task-root-1',
      projectId: 'proj-alpha',
      name: 'Authentication Module',
      completed: false,
      createdAt: '2026-06-15T00:00:00Z',
    },
    {
      id: 'subtask-1-1',
      projectId: 'proj-alpha',
      parentTaskId: 'task-root-1',
      name: 'OAuth2 Handshake',
      completed: false,
      createdAt: '2026-06-15T00:00:00Z',
    },
    {
      id: 'subtask-1-2',
      projectId: 'proj-alpha',
      parentTaskId: 'task-root-1',
      name: 'JWT Session Validation',
      completed: false,
      createdAt: '2026-06-15T00:00:00Z',
    },
    {
      id: 'task-root-2',
      projectId: 'proj-alpha',
      name: 'Database Migration',
      completed: false,
      createdAt: '2026-06-15T00:00:00Z',
    },
    {
      id: 'task-beta-1',
      projectId: 'proj-beta',
      name: 'API Documentation',
      completed: false,
      createdAt: '2026-06-15T00:00:00Z',
    },
  ];

  const mockLogs: TimeLog[] = [
    // Project Alpha -> Task 1 (direct log): 1 hour (3600s)
    {
      id: 'log-1',
      projectId: 'proj-alpha',
      taskId: 'task-root-1',
      startTime: '2026-06-15T08:00:00Z',
      endTime: '2026-06-15T09:00:00Z',
      note: 'Initial auth review',
    },
    // Project Alpha -> Task 1 -> Subtask 1-1: 30 minutes (1800s)
    {
      id: 'log-2',
      projectId: 'proj-alpha',
      taskId: 'subtask-1-1',
      startTime: '2026-06-15T09:00:00Z',
      endTime: '2026-06-15T09:30:00Z',
      note: 'Implemented redirect URI',
    },
    // Project Alpha -> Task 1 -> Subtask 1-2: 45 minutes (2700s)
    // -> Task 1 Total = 3600 + 1800 + 2700 = 8100s (02:15:00)
    {
      id: 'log-3',
      projectId: 'proj-alpha',
      taskId: 'subtask-1-2',
      startTime: '2026-06-15T09:30:00Z',
      endTime: '2026-06-15T10:15:00Z',
      note: 'Cookie claims check',
    },
    // Project Alpha -> Task 2 (no subtasks): 45 minutes (2700s)
    // -> Project Alpha Total = 8100 + 2700 = 10800s (03:00:00)
    {
      id: 'log-4',
      projectId: 'proj-alpha',
      taskId: 'task-root-2',
      startTime: '2026-06-15T11:00:00Z',
      endTime: '2026-06-15T11:45:00Z',
      note: 'Executed schema diff',
    },
    // Project Beta -> Task Beta 1 (no subtasks): 15 minutes (900s) (00:15:00)
    {
      id: 'log-5',
      projectId: 'proj-beta',
      taskId: 'task-beta-1',
      startTime: '2026-06-15T13:00:00Z',
      endTime: '2026-06-15T13:15:00Z',
      note: 'Updated Swagger markdown',
    },
  ];

  const defaultProps = {
    filteredLogs: mockLogs,
    projectChart: [
      { id: 'proj-alpha', name: 'Alpha Project', color: 'indigo', seconds: 10800, tasks: [] },
      { id: 'proj-beta', name: 'Beta Project', color: 'emerald', seconds: 900, tasks: [] },
    ],
    maxSec: 10800,
    displayLogs: mockLogs,
    projects: mockProjects,
    tasks: mockTasks,
    nowIso: '2026-06-15T15:00:00Z',
    logs: mockLogs,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hierarchical Tree Rendering & Tags', () => {
    it('should render distinct project sections with project names and tag badges', () => {
      render(
        <MockProviders>
          <ReportLogList {...defaultProps} />
        </MockProviders>
      );

      // Verify Project Alpha Section
      const alphaSection = screen.getByTestId('report-project-section-proj-alpha');
      expect(alphaSection).not.toBeNull();
      expect(within(alphaSection).getByText('Alpha Project')).not.toBeNull();
      expect(screen.getByText('#fintech')).not.toBeNull();
      expect(screen.getByText('#priority')).not.toBeNull();

      // Verify Project Beta Section
      const betaSection = screen.getByTestId('report-project-section-proj-beta');
      expect(betaSection).not.toBeNull();
      expect(within(betaSection).getByText('Beta Project')).not.toBeNull();
      expect(screen.getByText('#internal')).not.toBeNull();
    });

    it('should render tasks and subtasks hierarchically under projects', () => {
      render(
        <MockProviders>
          <ReportLogList {...defaultProps} />
        </MockProviders>
      );

      // Tasks under Project Alpha
      expect(screen.getByTestId('report-task-section-task-root-1')).not.toBeNull();
      expect(screen.getByTestId('report-task-section-task-root-2')).not.toBeNull();

      // Subtasks under Task 1
      expect(screen.getByTestId('report-subtask-section-subtask-1-1')).not.toBeNull();
      expect(screen.getByTestId('report-subtask-section-subtask-1-2')).not.toBeNull();
      expect(screen.getByText('OAuth2 Handshake')).not.toBeNull();
      expect(screen.getByText('JWT Session Validation')).not.toBeNull();
    });
  });

  describe('Duration Sum Conformance Across Hierarchy', () => {
    it('should display duration sums in headers strictly conforming to child logs', () => {
      render(
        <MockProviders>
          <ReportLogList {...defaultProps} />
        </MockProviders>
      );

      // Subtask 1-1: 1800s -> 00:30:00
      const sub1Duration = screen.getByTestId('report-subtask-duration-subtask-1-1');
      expect(sub1Duration.textContent).toBe('00:30:00');

      // Subtask 1-2: 2700s -> 00:45:00
      const sub2Duration = screen.getByTestId('report-subtask-duration-subtask-1-2');
      expect(sub2Duration.textContent).toBe('00:45:00');

      // Task 1: 3600 (direct) + 1800 + 2700 = 8100s -> 02:15:00
      const task1Duration = screen.getByTestId('report-task-duration-task-root-1');
      expect(task1Duration.textContent).toBe('02:15:00');

      // Task 2: 2700s -> 00:45:00
      const task2Duration = screen.getByTestId('report-task-duration-task-root-2');
      expect(task2Duration.textContent).toBe('00:45:00');

      // Project Alpha total: 8100 + 2700 = 10800s -> 03:00:00
      const alphaProjectDuration = screen.getByTestId('report-project-duration-proj-alpha');
      expect(alphaProjectDuration.textContent).toBe('03:00:00');

      // Project Beta total: 900s -> 00:15:00
      const betaProjectDuration = screen.getByTestId('report-project-duration-proj-beta');
      expect(betaProjectDuration.textContent).toBe('00:15:00');
    });
  });

  describe('Collapsible Interaction Behavior', () => {
    it('should allow collapsing and expanding a project section', () => {
      render(
        <MockProviders>
          <ReportLogList {...defaultProps} />
        </MockProviders>
      );

      const alphaToggle = screen.getByTestId('report-project-toggle-proj-alpha');
      expect(alphaToggle).not.toBeNull();
      expect(alphaToggle.getAttribute('aria-expanded')).toBe('true');

      // Project alpha starts open
      const alphaSection = screen.getByTestId('report-project-section-proj-alpha');
      const contentPanel = alphaSection.querySelector('[data-slot="collapsible-content"]');
      expect(contentPanel).not.toBeNull();
      expect(contentPanel?.classList.contains('hidden')).toBe(false);

      // Click toggle to collapse
      fireEvent.click(alphaToggle);
      expect(alphaToggle.getAttribute('aria-expanded')).toBe('false');
      expect(contentPanel?.classList.contains('hidden')).toBe(true);

      // Click toggle again to expand
      fireEvent.click(alphaToggle);
      expect(alphaToggle.getAttribute('aria-expanded')).toBe('true');
      expect(contentPanel?.classList.contains('hidden')).toBe(false);
    });

    it('should allow collapsing and expanding a task with subtasks', () => {
      render(
        <MockProviders>
          <ReportLogList {...defaultProps} />
        </MockProviders>
      );

      const taskToggle = screen.getByTestId('report-task-toggle-task-root-1');
      expect(taskToggle).not.toBeNull();
      expect(taskToggle.getAttribute('aria-expanded')).toBe('true');

      const taskSection = screen.getByTestId('report-task-section-task-root-1');
      const taskContentPanel = taskSection.querySelector('[data-slot="collapsible-content"]');
      expect(taskContentPanel).not.toBeNull();
      expect(taskContentPanel?.classList.contains('hidden')).toBe(false);

      // Click toggle to collapse task
      fireEvent.click(taskToggle);
      expect(taskToggle.getAttribute('aria-expanded')).toBe('false');
      expect(taskContentPanel?.classList.contains('hidden')).toBe(true);

      // Click toggle to re-expand
      fireEvent.click(taskToggle);
      expect(taskToggle.getAttribute('aria-expanded')).toBe('true');
      expect(taskContentPanel?.classList.contains('hidden')).toBe(false);
    });

    it('should directly render logs for tasks without subtasks without extra collapsible layer', () => {
      render(
        <MockProviders>
          <ReportLogList {...defaultProps} />
        </MockProviders>
      );

      // Task 2 has no subtasks
      expect(screen.queryByTestId('report-task-toggle-task-root-2')).toBeNull();
      const task2Section = screen.getByTestId('report-task-section-task-root-2');
      expect(task2Section).not.toBeNull();
      expect(task2Section.textContent).toContain('Database Migration');
      expect(task2Section.textContent).toContain('00:45:00');
    });
  });

  describe('Filter Harmony', () => {
    it('should only render filtered project and tasks when subset is provided', () => {
      // Simulating filtered subset from E1 (only proj-beta logs)
      const betaOnlyLogs = mockLogs.filter((l) => l.projectId === 'proj-beta');

      render(
        <MockProviders>
          <ReportLogList
            {...defaultProps}
            filteredLogs={betaOnlyLogs}
            displayLogs={betaOnlyLogs}
          />
        </MockProviders>
      );

      // Project Alpha should not be in the hierarchy because it has no logs in the filtered set
      expect(screen.queryByTestId('report-project-section-proj-alpha')).toBeNull();

      // Project Beta should be rendered
      const betaSection = screen.getByTestId('report-project-section-proj-beta');
      expect(betaSection).not.toBeNull();
      expect(screen.getByTestId('report-project-duration-proj-beta').textContent).toBe('00:15:00');
    });
  });
});
