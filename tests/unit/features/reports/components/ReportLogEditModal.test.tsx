// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportLogEditModal from '@features/reports/components/ReportLogEditModal';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { EngineRouter } from '@common/engine/EngineRouter';
import { TimeLog } from '@bindings/TimeLog';

describe('Unit Tests: ReportLogEditModal', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockLog: TimeLog = {
    id: 'log-1',
    taskId: 'task-1',
    projectId: 'proj-1',
    startTime: '2026-06-15T10:00:00Z',
    endTime: '2026-06-15T11:00:00Z',
    note: 'Initial note',
    editHistory: undefined,
  };

  let editTimeLogMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    editTimeLogMock = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(EngineRouter, 'getInstance').mockReturnValue({
      timeLogs: {
        editTimeLog: editTimeLogMock,
      },
    } as unknown as EngineRouter);
  });

  it('should save edit successfully, call refreshData, and close modal', async () => {
    const refreshDataMock = vi.fn().mockResolvedValue(undefined);
    const onSaveSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ refreshData: refreshDataMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
          onSaveSuccess={onSaveSuccessMock}
        />
      </MockProviders>
    );

    const reasonInput = screen.getByTestId('audit-edit-reason');
    fireEvent.change(reasonInput, { target: { value: 'Extended meeting with customer' } });

    const saveBtn = screen.getByTestId('audit-save-button');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(editTimeLogMock).toHaveBeenCalledWith(
        'log-1',
        'task-1',
        '2026-06-15T10:00:00Z',
        '2026-06-15T11:00:00Z',
        'Initial note',
        'Extended meeting with customer'
      );
      expect(refreshDataMock).toHaveBeenCalled();
      expect(onSaveSuccessMock).toHaveBeenCalledWith('log-1');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('should display safe error message, log refresh failure, and not close or call onSaveSuccess when refreshData fails, allowing retry', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const refreshDataMock = vi.fn().mockRejectedValueOnce(new Error('Network disconnected on refresh'));
    const onSaveSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ refreshData: refreshDataMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
          onSaveSuccess={onSaveSuccessMock}
        />
      </MockProviders>
    );

    const reasonInput = screen.getByTestId('audit-edit-reason');
    fireEvent.change(reasonInput, { target: { value: 'Valid correction reason' } });

    const saveBtn = screen.getByTestId('audit-save-button');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      // Edit mutation was executed and succeeded
      expect(editTimeLogMock).toHaveBeenCalledTimes(1);
      // refreshData was attempted and rejected
      expect(refreshDataMock).toHaveBeenCalledTimes(1);
      // Success handler and close must NOT be invoked on refresh failure
      expect(onSaveSuccessMock).not.toHaveBeenCalled();
      expect(onCloseMock).not.toHaveBeenCalled();
      // Safe error message is displayed to the user
      expect(screen.getByText(/Error|Błąd/i)).not.toBeNull();
      // Raw error message must not be shown
      expect(screen.queryByText('Network disconnected on refresh')).toBeNull();
    });

    // Refresh error is logged to console with operational context
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ReportLogEditModal] Refresh after edit failed:'),
      expect.any(Error)
    );

    // Modal is not in a hanging state - retry refreshData when save button is clicked again
    refreshDataMock.mockResolvedValueOnce(undefined);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      // editTimeLog should NOT be re-called since mutation already succeeded
      expect(editTimeLogMock).toHaveBeenCalledTimes(1);
      expect(refreshDataMock).toHaveBeenCalledTimes(2);
      expect(onSaveSuccessMock).toHaveBeenCalledWith('log-1');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('should display safe error message without exposing raw database/IPC error when editTimeLog mutation fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    editTimeLogMock.mockRejectedValue(new Error('Database row locked: sqlite3_step constraint failed'));
    const onSaveSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
          onSaveSuccess={onSaveSuccessMock}
        />
      </MockProviders>
    );

    const reasonInput = screen.getByTestId('audit-edit-reason');
    fireEvent.change(reasonInput, { target: { value: 'Valid correction reason' } });

    const saveBtn = screen.getByTestId('audit-save-button');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      // Shows safe localized generic error message
      expect(screen.getByText(/Error|Błąd/i)).not.toBeNull();
      // Must NOT leak internal SQLite / IPC error details to UI
      expect(screen.queryByText(/sqlite3_step|Database row locked/i)).toBeNull();
    });

    expect(onSaveSuccessMock).not.toHaveBeenCalled();
    expect(onCloseMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ReportLogEditModal] Mutation failed:'),
      expect.any(Error)
    );
  });

  it('should validate invalid start and end times without triggering editTimeLog', async () => {
    const onCloseMock = vi.fn();

    render(
      <MockProviders>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
        />
      </MockProviders>
    );

    // Provide invalid start time
    const startInput = screen.getByTestId('audit-edit-start-time');
    fireEvent.change(startInput, { target: { value: 'not-a-valid-date' } });

    const reasonInput = screen.getByTestId('audit-edit-reason');
    fireEvent.change(reasonInput, { target: { value: 'Some valid reason' } });

    const saveBtn = screen.getByTestId('audit-save-button');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Error|Błąd/i)).not.toBeNull();
    });
    expect(editTimeLogMock).not.toHaveBeenCalled();
  });
});
