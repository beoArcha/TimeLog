// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TaskListView from '@features/tasks/TaskListView';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

const renderWithLocale = (ui: React.ReactElement) => render(<LocaleProvider>{ui}</LocaleProvider>);

describe('Given TaskListView and TaskItem components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const setupMockState = (overrides = {}) => {
    const task1 = aTask({ id: 'task_1', projectId: 'proj_1', parentTaskId: null, name: 'Task One', completed: false });
    const task2 = aTask({ id: 'task_2', projectId: 'proj_1', parentTaskId: null, name: 'Task Two', completed: true });
    const subtask1 = aTask({ id: 'subtask_1', projectId: 'proj_1', parentTaskId: 'task_1', name: 'Subtask One', completed: false });
    const project1 = aProject({ id: 'proj_1', name: 'Project Alpha', color: 'rose' });
    const log1 = aTimeLog({ id: 'l1', taskId: 'task_1', projectId: 'proj_1', startTime: '2026-06-15T12:00:00Z', endTime: null });

    return {
      tasks: [task1, task2, subtask1],
      projectTasks: [task1, task2, subtask1],
      logs: [log1],
      nowIso: '2026-06-15T12:05:00Z',
      locale: 'en',
      customTranslations: {},
      theme: 'dark',
      textAndIconSize: 'medium',
      selectedProject: project1,
      rootTasks: [task1, task2],
      newTaskName: 'New Test Task',
      setNewTaskName: vi.fn(),
      onAddTask: vi.fn(),
      onToggleTaskComplete: vi.fn(),
      onRenameTask: vi.fn(),
      onDeleteTask: vi.fn(),
      onStartTimer: vi.fn(),
      showSubtaskFormForId: null,
      setShowSubtaskFormForId: vi.fn(),
      newSubtaskName: 'New Subtask',
      setNewSubtaskName: vi.fn(),
      editingId: null,
      setEditingId: vi.fn(),
      editName: 'Edited Task Name',
      setEditName: vi.fn(),
      ...overrides,
    };
  };

  describe('When no project is selected', () => {
    it('Then it should prompt the user to select a project', () => {
      // Given
      const state = setupMockState({ selectedProject: null });

      // When
      renderWithLocale(<TaskListView state={state} isCondensed={false} />);

      // Then
      expect(screen.getByText('Select project')).toBeDefined();
    });
  });

  describe('When a project is selected with existing tasks', () => {
    it('Then it should display the project header and task list', () => {
      // Given
      const state = setupMockState();

      // When
      renderWithLocale(<TaskListView state={state} isCondensed={false} />);

      // Then
      expect(screen.getByText('Project Alpha')).toBeDefined();
      expect(screen.getByText('Task One')).toBeDefined();
      expect(screen.getByText('Task Two')).toBeDefined();
    });
  });

  describe('When submitting new root task form with valid text', () => {
    it('Then it should invoke onAddTask callback with target project and name', () => {
      // Given
      const state = setupMockState();
      renderWithLocale(<TaskListView state={state} isCondensed={false} />);

      // When
      const submitBtn = screen.getByRole('button', { name: /^Add Task$/i });
      fireEvent.click(submitBtn);

      // Then
      expect(state.onAddTask).toHaveBeenCalledWith('proj_1', 'New Test Task', null);
      expect(state.setNewTaskName).toHaveBeenCalledWith('');
    });
  });

  describe('When toggling task complete square', () => {
    it('Then it should trigger onToggleTaskComplete with target task id', () => {
      // Given
      const state = setupMockState();
      renderWithLocale(<TaskListView state={state} isCondensed={false} />);

      // When
      const checkBtn = document.querySelector('#check-task-task_1') as HTMLElement;
      fireEvent.click(checkBtn);

      // Then
      expect(state.onToggleTaskComplete).toHaveBeenCalledWith('task_1');
    });
  });

  describe('When clicking task start timer button', () => {
    it('Then it should trigger onStartTimer with target task id', () => {
      // Given
      const state = setupMockState({ logs: [] });
      renderWithLocale(<TaskListView state={state} isCondensed={false} />);

      // When
      const playBtn = document.querySelector('#start-btn-task_1') as HTMLElement;
      fireEvent.click(playBtn);

      // Then
      expect(state.onStartTimer).toHaveBeenCalledWith('task_1');
    });
  });

  describe('When editing a task and input loses focus or Enter is pressed', () => {
    it('Then it should trigger onRenameTask on blur', () => {
      // Given
      const state = setupMockState({ editingId: 'task_1', editName: 'Task One Custom' });
      renderWithLocale(<TaskListView state={state} isCondensed={false} />);

      // When
      const input = screen.getByDisplayValue('Task One Custom');
      fireEvent.change(input, { target: { value: 'Task One Renamed' } });
      fireEvent.blur(input);

      // Then
      expect(state.onRenameTask).toHaveBeenCalledWith('task_1', 'Task One Renamed');
      expect(state.setEditingId).toHaveBeenCalledWith(null);
    });

    it('Then it should trigger onRenameTask on Enter key press', () => {
      // Given
      const state = setupMockState({ editingId: 'task_1', editName: 'Task One Custom' });
      renderWithLocale(<TaskListView state={state} isCondensed={false} />);

      // When
      const input = screen.getByDisplayValue('Task One Custom');
      fireEvent.change(input, { target: { value: 'Task One Renamed' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // Then
      expect(state.onRenameTask).toHaveBeenCalledWith('task_1', 'Task One Renamed');
      expect(state.setEditingId).toHaveBeenCalledWith(null);
    });

    it('Then it should cancel editing on Escape key press', () => {
      // Given
      const state = setupMockState({ editingId: 'task_1', editName: 'Task One Custom' });
      renderWithLocale(<TaskListView state={state} isCondensed={false} />);

      // When
      const input = screen.getByDisplayValue('Task One Custom');
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      // Then
      expect(state.setEditingId).toHaveBeenCalledWith(null);
    });
  });

  describe('When managing subtasks', () => {
    it('Then it should open subtask form and allow saving a new subtask', () => {
      // Given
      const state = setupMockState({ showSubtaskFormForId: 'task_1' });
      renderWithLocale(<TaskListView state={state} isCondensed={false} />);

      // When
      const submitBtn = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(submitBtn);

      // Then
      expect(state.onAddTask).toHaveBeenCalledWith('proj_1', 'New Subtask', 'task_1');
      expect(state.setNewSubtaskName).toHaveBeenCalledWith('');
      expect(state.setShowSubtaskFormForId).toHaveBeenCalledWith(null);
    });

    it('Then it should toggle subtask completion when complete button is clicked', () => {
      // Given
      const state = setupMockState();
      renderWithLocale(<TaskListView state={state} isCondensed={false} />);

      // When
      const checkBtn = document.querySelector('#check-subtask-subtask_1') as HTMLElement;
      fireEvent.click(checkBtn);

      // Then
      expect(state.onToggleTaskComplete).toHaveBeenCalledWith('subtask_1');
    });

    it('Then it should trigger onDeleteTask when delete button is clicked', () => {
      // Given
      const state = setupMockState();
      renderWithLocale(<TaskListView state={state} isCondensed={false} />);

      // When
      const deleteBtn = document.querySelector('#delete-task-btn-subtask_1')!;
      fireEvent.click(deleteBtn);

      // Then
      expect(state.onDeleteTask).toHaveBeenCalledWith('subtask_1');
    });

    it('Then it should start or stop timer on subtask when timer button is clicked', () => {
      // Given
      const state = setupMockState({ logs: [] });
      renderWithLocale(<TaskListView state={state} isCondensed={false} />);

      // When
      const startBtn = document.querySelector('#start-subtask-btn-subtask_1') as HTMLElement;
      fireEvent.click(startBtn);

      // Then
      expect(state.onStartTimer).toHaveBeenCalledWith('subtask_1');
    });
  });
});
