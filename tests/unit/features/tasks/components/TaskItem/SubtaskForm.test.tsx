// @vitest-environment jsdom
import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SubtaskForm } from '@features/tasks/components/TaskItem/SubtaskForm';

describe('Unit Tests: SubtaskForm', () => {
  const onSubmitMock = vi.fn();
  const setNewSubtaskNameMock = vi.fn();

  const mockProps = {
    parentTaskId: 't1',
    newSubtaskName: 'Draft subtask',
    theme: 'dark',
    locale: 'en' as const,
    customTranslations: {},
    setNewSubtaskName: setNewSubtaskNameMock,
    onSubmit: onSubmitMock,
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render input field with current subtask name', () => {
    // Arrange & Act
    const { container } = render(<SubtaskForm {...mockProps} />);

    // Assert
    const input = container.querySelector('#new-subtask-input-t1') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('Draft subtask');
  });

  it('should call setNewSubtaskName when input value changes', () => {
    // Arrange
    const { container } = render(<SubtaskForm {...mockProps} />);
    const input = container.querySelector('#new-subtask-input-t1') as HTMLInputElement;
    expect(input).not.toBeNull();

    // Act
    fireEvent.change(input, { target: { value: 'New Subtask Title' } });

    // Assert
    expect(setNewSubtaskNameMock).toHaveBeenCalledTimes(1);
    expect(setNewSubtaskNameMock).toHaveBeenCalledWith('New Subtask Title');
  });

  it('should call onSubmit with parentTaskId and form event when submitted', () => {
    // Arrange
    const { container } = render(<SubtaskForm {...mockProps} />);
    const form = container.querySelector('form');
    expect(form).not.toBeNull();

    // Act
    fireEvent.submit(form!);

    // Assert
    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    expect(onSubmitMock).toHaveBeenCalledWith('t1', expect.any(Object));
  });
});
