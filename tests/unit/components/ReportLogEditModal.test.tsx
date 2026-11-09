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
        '2026-06-15T10:00:00.000Z',
        '2026-06-15T11:00:00.000Z',
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

  describe('Timezone-aware Presentation and Conversion', () => {
    it('should format input fields in the user resolved timezone (Europe/Warsaw vs America/New_York)', () => {
      // 1. Europe/Warsaw (+2h in summer)
      const { unmount } = render(
        <MockProviders
          settingsState={{ timezone: 'Europe/Warsaw', resolvedTimezone: 'Europe/Warsaw' }}
        >
          <ReportLogEditModal
            isOpen={true}
            onClose={vi.fn()}
            log={mockLog}
            taskName="Task One"
            projectName="Project One"
          />
        </MockProviders>
      );

      const startInputWarsaw = screen.getByTestId('audit-edit-start-time') as HTMLInputElement;
      const endInputWarsaw = screen.getByTestId('audit-edit-end-time') as HTMLInputElement;
      const tzBadgeWarsaw = screen.getByTestId('audit-edit-timezone-badge');

      expect(startInputWarsaw.value).toBe('2026-06-15 12:00:00');
      expect(endInputWarsaw.value).toBe('2026-06-15 13:00:00');
      expect(tzBadgeWarsaw.textContent).toBe('Europe/Warsaw');

      unmount();

      // 2. America/New_York (-4h in summer)
      render(
        <MockProviders
          settingsState={{ timezone: 'America/New_York', resolvedTimezone: 'America/New_York' }}
        >
          <ReportLogEditModal
            isOpen={true}
            onClose={vi.fn()}
            log={mockLog}
            taskName="Task One"
            projectName="Project One"
          />
        </MockProviders>
      );

      const startInputNy = screen.getByTestId('audit-edit-start-time') as HTMLInputElement;
      const endInputNy = screen.getByTestId('audit-edit-end-time') as HTMLInputElement;
      const tzBadgeNy = screen.getByTestId('audit-edit-timezone-badge');

      expect(startInputNy.value).toBe('2026-06-15 06:00:00');
      expect(endInputNy.value).toBe('2026-06-15 07:00:00');
      expect(tzBadgeNy.textContent).toBe('America/New_York');
    });

    it('should convert edited times in Europe/Warsaw to correct UTC ISO 8601 when saving', async () => {
      render(
        <MockProviders
          dataState={{ handleEditTimeLog: handleEditTimeLogMock }}
          settingsState={{ timezone: 'Europe/Warsaw', resolvedTimezone: 'Europe/Warsaw' }}
        >
          <ReportLogEditModal
            isOpen={true}
            onClose={vi.fn()}
            log={mockLog}
          />
        </MockProviders>
      );

      fireEvent.change(screen.getByTestId('audit-edit-start-time'), {
        target: { value: '2026-06-15 14:00:00' }, // 14:00 in Warsaw = 12:00:00 UTC
      });
      fireEvent.change(screen.getByTestId('audit-edit-end-time'), {
        target: { value: '2026-06-15 16:30:00' }, // 16:30 in Warsaw = 14:30:00 UTC
      });
      fireEvent.change(screen.getByTestId('audit-edit-reason'), {
        target: { value: 'Adjusted to match customer call logs' },
      });
      fireEvent.click(screen.getByTestId('audit-save-button'));

      await waitFor(() => {
        expect(handleEditTimeLogMock).toHaveBeenCalledWith(
          'log-1',
          'task-1',
          '2026-06-15T12:00:00.000Z',
          '2026-06-15T14:30:00.000Z',
          'Initial note',
          'Adjusted to match customer call logs'
        );
      });
    });

    it('should convert edited times in America/New_York to correct UTC ISO 8601 when saving', async () => {
      render(
        <MockProviders
          dataState={{ handleEditTimeLog: handleEditTimeLogMock }}
          settingsState={{ timezone: 'America/New_York', resolvedTimezone: 'America/New_York' }}
        >
          <ReportLogEditModal
            isOpen={true}
            onClose={vi.fn()}
            log={mockLog}
          />
        </MockProviders>
      );

      fireEvent.change(screen.getByTestId('audit-edit-start-time'), {
        target: { value: '2026-06-15 08:00:00' }, // 08:00 in New York = 12:00:00 UTC
      });
      fireEvent.change(screen.getByTestId('audit-edit-end-time'), {
        target: { value: '2026-06-15 10:30:00' }, // 10:30 in New York = 14:30:00 UTC
      });
      fireEvent.change(screen.getByTestId('audit-edit-reason'), {
        target: { value: 'Shifted per EDT time' },
      });
      fireEvent.click(screen.getByTestId('audit-save-button'));

      await waitFor(() => {
        expect(handleEditTimeLogMock).toHaveBeenCalledWith(
          'log-1',
          'task-1',
          '2026-06-15T12:00:00.000Z',
          '2026-06-15T14:30:00.000Z',
          'Initial note',
          'Shifted per EDT time'
        );
      });
    });

    it('should block saving and display range error when endTime is before startTime in local timezone', async () => {
      render(
        <MockProviders
          dataState={{ handleEditTimeLog: handleEditTimeLogMock }}
          settingsState={{ timezone: 'Europe/Warsaw', resolvedTimezone: 'Europe/Warsaw' }}
        >
          <ReportLogEditModal
            isOpen={true}
            onClose={vi.fn()}
            log={mockLog}
          />
        </MockProviders>
      );

      fireEvent.change(screen.getByTestId('audit-edit-start-time'), {
        target: { value: '2026-06-15 15:00:00' },
      });
      fireEvent.change(screen.getByTestId('audit-edit-end-time'), {
        target: { value: '2026-06-15 14:00:00' }, // Earlier than start time
      });
      fireEvent.change(screen.getByTestId('audit-edit-reason'), {
        target: { value: 'Correction attempt' },
      });
      fireEvent.click(screen.getByTestId('audit-save-button'));

      await waitFor(() => {
        expect(screen.getByTestId('audit-range-error')).not.toBeNull();
        expect(screen.getByTestId('audit-range-error').textContent).toContain('End time cannot be before start time');
        expect(screen.getByTestId('audit-edit-start-time').getAttribute('aria-invalid')).toBe('true');
        expect(screen.getByTestId('audit-edit-end-time').getAttribute('aria-invalid')).toBe('true');
      });

      expect(handleEditTimeLogMock).not.toHaveBeenCalled();
    });

    it('should block saving and display format error when invalid date or time format is entered', async () => {
      render(
        <MockProviders
          dataState={{ handleEditTimeLog: handleEditTimeLogMock }}
          settingsState={{ timezone: 'Europe/Warsaw', resolvedTimezone: 'Europe/Warsaw' }}
        >
          <ReportLogEditModal
            isOpen={true}
            onClose={vi.fn()}
            log={mockLog}
          />
        </MockProviders>
      );

      fireEvent.change(screen.getByTestId('audit-edit-start-time'), {
        target: { value: 'not-a-valid-datetime' },
      });
      fireEvent.change(screen.getByTestId('audit-edit-reason'), {
        target: { value: 'Typo in date input' },
      });
      fireEvent.click(screen.getByTestId('audit-save-button'));

      await waitFor(() => {
        expect(screen.getByTestId('audit-range-error')).not.toBeNull();
        expect(screen.getByTestId('audit-range-error').textContent).toContain('Invalid date or time format');
        expect(screen.getByTestId('audit-edit-start-time').getAttribute('aria-invalid')).toBe('true');
      });

      expect(handleEditTimeLogMock).not.toHaveBeenCalled();
    });

    it('should block saving and display format error when impossible calendar date is entered', async () => {
      render(
        <MockProviders
          dataState={{ handleEditTimeLog: handleEditTimeLogMock }}
          settingsState={{ timezone: 'Europe/Warsaw', resolvedTimezone: 'Europe/Warsaw' }}
        >
          <ReportLogEditModal
            isOpen={true}
            onClose={vi.fn()}
            log={mockLog}
          />
        </MockProviders>
      );

      fireEvent.change(screen.getByTestId('audit-edit-start-time'), {
        target: { value: '2026-02-31 10:00:00' }, // Feb 31 does not exist
      });
      fireEvent.change(screen.getByTestId('audit-edit-reason'), {
        target: { value: 'Impossible calendar date' },
      });
      fireEvent.click(screen.getByTestId('audit-save-button'));

      await waitFor(() => {
        expect(screen.getByTestId('audit-range-error')).not.toBeNull();
        expect(screen.getByTestId('audit-range-error').textContent).toContain('Invalid date or time format');
      });

      expect(handleEditTimeLogMock).not.toHaveBeenCalled();
    });

    it('should allow explicit timezone prop to override context settings', () => {
      render(
        <MockProviders
          settingsState={{ timezone: 'Europe/Warsaw', resolvedTimezone: 'Europe/Warsaw' }}
        >
          <ReportLogEditModal
            isOpen={true}
            onClose={vi.fn()}
            log={mockLog}
            timezone="Asia/Tokyo"
          />
        </MockProviders>
      );

      // Asia/Tokyo is UTC+9, so 10:00:00Z -> 19:00:00
      const startInput = screen.getByTestId('audit-edit-start-time') as HTMLInputElement;
      const endInput = screen.getByTestId('audit-edit-end-time') as HTMLInputElement;
      const tzBadge = screen.getByTestId('audit-edit-timezone-badge');

      expect(startInput.value).toBe('2026-06-15 19:00:00');
      expect(endInput.value).toBe('2026-06-15 20:00:00');
      expect(tzBadge.textContent).toBe('Asia/Tokyo');
    });
  });
});
