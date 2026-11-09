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

  it('opens ConfirmDialog on delete click without calling handleDeleteTimeLog immediately', async () => {
    const handleDeleteTimeLogMock = vi.fn().mockResolvedValue({ deleted: true, synchronized: true });
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleDeleteTimeLog: handleDeleteTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
        />
      </MockProviders>
    );

    const deleteBtn = screen.getByTestId('audit-delete-button');
    fireEvent.click(deleteBtn);

    expect(handleDeleteTimeLogMock).not.toHaveBeenCalled();
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).not.toBeNull();
    expect(screen.getByTestId('confirm-dialog-confirm-btn')).not.toBeNull();
    expect(screen.getByTestId('confirm-dialog-cancel-btn')).not.toBeNull();
  });

  it('closes ConfirmDialog and does not call handleDeleteTimeLog when cancelled', async () => {
    const handleDeleteTimeLogMock = vi.fn().mockResolvedValue({ deleted: true, synchronized: true });
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleDeleteTimeLog: handleDeleteTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('audit-delete-button'));
    expect(screen.getByRole('alertdialog')).not.toBeNull();

    fireEvent.click(screen.getByTestId('confirm-dialog-cancel-btn'));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
    expect(handleDeleteTimeLogMock).not.toHaveBeenCalled();
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it('calls handleDeleteTimeLog exactly once on confirmation and closes modal when deleted: true, synchronized: true', async () => {
    const handleDeleteTimeLogMock = vi.fn().mockResolvedValue({ deleted: true, synchronized: true });
    const onDeleteSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleDeleteTimeLog: handleDeleteTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
          onDeleteSuccess={onDeleteSuccessMock}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('audit-delete-button'));
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));

    await waitFor(() => {
      expect(handleDeleteTimeLogMock).toHaveBeenCalledTimes(1);
      expect(handleDeleteTimeLogMock).toHaveBeenCalledWith('log-1');
      expect(onDeleteSuccessMock).toHaveBeenCalledWith('log-1');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('prevents double-click / parallel submission while deletion is in progress', async () => {
    let resolveDelete!: (value: { deleted: boolean; synchronized: boolean }) => void;
    const deletePromise = new Promise<{ deleted: boolean; synchronized: boolean }>((res) => {
      resolveDelete = res;
    });
    const handleDeleteTimeLogMock = vi.fn().mockReturnValue(deletePromise);
    const onDeleteSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleDeleteTimeLog: handleDeleteTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
          onDeleteSuccess={onDeleteSuccessMock}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('audit-delete-button'));
    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');

    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);

    expect(handleDeleteTimeLogMock).toHaveBeenCalledTimes(1);

    resolveDelete({ deleted: true, synchronized: true });

    await waitFor(() => {
      expect(onDeleteSuccessMock).toHaveBeenCalledWith('log-1');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('keeps modal open with general error and does not call callback when deleted: false', async () => {
    const handleDeleteTimeLogMock = vi.fn().mockResolvedValue({ deleted: false, synchronized: false });
    const onDeleteSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleDeleteTimeLog: handleDeleteTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
          onDeleteSuccess={onDeleteSuccessMock}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('audit-delete-button'));
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));

    await waitFor(() => {
      expect(handleDeleteTimeLogMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('audit-general-error')).not.toBeNull();
      expect(onDeleteSuccessMock).not.toHaveBeenCalled();
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });

  it('does not retry delete and reflects deletion without error when deleted: true, synchronized: false', async () => {
    const handleDeleteTimeLogMock = vi.fn().mockResolvedValue({ deleted: true, synchronized: false });
    const onDeleteSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleDeleteTimeLog: handleDeleteTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
          onDeleteSuccess={onDeleteSuccessMock}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('audit-delete-button'));
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));

    await waitFor(() => {
      expect(handleDeleteTimeLogMock).toHaveBeenCalledTimes(1);
      expect(onDeleteSuccessMock).toHaveBeenCalledWith('log-1');
      expect(onCloseMock).toHaveBeenCalled();
      expect(screen.queryByTestId('audit-general-error')).toBeNull();
    });
  });

  it('does not invalidate successful deletion if callback throws or refreshData fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handleDeleteTimeLogMock = vi.fn().mockResolvedValue({ deleted: true, synchronized: true });
    const onDeleteSuccessMock = vi.fn().mockImplementation(() => {
      throw new Error('refreshData error');
    });
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleDeleteTimeLog: handleDeleteTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
          onDeleteSuccess={onDeleteSuccessMock}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('audit-delete-button'));
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));

    await waitFor(() => {
      expect(handleDeleteTimeLogMock).toHaveBeenCalledWith('log-1');
      expect(onDeleteSuccessMock).toHaveBeenCalledWith('log-1');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('supports onDeleted prop and calls it on successful deletion', async () => {
    const handleDeleteTimeLogMock = vi.fn().mockResolvedValue({ deleted: true, synchronized: true });
    const onDeletedMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <MockProviders dataState={{ handleDeleteTimeLog: handleDeleteTimeLogMock }}>
        <ReportLogEditModal
          isOpen={true}
          onClose={onCloseMock}
          log={mockLog}
          taskName="Task One"
          projectName="Project One"
          onDeleted={onDeletedMock}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('audit-delete-button'));
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));

    await waitFor(() => {
      expect(onDeletedMock).toHaveBeenCalledWith('log-1');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
