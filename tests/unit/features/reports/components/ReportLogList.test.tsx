// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportLogList from '@features/reports/components/ReportLogList';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { EngineRouter } from '@common/engine/EngineRouter';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';

describe('Unit Tests: ReportLogList', () => {
  afterEach(() => {
    cleanup();
  });
  const mockProjects = [
    { id: 'p1', name: 'Proj Alpha', color: 'indigo', createdAt: '2026-06-15' },
    { id: 'p2', name: 'Proj Beta', color: 'orange', createdAt: '2026-06-15' },
  ];

  const mockTasks = [
    { id: 't1', projectId: 'p1', name: 'Task Alpha', completed: false, createdAt: '2026-06-15' },
    { id: 't2', projectId: 'p2', name: 'Task Beta', completed: false, createdAt: '2026-06-15' },
    { id: 't3', projectId: 'p1', name: 'Task Gamma', completed: false, createdAt: '2026-06-15' },
    { id: 't4', projectId: 'p1', name: 'Task Delta', completed: false, createdAt: '2026-06-15' },
  ];

  const mockSourceLogs = [
    {
      id: 'l1',
      taskId: 't1',
      projectId: 'p1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
      note: 'Feature implementation notes',
    },
    {
      id: 'l2',
      taskId: 't2',
      projectId: 'p2',
      startTime: '2026-06-15T12:00:00Z',
      endTime: '2026-06-15T13:00:00Z',
      note: 'Client meeting discussion',
    },
    {
      id: 'l-active',
      taskId: 't3',
      projectId: 'p1',
      startTime: '2026-06-15T14:00:00Z',
      endTime: undefined,
      note: 'Running ongoing work',
    },
  ];

  const mockDisplayLogs: Array<ClampedTimeLog | typeof mockSourceLogs[0]> = [
    mockSourceLogs[0],
    mockSourceLogs[1],
    mockSourceLogs[2],
    {
      id: 'l-patch',
      taskId: 't4',
      projectId: 'p1',
      startTime: '2026-06-15T09:00:00Z',
      endTime: '2026-06-15T09:30:00Z',
      originalDurationSeconds: 1800,
      clampedDurationSeconds: 1800,
      isMultiDaySegment: false,
      clampedStartTime: '2026-06-15T09:00:00Z',
      clampedEndTime: '2026-06-15T09:30:00Z',
      note: 'Manual adjustment',
      isPatch: true,
    },
  ];

  const mockProps = {
    filteredLogs: mockSourceLogs,
    projectChart: [
      { id: 'p1', name: 'Proj Alpha', color: 'indigo', seconds: 3600, tasks: [] },
      { id: 'p2', name: 'Proj Beta', color: 'orange', seconds: 3600, tasks: [] },
    ],
    maxSec: 3600,
    displayLogs: mockDisplayLogs,
    projects: mockProjects,
    tasks: mockTasks,
    nowIso: '2026-06-15T15:00:00Z',
    logs: mockSourceLogs,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render log list items, project distribution, and search input', () => {
    render(
      <MockProviders>
        <ReportLogList {...mockProps} />
      </MockProviders>
    );

    expect(screen.getByText(/"Task Alpha"/i)).not.toBeNull();
    expect(screen.getByText(/"Task Beta"/i)).not.toBeNull();
    expect(screen.getByTestId('report-logs-search-input')).not.toBeNull();
  });

  describe('Live Text Search Filtering', () => {
    it('should filter log entries by task name', () => {
      render(
        <MockProviders>
          <ReportLogList {...mockProps} />
        </MockProviders>
      );

      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'Beta' } });

      expect(screen.queryByText(/"Task Alpha"/i)).toBeNull();
      expect(screen.getByText(/"Task Beta"/i)).not.toBeNull();
    });

    it('should filter log entries by project name', () => {
      render(
        <MockProviders>
          <ReportLogList {...mockProps} />
        </MockProviders>
      );

      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'Proj Alpha' } });

      expect(screen.getByText(/"Task Alpha"/i)).not.toBeNull();
      expect(screen.queryByText(/"Task Beta"/i)).toBeNull();
    });

    it('should filter log entries by note content', () => {
      render(
        <MockProviders>
          <ReportLogList {...mockProps} />
        </MockProviders>
      );

      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'Client meeting' } });

      expect(screen.queryByText(/"Task Alpha"/i)).toBeNull();
      expect(screen.getByText(/"Task Beta"/i)).not.toBeNull();
    });

    it('should show empty state message when no logs match the query', () => {
      render(
        <MockProviders>
          <ReportLogList {...mockProps} />
        </MockProviders>
      );

      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'NonExistentString123' } });

      expect(screen.queryByText(/"Task Alpha"/i)).toBeNull();
      expect(screen.queryByText(/"Task Beta"/i)).toBeNull();
      expect(screen.getByText(/No time logs match/i)).not.toBeNull();
    });
  });

  describe('Safeguards for Active Timers and Patch Logs', () => {
    it('should disable edit and delete actions on active timer logs with safeguard title', () => {
      render(
        <MockProviders>
          <ReportLogList {...mockProps} activeTimerLogId="l-active" />
        </MockProviders>
      );

      const editBtn = screen.getByTestId('edit-log-l-active');
      const deleteBtn = screen.getByTestId('delete-log-l-active');

      expect(editBtn.getAttribute('disabled')).not.toBeNull();
      expect(deleteBtn.getAttribute('disabled')).not.toBeNull();
      expect(editBtn.getAttribute('title')).toContain('Cannot modify an active timer');
    });

    it('should not render edit or delete buttons for read-only PatchLog entries', () => {
      render(
        <MockProviders>
          <ReportLogList {...mockProps} />
        </MockProviders>
      );

      expect(screen.queryByTestId('edit-log-l-patch')).toBeNull();
      expect(screen.queryByTestId('delete-log-l-patch')).toBeNull();
      expect(screen.getByText(/Adjustment/i)).not.toBeNull();
    });
  });

  describe('Inline Edit Audit Flow', () => {
    it('should open ReportLogEditModal and require audit reason to edit log', async () => {
      const editSpy = vi.spyOn(EngineRouter.getInstance().timeLogs, 'editTimeLog').mockResolvedValue(undefined);

      render(
        <MockProviders>
          <ReportLogList {...mockProps} />
        </MockProviders>
      );

      const editBtn = screen.getByTestId('edit-log-l1');
      fireEvent.click(editBtn);

      expect(screen.getByTestId('audit-edit-start-time')).not.toBeNull();
      expect(screen.getByTestId('audit-edit-reason')).not.toBeNull();

      const saveBtn = screen.getByTestId('audit-save-button');
      expect(saveBtn.getAttribute('disabled')).not.toBeNull();

      const reasonInput = screen.getByTestId('audit-edit-reason');
      fireEvent.change(reasonInput, { target: { value: 'Corrected duration for client review' } });

      expect(saveBtn.getAttribute('disabled')).toBeNull();

      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(editSpy).toHaveBeenCalledWith(
          'l1',
          't1',
          '2026-06-15T10:00:00Z',
          '2026-06-15T11:00:00Z',
          'Feature implementation notes',
          'Corrected duration for client review'
        );
      });
    });
  });

  describe('Inline Delete Confirmation Flow', () => {
    it('should open ConfirmDialog and execute delete when confirmed', async () => {
      const handleDeleteMock = vi.fn().mockResolvedValue(undefined);
      const onLogDeletedMock = vi.fn();

      render(
        <MockProviders dataState={{ handleDeleteTimeLog: handleDeleteMock }}>
          <ReportLogList {...mockProps} onLogDeleted={onLogDeletedMock} />
        </MockProviders>
      );

      const deleteBtn = screen.getByTestId('delete-log-l1');
      fireEvent.click(deleteBtn);

      expect(screen.getByText(/Delete Time Log\?/i)).not.toBeNull();

      const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(handleDeleteMock).toHaveBeenCalledWith('l1');
        expect(onLogDeletedMock).toHaveBeenCalledWith('l1');
      });
    });
  });
});
