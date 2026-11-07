// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ConfirmDialog } from '@components/ConfirmDialog';

describe('Unit Tests: ConfirmDialog', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders title, description, and action buttons', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Confirm Operation"
        description="Are you sure you want to proceed?"
        confirmLabel="Proceed"
        cancelLabel="Dismiss"
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('Confirm Operation')).not.toBeNull();
    expect(screen.getByText('Are you sure you want to proceed?')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Proceed' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Dismiss' })).not.toBeNull();
  });

  it('closes dialog on cancel button click and calls onCancel', () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Cancel Test"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    const cancelBtn = screen.getByTestId('confirm-dialog-cancel-btn');
    fireEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes dialog on synchronous onConfirm success', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Sync Confirm"
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes dialog when async onConfirm resolves successfully', async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Async Success"
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('keeps dialog open, resets internalLoading, and logs error when async onConfirm rejects with technical error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onOpenChange = vi.fn();
    const error = new Error('sqlite3_step: constraint failed');
    const onConfirm = vi.fn().mockRejectedValue(error);

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Async Failure Test"
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(confirmBtn.getAttribute('aria-busy')).not.toBe('true');
      expect(confirmBtn.hasAttribute('disabled')).toBe(false);
    });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).not.toBeNull();
    expect(screen.getByRole('alert')).not.toBeNull();
    expect(screen.getByTestId('confirm-dialog-error').textContent).toBe('Error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[ConfirmDialog] Confirm action failed:',
      error
    );

    consoleErrorSpy.mockRestore();
  });

  it('renders visible role="alert" with safe error message when onConfirm rejects, keeps dialog open, and allows retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onOpenChange = vi.fn();
    const onConfirm = vi
      .fn()
      .mockRejectedValueOnce(new Error('sqlite database is locked'))
      .mockResolvedValueOnce(undefined);

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Database Error Test"
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    const alert = await screen.findByRole('alert');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toBe('Error');
    expect(screen.getByTestId('confirm-dialog-error')).not.toBeNull();
    expect(screen.getByRole('alertdialog')).not.toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();

    // Verify retry
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('displays readable error message when onConfirm rejects with readable Error instance', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onConfirm = vi.fn().mockRejectedValue(new Error('Custom readable error'));

    render(
      <ConfirmDialog
        open={true}
        title="Readable Error Test"
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Custom readable error');
  });

  it('displays readable error message when onConfirm rejects with string error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onConfirm = vi.fn().mockRejectedValue('String error');

    render(
      <ConfirmDialog
        open={true}
        title="String Error Test"
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('String error');
  });

  it('masks stack trace and technical panic errors to generic error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onConfirm = vi.fn().mockRejectedValue(new Error('Critical crash\n    at Object.test (suite.ts:10:5)'));

    render(
      <ConfirmDialog
        open={true}
        title="Stacktrace Error Test"
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Error');
  });

  it('masks unknown error or null to generic error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onConfirm = vi.fn().mockRejectedValue(null);

    render(
      <ConfirmDialog
        open={true}
        title="Null Error Test"
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Error');
  });

  it('clears internal error when dialog is closed and reopened', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onConfirm = vi.fn().mockRejectedValue(new Error('Readable error'));
    const onOpenChange = vi.fn();

    const { rerender } = render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Clear Error Test"
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    expect(await screen.findByRole('alert')).not.toBeNull();

    const cancelBtn = screen.getByTestId('confirm-dialog-cancel-btn');
    fireEvent.click(cancelBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Clear Error Test"
        onConfirm={onConfirm}
      />
    );

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('keeps dialog open and displays role="alert" with safe error when synchronous onConfirm throws technical error', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onOpenChange = vi.fn();
    const error = new Error('panic: kernel thread aborted');
    const onConfirm = vi.fn().mockImplementation(() => {
      throw error;
    });

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Sync Throw Test"
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).not.toBeNull();
    expect(screen.getByRole('alert').textContent).toBe('Error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[ConfirmDialog] Confirm action failed:',
      error
    );

    consoleErrorSpy.mockRestore();
  });

  it('displays external errorMessage prop and clears error on cancel', () => {
    const onClearError = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        title="External Error Prop Test"
        errorMessage="External failure reason"
        onClearError={onClearError}
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('External failure reason');

    const cancelBtn = screen.getByTestId('confirm-dialog-cancel-btn');
    fireEvent.click(cancelBtn);

    expect(onClearError).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
