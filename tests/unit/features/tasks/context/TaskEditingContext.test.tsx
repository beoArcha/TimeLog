// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, renderHook, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  TaskEditingProvider,
  useTaskEditing,
} from '@features/tasks/context/TaskEditingContext';

describe('Unit Tests: TaskEditingContext', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should return null when useTaskEditing is consumed outside TaskEditingProvider', () => {
    // Arrange & Act
    const { result } = renderHook(() => useTaskEditing());

    // Assert
    expect(result.current).toBeNull();
  });

  it('should initialize with default empty values when no props are provided', () => {
    // Arrange
    const Consumer = () => {
      const ctx = useTaskEditing();
      return (
        <div>
          <span data-testid="editing-id">{ctx?.editingId ?? 'null'}</span>
          <span data-testid="edit-name">{ctx?.editName || 'empty'}</span>
          <span data-testid="subtask-id">{ctx?.showSubtaskFormForId ?? 'null'}</span>
          <span data-testid="subtask-name">{ctx?.newSubtaskName || 'empty'}</span>
        </div>
      );
    };

    // Act
    render(
      <TaskEditingProvider>
        <Consumer />
      </TaskEditingProvider>
    );

    // Assert
    expect(screen.getByTestId('editing-id').textContent).toBe('null');
    expect(screen.getByTestId('edit-name').textContent).toBe('empty');
    expect(screen.getByTestId('subtask-id').textContent).toBe('null');
    expect(screen.getByTestId('subtask-name').textContent).toBe('empty');
  });

  it('should initialize with provided initial props and render children', () => {
    // Arrange
    const Consumer = () => {
      const ctx = useTaskEditing();
      return (
        <div>
          <span data-testid="editing-id">{ctx?.editingId}</span>
          <span data-testid="edit-name">{ctx?.editName}</span>
          <span data-testid="subtask-id">{ctx?.showSubtaskFormForId}</span>
          <span data-testid="subtask-name">{ctx?.newSubtaskName}</span>
        </div>
      );
    };

    // Act
    render(
      <TaskEditingProvider
        initialEditingId="task-10"
        initialEditName="Refactor Database"
        initialShowSubtaskFormForId="task-20"
        initialNewSubtaskName="Create Indexes"
      >
        <Consumer />
      </TaskEditingProvider>
    );

    // Assert
    expect(screen.getByTestId('editing-id').textContent).toBe('task-10');
    expect(screen.getByTestId('edit-name').textContent).toBe('Refactor Database');
    expect(screen.getByTestId('subtask-id').textContent).toBe('task-20');
    expect(screen.getByTestId('subtask-name').textContent).toBe('Create Indexes');
  });

  it('should update state when startEditing and cancelEditing are invoked', () => {
    // Arrange
    const Consumer = () => {
      const ctx = useTaskEditing()!;
      return (
        <div>
          <span data-testid="editing-id">{ctx.editingId ?? 'null'}</span>
          <span data-testid="edit-name">{ctx.editName || 'empty'}</span>
          <button onClick={() => ctx.startEditing('task-99', 'Deploy app')}>Start</button>
          <button onClick={() => ctx.cancelEditing()}>Cancel</button>
        </div>
      );
    };

    render(
      <TaskEditingProvider>
        <Consumer />
      </TaskEditingProvider>
    );

    // Act - start editing
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    // Assert after start
    expect(screen.getByTestId('editing-id').textContent).toBe('task-99');
    expect(screen.getByTestId('edit-name').textContent).toBe('Deploy app');

    // Act - cancel editing
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert after cancel
    expect(screen.getByTestId('editing-id').textContent).toBe('null');
    expect(screen.getByTestId('edit-name').textContent).toBe('empty');
  });

  it('should trigger external callback handlers when state mutators are called', () => {
    // Arrange
    const onSetEditingId = vi.fn();
    const onSetEditName = vi.fn();
    const onSetShowSubtaskFormForId = vi.fn();
    const onSetNewSubtaskName = vi.fn();

    const Consumer = () => {
      const ctx = useTaskEditing()!;
      return (
        <div>
          <button onClick={() => ctx.setEditingId('task-edit')}>Set Editing ID</button>
          <button onClick={() => ctx.setEditingId((prev) => `${prev}-updated`)}>Update Editing ID Fn</button>
          <button onClick={() => ctx.setEditName('Updated Name')}>Set Edit Name</button>
          <button onClick={() => ctx.setShowSubtaskFormForId('task-sub')}>Set Subtask ID</button>
          <button onClick={() => ctx.setNewSubtaskName('Sub Name')}>Set Subtask Name</button>
        </div>
      );
    };

    render(
      <TaskEditingProvider
        onSetEditingId={onSetEditingId}
        onSetEditName={onSetEditName}
        onSetShowSubtaskFormForId={onSetShowSubtaskFormForId}
        onSetNewSubtaskName={onSetNewSubtaskName}
      >
        <Consumer />
      </TaskEditingProvider>
    );

    // Act & Assert
    fireEvent.click(screen.getByRole('button', { name: 'Set Editing ID' }));
    expect(onSetEditingId).toHaveBeenCalledWith('task-edit');

    fireEvent.click(screen.getByRole('button', { name: 'Update Editing ID Fn' }));
    expect(onSetEditingId).toHaveBeenCalledWith('task-edit-updated');

    fireEvent.click(screen.getByRole('button', { name: 'Set Edit Name' }));
    expect(onSetEditName).toHaveBeenCalledWith('Updated Name');

    fireEvent.click(screen.getByRole('button', { name: 'Set Subtask ID' }));
    expect(onSetShowSubtaskFormForId).toHaveBeenCalledWith('task-sub');

    fireEvent.click(screen.getByRole('button', { name: 'Set Subtask Name' }));
    expect(onSetNewSubtaskName).toHaveBeenCalledWith('Sub Name');
  });

  it('should synchronize internal state when initial props change on re-render', () => {
    // Arrange
    const Consumer = () => {
      const ctx = useTaskEditing()!;
      return (
        <div>
          <span data-testid="editing-id">{ctx.editingId ?? 'null'}</span>
          <span data-testid="edit-name">{ctx.editName || 'empty'}</span>
          <span data-testid="subtask-id">{ctx.showSubtaskFormForId ?? 'null'}</span>
          <span data-testid="subtask-name">{ctx.newSubtaskName || 'empty'}</span>
        </div>
      );
    };

    const { rerender } = render(
      <TaskEditingProvider
        initialEditingId="id-1"
        initialEditName="Name 1"
        initialShowSubtaskFormForId="sub-1"
        initialNewSubtaskName="SubName 1"
      >
        <Consumer />
      </TaskEditingProvider>
    );

    expect(screen.getByTestId('editing-id').textContent).toBe('id-1');
    expect(screen.getByTestId('edit-name').textContent).toBe('Name 1');

    // Act - re-render with updated initial props
    rerender(
      <TaskEditingProvider
        initialEditingId="id-2"
        initialEditName="Name 2"
        initialShowSubtaskFormForId="sub-2"
        initialNewSubtaskName="SubName 2"
      >
        <Consumer />
      </TaskEditingProvider>
    );

    // Assert
    expect(screen.getByTestId('editing-id').textContent).toBe('id-2');
    expect(screen.getByTestId('edit-name').textContent).toBe('Name 2');
    expect(screen.getByTestId('subtask-id').textContent).toBe('sub-2');
    expect(screen.getByTestId('subtask-name').textContent).toBe('SubName 2');
  });
});
