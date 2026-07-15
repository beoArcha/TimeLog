// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

  it('should render form input fields and handle submit', () => {
    render(<SubtaskForm {...mockProps} />);

    const input = screen.getByPlaceholderText(/Enter subtask name/i) as HTMLInputElement;
    expect(input.value).toBe('Draft subtask');

    fireEvent.change(input, { target: { value: 'New Subtask Title' } });
    expect(setNewSubtaskNameMock).toHaveBeenCalledWith('New Subtask Title');

    const form = input.closest('form');
    fireEvent.submit(form!);

    expect(onSubmitMock).toHaveBeenCalledWith('t1', expect.any(Object));
  });
});
