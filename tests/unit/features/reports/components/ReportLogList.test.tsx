// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportLogList from '@features/reports/components/ReportLogList';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
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

  it('Given valid report data, When rendered, Then renders distribution and search input', () => {
    // Arrange & Act
    render(
      <MockProviders>
        <ReportLogList {...mockProps} />
      </MockProviders>
    );

    // Assert
    expect(screen.getByText(/"Task Alpha"/i)).not.toBeNull();
    expect(screen.getByText(/"Task Beta"/i)).not.toBeNull();
    expect(screen.getByTestId('report-logs-search-input')).not.toBeNull();
  });

  describe('Live Debounced Search Filtering', () => {
    it('should filter log entries by task name after debounce', async () => {
      // Arrange
      render(
        <MockProviders>
          <ReportLogList {...mockProps} debounceDelay={50} />
        </MockProviders>
      );

      // Act
      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'Beta' } });

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/"Task Alpha"/i)).toBeNull();
        expect(screen.getByText(/"Task Beta"/i)).not.toBeNull();
      });
    });

    it('should filter log entries by project name after debounce', async () => {
      // Arrange
      render(
        <MockProviders>
          <ReportLogList {...mockProps} debounceDelay={50} />
        </MockProviders>
      );

      // Act
      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'Proj Alpha' } });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/"Task Alpha"/i)).not.toBeNull();
        expect(screen.queryByText(/"Task Beta"/i)).toBeNull();
      });
    });

    it('should filter log entries by note content after debounce', async () => {
      // Arrange
      render(
        <MockProviders>
          <ReportLogList {...mockProps} debounceDelay={50} />
        </MockProviders>
      );

      // Act
      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'Client meeting' } });

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/"Task Alpha"/i)).toBeNull();
        expect(screen.getByText(/"Task Beta"/i)).not.toBeNull();
      });
    });

    it('should show empty state message when no logs match the query', async () => {
      // Arrange
      render(
        <MockProviders>
          <ReportLogList {...mockProps} debounceDelay={50} />
        </MockProviders>
      );

      // Act
      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'NonExistentString123' } });

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/"Task Alpha"/i)).toBeNull();
        expect(screen.queryByText(/"Task Beta"/i)).toBeNull();
        expect(screen.getByText(/No time logs match/i)).not.toBeNull();
      });
    });

    it('should debounce rapid keystrokes without intermediate renders', async () => {
      // Arrange
      render(
        <MockProviders>
          <ReportLogList {...mockProps} debounceDelay={150} />
        </MockProviders>
      );

      // Act
      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'Z' } });
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      // Assert - initially still displays Task Alpha before debounce triggers
      expect(screen.getByText(/"Task Alpha"/i)).not.toBeNull();

      await waitFor(() => {
        expect(screen.queryByText(/"Task Alpha"/i)).toBeNull();
      });
    });

    it('should keep search counter synchronized with debounced value instead of raw input', async () => {
      // Arrange
      render(
        <MockProviders>
          <ReportLogList {...mockProps} debounceDelay={150} />
        </MockProviders>
      );

      // Act
      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'Task Beta' } });

      // Before debounce delay expires: counter shows total without suffix because debouncedSearchQuery is still empty
      const dumpHeading = screen.getByRole('heading', { name: /PLAIN SQLITE LOGS DUMP/i });
      expect(dumpHeading.textContent).toContain('(4)');
      expect(dumpHeading.textContent).not.toContain('/ 4');

      // Assert - after debounce fires: counter updates to (1 / 4) matching filtered results
      await waitFor(() => {
        expect(dumpHeading.textContent).toContain('(1 / 4)');
      });
    });
  });

  describe('Safeguards for Active Timers and Patch Logs', () => {
    it('should disable edit and delete actions on active timer logs with safeguard title', () => {
      // Arrange & Act
      render(
        <MockProviders>
          <ReportLogList {...mockProps} activeTimerLogId="l-active" />
        </MockProviders>
      );

      // Assert
      const editBtn = screen.getByTestId('edit-log-l-active');
      const deleteBtn = screen.getByTestId('delete-log-l-active');

      expect(editBtn.getAttribute('disabled')).not.toBeNull();
      expect(deleteBtn.getAttribute('disabled')).not.toBeNull();
      expect(editBtn.getAttribute('title')).toContain('Cannot modify an active timer');
    });

    it('should not render edit or delete buttons for read-only PatchLog entries', () => {
      // Arrange & Act
      render(
        <MockProviders>
          <ReportLogList {...mockProps} />
        </MockProviders>
      );

      // Assert
      expect(screen.queryByTestId('edit-log-l-patch')).toBeNull();
      expect(screen.queryByTestId('delete-log-l-patch')).toBeNull();
      expect(screen.getByText(/Adjustment/i)).not.toBeNull();
    });
  });

  describe('Inline Edit Audit Flow', () => {
    it('should open ReportLogEditModal, require an audit reason, and delegate the edit to DataContext', async () => {
      // Arrange
      const handleEditTimeLogMock = vi.fn().mockResolvedValue({
        saved: true,
        synchronized: true,
      });
      const onLogUpdatedMock = vi.fn();

      render(
        <MockProviders dataState={{ handleEditTimeLog: handleEditTimeLogMock }}>
          <ReportLogList {...mockProps} onLogUpdated={onLogUpdatedMock} />
        </MockProviders>
      );

      // Act
      const editBtn = screen.getByTestId('edit-log-l1');
      fireEvent.click(editBtn);

      // Assert modal open
      expect(screen.getByRole('dialog')).not.toBeNull();
      expect(screen.getByText(/Edit Time Log \(Audit\)/i)).not.toBeNull();

      // Enter audit reason and save
      const reasonInput = screen.getByTestId('audit-edit-reason');
      fireEvent.change(reasonInput, { target: { value: 'Correcting start time per client request' } });

      const saveBtn = screen.getByTestId('audit-save-button');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(handleEditTimeLogMock).toHaveBeenCalledWith(
          'l1',
          't1',
          '2026-06-15T10:00:00.000Z',
          '2026-06-15T11:00:00.000Z',
          'Feature implementation notes',
          'Correcting start time per client request'
        );
      });
    });
  });

  describe('Delete Confirmation Flow', () => {
    it('should open ConfirmDialog and delegate delete operation to DataContext', async () => {
      // Arrange
      const handleDeleteTimeLogMock = vi.fn().mockResolvedValue(undefined);
      const onLogDeletedMock = vi.fn();

      render(
        <MockProviders dataState={{ handleDeleteTimeLog: handleDeleteTimeLogMock }}>
          <ReportLogList {...mockProps} onLogDeleted={onLogDeletedMock} />
        </MockProviders>
      );

      // Act
      const deleteBtn = screen.getByTestId('delete-log-l1');
      fireEvent.click(deleteBtn);

      // Assert confirmation dialog opened
      expect(screen.getByRole('alertdialog')).not.toBeNull();
      expect(screen.getByText(/Delete Time Log\?/i)).not.toBeNull();

      // Confirm deletion
      const confirmDeleteBtn = screen.getByTestId('confirm-dialog-confirm-btn');
      fireEvent.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(handleDeleteTimeLogMock).toHaveBeenCalledWith('l1');
        expect(onLogDeletedMock).toHaveBeenCalledWith('l1');
      });
    });
  });

  describe('Empty State', () => {
    it('should render empty state message when no logs exist in selected range', () => {
      // Arrange & Act
      render(
        <MockProviders>
          <ReportLogList
            {...mockProps}
            filteredLogs={[]}
            displayLogs={[]}
          />
        </MockProviders>
      );

      // Assert
      expect(screen.getByText(/No data in sqlite logs/i)).not.toBeNull();
    });
  });
});
