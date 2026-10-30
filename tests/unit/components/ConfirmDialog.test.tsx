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

  it('keeps dialog open, resets internalLoading, and logs error when async onConfirm rejects', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onOpenChange = vi.fn();
    const error = new Error('Async rejection error');
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

    // Verify that loading is reset back to false and button is re-enabled
    await waitFor(() => {
      expect(confirmBtn.getAttribute('aria-busy')).not.toBe('true');
      expect(confirmBtn.hasAttribute('disabled')).toBe(false);
    });

    // Dialog must NOT be closed: onOpenChange was not called with false
    expect(onOpenChange).not.toHaveBeenCalled();
    // Modal dialog still present in DOM
    expect(screen.getByRole('alertdialog')).not.toBeNull();
    // Error logged properly
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to execute confirm action in ConfirmDialog:',
      error
    );

    consoleErrorSpy.mockRestore();
  });

  it('keeps dialog open and logs error when synchronous onConfirm throws', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onOpenChange = vi.fn();
    const error = new Error('Synchronous throw');
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
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to execute confirm action in ConfirmDialog:',
      error
    );

    consoleErrorSpy.mockRestore();
  });
});
