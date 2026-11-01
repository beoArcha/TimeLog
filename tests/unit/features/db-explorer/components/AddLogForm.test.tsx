// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { toast } from 'sonner';
import AddLogForm from '@features/db-explorer/components/AddLogForm';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';

describe('Unit Tests: AddLogForm', () => {
  const onSubmitMock = vi.fn();
  const onCancelMock = vi.fn();

  const mockProps = {
    projects: [aProject({ id: 'p1', name: 'Project Alpha' })],
    tasks: [aTask({ id: 't1', projectId: 'p1', name: 'Task Alpha' })],
    locale: 'en' as const,
    customTranslations: {},
    onSubmit: onSubmitMock,
    onCancel: onCancelMock
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should render the log form input fields', () => {
    // Arrange & Act
    render(<AddLogForm {...mockProps} />);

    // Assert
    expect(screen.getByLabelText(/Assign to task/i)).toBeTruthy();
    expect(screen.getByLabelText(/Start/i)).toBeTruthy();
    expect(screen.getByLabelText(/End/i)).toBeTruthy();
    expect(screen.getByLabelText(/Note/i)).toBeTruthy();
  });

  it('should trigger onSubmit with form values on submit button click', () => {
    // Arrange
    render(<AddLogForm {...mockProps} />);

    // Act
    const noteInput = screen.getByLabelText(/Note/i);
    fireEvent.change(noteInput, { target: { value: 'Working on feature unit tests' } });

    const submitBtn = screen.getByRole('button', { name: /AddLogManually|Add Log/i });
    fireEvent.click(submitBtn);

    // Assert
    expect(onSubmitMock).toHaveBeenCalledWith(
      't1',
      expect.any(String),
      expect.any(String),
      'Working on feature unit tests'
    );
  });

  it('should trigger onCancel when cancel button is clicked', () => {
    // Arrange
    render(<AddLogForm {...mockProps} />);

    // Act
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Assert
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('should show error toast and prevent submission when taskId is empty', () => {
    // Arrange
    const toastErrorSpy = vi.spyOn(toast, 'error').mockImplementation(() => 'toast-id');
    render(<AddLogForm {...mockProps} tasks={[]} />);

    // Act
    const submitBtn = screen.getByRole('button', { name: /AddLogManually|Add Log/i });
    fireEvent.click(submitBtn);

    // Assert
    expect(toastErrorSpy).toHaveBeenCalled();
    expect(onSubmitMock).not.toHaveBeenCalled();
  });
});

