// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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
    textSizeClass: 'text-xs',
    onRenameTask: onRenameTaskMock,
    setEditName: setEditNameMock,
    setEditingId: setEditingIdMock,
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should render editing input and handle blur to commit change', () => {
    // Arrange
    render(<TaskNameEditor {...mockProps} />);

    // Act
    const input = screen.getByDisplayValue('New Task Name');
    fireEvent.blur(input);

    // Assert
    expect(onRenameTaskMock).toHaveBeenCalledWith('t1', 'New Task Name');
    expect(setEditingIdMock).toHaveBeenCalledWith(null);
  });

  it('should commit edit on Enter key press when name changed', () => {
    // Arrange
    render(<TaskNameEditor {...mockProps} />);

    // Act
    const input = screen.getByDisplayValue('New Task Name');
    fireEvent.keyDown(input, { key: 'Enter' });

    // Assert
    expect(onRenameTaskMock).toHaveBeenCalledWith('t1', 'New Task Name');
    expect(setEditingIdMock).toHaveBeenCalledWith(null);
  });

  it('should cancel editing on Escape key press without renaming', () => {
    // Arrange
    render(<TaskNameEditor {...mockProps} />);

    // Act
    const input = screen.getByDisplayValue('New Task Name');
    fireEvent.keyDown(input, { key: 'Escape' });

    // Assert
    expect(onRenameTaskMock).not.toHaveBeenCalled();
    expect(setEditingIdMock).toHaveBeenCalledWith(null);
  });

  it('should not call onRenameTask when editName is identical to original taskName', () => {
    // Arrange
    render(<TaskNameEditor {...mockProps} editName="Initial Task Name" />);

    // Act
    const input = screen.getByDisplayValue('Initial Task Name');
    fireEvent.keyDown(input, { key: 'Enter' });

    // Assert
    expect(onRenameTaskMock).not.toHaveBeenCalled();
    expect(setEditingIdMock).toHaveBeenCalledWith(null);
  });

  it('should not call onRenameTask when editName consists only of whitespace', () => {
    // Arrange
    render(<TaskNameEditor {...mockProps} editName="   " />);

    // Act
    const input = screen.getByLabelText(/Edit name/i);
    fireEvent.keyDown(input, { key: 'Enter' });

    // Assert
    expect(onRenameTaskMock).not.toHaveBeenCalled();
    expect(setEditingIdMock).toHaveBeenCalledWith(null);
  });

  it('should return null when isEditing is false', () => {
    // Arrange & Act
    const { container } = render(<TaskNameEditor {...mockProps} isEditing={false} />);

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it('should reset editingId without error when onRenameTask is undefined', () => {
    // Arrange
    render(<TaskNameEditor {...mockProps} onRenameTask={undefined} />);

    // Act
    const input = screen.getByDisplayValue('New Task Name');
    fireEvent.keyDown(input, { key: 'Enter' });

    // Assert
    expect(setEditingIdMock).toHaveBeenCalledWith(null);
  });
});

