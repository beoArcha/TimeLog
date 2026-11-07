// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PromptDialog } from '@components/PromptDialog';

describe('Unit Tests: PromptDialog Component', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render prompt and submit typed value', () => {
    // Arrange
    const onConfirm = vi.fn();
    render(
      <PromptDialog
        open={true}
        title="Enter Project Name"
        defaultValue="Alpha"
        confirmLabel="Save"
        onConfirm={onConfirm}
      />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    // Act
    fireEvent.change(input, { target: { value: 'Beta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    // Assert
    expect(input.value).toBe('Beta');
    expect(onConfirm).toHaveBeenCalledWith('Beta');
  });

  it('should call onCancel and onOpenChange when cancel button is clicked', () => {
    // Arrange
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <PromptDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Enter Name"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    // Act
    fireEvent.click(screen.getByTestId('prompt-dialog-cancel-btn'));

    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should display validation error and block submit when validation fails', () => {
    // Arrange
    const onConfirm = vi.fn();
    render(
      <PromptDialog
        open={true}
        title="Project Code"
        validate={(val) => (val.length < 3 ? 'Code too short' : null)}
        onConfirm={onConfirm}
      />
    );
    const input = screen.getByRole('textbox');

    // Act - enter invalid value
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.click(screen.getByTestId('prompt-dialog-confirm-btn'));

    // Assert
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Code too short')).toBeTruthy();

    // Act - fix input
    fireEvent.change(input, { target: { value: 'abcd' } });

    // Assert error cleared
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('should keep the dialog open and show an error when async confirmation rejects', async () => {
    // Arrange
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockRejectedValue(new Error('Unable to save prompt'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <PromptDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Save Prompt"
        onConfirm={onConfirm}
      />
    );

    // Act
    fireEvent.click(screen.getByTestId('prompt-dialog-confirm-btn'));

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Unable to save prompt');
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByTestId('prompt-dialog-confirm-btn').getAttribute('aria-busy')).toBe('false');
  });

  it('should keep the dialog open and show an error when confirmation throws synchronously', async () => {
    // Arrange
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn(() => {
      throw new Error('Synchronous failure');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <PromptDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Save Prompt"
        onConfirm={onConfirm}
      />
    );

    // Act
    fireEvent.click(screen.getByTestId('prompt-dialog-confirm-btn'));

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Synchronous failure');
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('should have input connected with label, aria-required, and error alert', () => {
    // Arrange
    render(
      <PromptDialog
        open={true}
        title="Project Name"
        validate={(v) => (v.length < 3 ? 'Min 3 chars' : null)}
        onConfirm={() => {}}
      />
    );
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('false');

    // Act - Trigger validation error
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.click(screen.getByRole('button', { name: /save|confirm/i }));

    // Assert
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Min 3 chars')).toBeTruthy();
  });
});
