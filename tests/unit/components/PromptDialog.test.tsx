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

    fireEvent.change(input, { target: { value: 'Beta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(input.value).toBe('Beta');
    expect(onConfirm).toHaveBeenCalledWith('Beta');
  });

  it('should call onCancel and onOpenChange when cancel button is clicked', () => {
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

    fireEvent.click(screen.getByTestId('prompt-dialog-cancel-btn'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should block submit when required is default true and value is empty or whitespace', () => {
    const onConfirm = vi.fn();
    render(
      <PromptDialog
        open={true}
        title="Project Name"
        defaultValue=""
        onConfirm={onConfirm}
      />
    );
    const input = screen.getByRole('textbox');

    fireEvent.click(screen.getByTestId('prompt-dialog-confirm-btn'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('This field is required')).toBeTruthy();

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByTestId('prompt-dialog-confirm-btn'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('This field is required')).toBeTruthy();

    fireEvent.change(input, { target: { value: 'Valid Project' } });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('should allow submitting empty value when required is false', () => {
    const onConfirm = vi.fn();
    render(
      <PromptDialog
        open={true}
        title="Optional Description"
        defaultValue=""
        required={false}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByTestId('prompt-dialog-confirm-btn'));

    expect(onConfirm).toHaveBeenCalledWith('');
  });

  it('should display custom validation error and block submit when validation fails', () => {
    const onConfirm = vi.fn();
    render(
      <PromptDialog
        open={true}
        title="Project Code"
        defaultValue="abc"
        validate={(val) => (val.length < 5 ? 'Code too short' : null)}
        onConfirm={onConfirm}
      />
    );
    const input = screen.getByRole('textbox');

    fireEvent.click(screen.getByTestId('prompt-dialog-confirm-btn'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Code too short')).toBeTruthy();

    fireEvent.change(input, { target: { value: 'abcdef' } });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('should keep dialog open and show error when async confirmation rejects', async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockRejectedValue(new Error('Unable to save prompt'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <PromptDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Save Prompt"
        defaultValue="Valid Value"
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByTestId('prompt-dialog-confirm-btn'));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Unable to save prompt');
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByTestId('prompt-dialog-confirm-btn').getAttribute('aria-busy')).toBe('false');
  });

  it('should keep dialog open and show error when confirmation throws synchronously', async () => {
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
        defaultValue="Valid Value"
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByTestId('prompt-dialog-confirm-btn'));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Synchronous failure');
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('should reflect accessibility attributes for required and optional states', () => {
    const { unmount } = render(
      <PromptDialog
        open={true}
        title="Required Dialog"
        description="Helper description"
        defaultValue="Test"
        onConfirm={() => {}}
      />
    );

    const dialogContent = document.querySelector('[data-slot="dialog-content"]');
    expect(dialogContent?.getAttribute('aria-modal')).toBe('true');
    expect(dialogContent?.hasAttribute('aria-labelledby')).toBe(true);
    expect(dialogContent?.hasAttribute('aria-describedby')).toBe(true);

    const input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('false');

    unmount();

    render(
      <PromptDialog
        open={true}
        title="Optional Dialog"
        required={false}
        defaultValue="Test"
        onConfirm={() => {}}
      />
    );

    const optionalInput = screen.getByRole('textbox');
    expect(optionalInput.getAttribute('aria-required')).toBe('false');
  });
});
