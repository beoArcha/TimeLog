// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportLogEditModal from '@features/reports/components/ReportLogEditModal';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
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

  let handleEditTimeLogMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handleEditTimeLogMock = vi.fn().mockResolvedValue({ saved: true, synchronized: true });
  });

  it('should save through DataContext and close after state synchronization', async () => {
    const refreshDataMock = vi.fn().mockResolvedValue(undefined);
    const onSaveSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleEditTimeLog: handleEditTimeLogMock, refreshData: refreshDataMock }}>
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

    fireEvent.change(screen.getByTestId('audit-edit-reason'), {
      target: { value: 'Extended meeting with customer' },
    });
    fireEvent.click(screen.getByTestId('audit-save-button'));

    await waitFor(() => {
      expect(handleEditTimeLogMock).toHaveBeenCalledWith(
        'log-1',
        'task-1',
        '2026-06-15T10:00:00Z',
        '2026-06-15T11:00:00Z',
        'Initial note',
        'Extended meeting with customer'
      );
      expect(onSaveSuccessMock).toHaveBeenCalledWith('log-1');
      expect(onCloseMock).toHaveBeenCalled();
    });

    // handleEditTimeLog owns repository synchronization; the modal must not refresh twice.
    expect(refreshDataMock).not.toHaveBeenCalled();
  });

  it('should retry synchronization without repeating a committed audit mutation', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const refreshDataMock = vi.fn()
      .mockRejectedValueOnce(new Error('Network disconnected on refresh'))
      .mockResolvedValueOnce(undefined);
    const onSaveSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    handleEditTimeLogMock.mockResolvedValueOnce({ saved: true, synchronized: false });

    render(
      <MockProviders dataState={{ handleEditTimeLog: handleEditTimeLogMock, refreshData: refreshDataMock }}>
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

    fireEvent.change(screen.getByTestId('audit-edit-reason'), {
      target: { value: 'Valid correction reason' },
    });
    const saveButton = screen.getByTestId('audit-save-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleEditTimeLogMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Error|Błąd/i)).not.toBeNull();
      expect(onSaveSuccessMock).not.toHaveBeenCalled();
      expect(onCloseMock).not.toHaveBeenCalled();
    });

    // The retry path only refreshes state. A failed refresh can be retried again
    // without issuing a second edit/audit mutation.
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(refreshDataMock).toHaveBeenCalledTimes(1);
      expect(handleEditTimeLogMock).toHaveBeenCalledTimes(1);
      expect(onSaveSuccessMock).not.toHaveBeenCalled();
      expect(onCloseMock).not.toHaveBeenCalled();
    });

    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(refreshDataMock).toHaveBeenCalledTimes(2);
      expect(handleEditTimeLogMock).toHaveBeenCalledTimes(1);
      expect(onSaveSuccessMock).toHaveBeenCalledWith('log-1');
      expect(onCloseMock).toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ReportLogEditModal] Refresh after edit failed:'),
      expect.any(Error)
    );
  });

  it('should display a safe error and keep the modal open when the edit mutation fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    handleEditTimeLogMock.mockRejectedValue(
      new Error('Database row locked: sqlite3_step constraint failed')
    );
    const onSaveSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleEditTimeLog: handleEditTimeLogMock }}>
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

    fireEvent.change(screen.getByTestId('audit-edit-reason'), {
      target: { value: 'Valid correction reason' },
    });
    fireEvent.click(screen.getByTestId('audit-save-button'));

    await waitFor(() => {
      expect(screen.getByText(/Error|Błąd/i)).not.toBeNull();
      expect(screen.queryByText(/sqlite3_step|Database row locked/i)).toBeNull();
    });

    expect(handleEditTimeLogMock).toHaveBeenCalledTimes(1);
    expect(onSaveSuccessMock).not.toHaveBeenCalled();
    expect(onCloseMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ReportLogEditModal] Mutation failed:'),
      expect.any(Error)
    );
  });

  it('should validate invalid start and end times without triggering the DataContext handler', async () => {
    render(
      <MockProviders dataState={{ handleEditTimeLog: handleEditTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={vi.fn()}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
        />
      </MockProviders>
    );

    fireEvent.change(screen.getByTestId('audit-edit-start-time'), {
      target: { value: 'not-a-valid-date' },
    });
    fireEvent.change(screen.getByTestId('audit-edit-reason'), {
      target: { value: 'Some valid reason' },
    });
    fireEvent.click(screen.getByTestId('audit-save-button'));

    await waitFor(() => {
      expect(screen.getByText(/Error|Błąd/i)).not.toBeNull();
    });
    expect(handleEditTimeLogMock).not.toHaveBeenCalled();
  });

  it('should require an audit reason before enabling save', () => {
    render(
      <MockProviders dataState={{ handleEditTimeLog: handleEditTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={vi.fn()}
          log={mockLog}
        />
      </MockProviders>
    );

    expect(screen.getByTestId('audit-save-button').getAttribute('disabled')).not.toBeNull();
    expect(handleEditTimeLogMock).not.toHaveBeenCalled();
  });
});
