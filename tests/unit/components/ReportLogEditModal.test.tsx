// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportLogEditModal } from '@components/ReportLogEditModal';
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

    expect(refreshDataMock).not.toHaveBeenCalled();
  });

  it('should display audit reason error and mark field invalid when reason is empty', async () => {
    render(
      <MockProviders dataState={{ handleEditTimeLog: handleEditTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={vi.fn()}
          log={mockLog}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('audit-save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('audit-reason-error')).not.toBeNull();
      expect(screen.getByTestId('audit-edit-reason').getAttribute('aria-invalid')).toBe('true');
    });
    expect(handleEditTimeLogMock).not.toHaveBeenCalled();
  });

  it('should display range error and mark time inputs invalid when end time is before start time', async () => {
    render(
      <MockProviders dataState={{ handleEditTimeLog: handleEditTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={vi.fn()}
          log={mockLog}
        />
      </MockProviders>
    );

    fireEvent.change(screen.getByTestId('audit-edit-reason'), {
      target: { value: 'Valid correction reason' },
    });
    fireEvent.change(screen.getByTestId('audit-edit-end-time'), {
      target: { value: '2026-06-15T09:00:00Z' },
    });
    fireEvent.click(screen.getByTestId('audit-save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('audit-range-error')).not.toBeNull();
      expect(screen.getByTestId('audit-edit-start-time').getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByTestId('audit-edit-end-time').getAttribute('aria-invalid')).toBe('true');
    });
    expect(handleEditTimeLogMock).not.toHaveBeenCalled();
  });

  it('should handle engine ERR_AUDIT_REASON_REQUIRED and show inline error', async () => {
    handleEditTimeLogMock.mockRejectedValue({
      code: 'ERR_AUDIT_REASON_REQUIRED',
      message: 'Audit reason is required for manual edits',
    });
    const onSaveSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleEditTimeLog: handleEditTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          onSaveSuccess={onSaveSuccessMock}
        />
      </MockProviders>
    );

    fireEvent.change(screen.getByTestId('audit-edit-reason'), {
      target: { value: 'Some reason' },
    });
    fireEvent.click(screen.getByTestId('audit-save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('audit-reason-error')).not.toBeNull();
      expect(screen.getByTestId('audit-edit-reason').getAttribute('aria-invalid')).toBe('true');
    });
    expect(onSaveSuccessMock).not.toHaveBeenCalled();
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it('should handle engine ERR_TIMELOG_INVALID_RANGE and show inline range error', async () => {
    handleEditTimeLogMock.mockRejectedValue({
      code: 'ERR_TIMELOG_INVALID_RANGE',
      message: 'End time cannot be before start time',
    });
    const onSaveSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleEditTimeLog: handleEditTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          onSaveSuccess={onSaveSuccessMock}
        />
      </MockProviders>
    );

    fireEvent.change(screen.getByTestId('audit-edit-reason'), {
      target: { value: 'Some reason' },
    });
    fireEvent.click(screen.getByTestId('audit-save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('audit-range-error')).not.toBeNull();
      expect(screen.getByTestId('audit-edit-start-time').getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByTestId('audit-edit-end-time').getAttribute('aria-invalid')).toBe('true');
    });
    expect(onSaveSuccessMock).not.toHaveBeenCalled();
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it('should clear errors when typing and close on successful save', async () => {
    const onSaveSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleEditTimeLog: handleEditTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          onSaveSuccess={onSaveSuccessMock}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('audit-save-button'));
    await waitFor(() => {
      expect(screen.getByTestId('audit-reason-error')).not.toBeNull();
    });

    fireEvent.change(screen.getByTestId('audit-edit-reason'), {
      target: { value: 'Valid correction reason' },
    });
    expect(screen.queryByTestId('audit-reason-error')).toBeNull();
    expect(screen.getByTestId('audit-edit-reason').getAttribute('aria-invalid')).toBeNull();

    fireEvent.click(screen.getByTestId('audit-save-button'));
    await waitFor(() => {
      expect(onSaveSuccessMock).toHaveBeenCalledWith('log-1');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('should retry synchronization without repeating a committed audit mutation', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const refreshDataMock = vi.fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
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
      expect(screen.getByTestId('audit-general-error')).not.toBeNull();
      expect(onSaveSuccessMock).not.toHaveBeenCalled();
      expect(onCloseMock).not.toHaveBeenCalled();
    });

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
  });

  it('should display a safe error and keep the modal open when the edit mutation fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
      expect(screen.getByTestId('audit-general-error')).not.toBeNull();
      expect(screen.queryByText(/sqlite3_step|Database row locked/i)).toBeNull();
    });

    expect(handleEditTimeLogMock).toHaveBeenCalledTimes(1);
    expect(onSaveSuccessMock).not.toHaveBeenCalled();
    expect(onCloseMock).not.toHaveBeenCalled();
  });
});
