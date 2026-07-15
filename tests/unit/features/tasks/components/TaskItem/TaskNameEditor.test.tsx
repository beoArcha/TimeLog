// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TaskNameEditor } from '@features/tasks/components/TaskItem/TaskNameEditor';

describe('Unit Tests: TaskNameEditor', () => {
  const onRenameTaskMock = vi.fn();
  const setEditNameMock = vi.fn();
  const setEditingIdMock = vi.fn();

  const mockProps = {
    taskId: 't1',
    taskName: 'Initial Task Name',
    editName: 'New Task Name',
    isEditing: true,
    theme: 'dark',
    textSizeClass: 'text-xs',
    locale: 'en' as const,
    customTranslations: {},
    onRenameTask: onRenameTaskMock,
    setEditName: setEditNameMock,
    setEditingId: setEditingIdMock,
  };

  afterEach(() => {
    cleanup();
  });

  it('should render editing input and handle blur/keys', () => {
    const { container } = render(<TaskNameEditor {...mockProps} />);

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('New Task Name');

    // Trigger blur to save
    fireEvent.blur(input);
    expect(onRenameTaskMock).toHaveBeenCalledWith('t1', 'New Task Name');
    expect(setEditingIdMock).toHaveBeenCalledWith(null);
  });
});
