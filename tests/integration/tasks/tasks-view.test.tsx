// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TaskListView from '@features/tasks/TaskListView';

describe('Integration Tests: TaskListView and TaskItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const setupMockState = (overrides = {}) => {
    return {
      tasks: [
        { id: 'task_1', projectId: 'proj_1', parentTaskId: null, name: 'Task One', createdAt: '2026-06-12T00:00:00Z', completed: false },
        { id: 'task_2', projectId: 'proj_1', parentTaskId: null, name: 'Task Two', createdAt: '2026-06-12T00:00:00Z', completed: true },
        { id: 'subtask_1', projectId: 'proj_1', parentTaskId: 'task_1', name: 'Subtask One', createdAt: '2026-06-12T00:00:00Z', completed: false },
      ],
      projectTasks: [
        { id: 'task_1', projectId: 'proj_1', parentTaskId: null, name: 'Task One', createdAt: '2026-06-12T00:00:00Z', completed: false },
        { id: 'task_2', projectId: 'proj_1', parentTaskId: null, name: 'Task Two', createdAt: '2026-06-12T00:00:00Z', completed: true },
        { id: 'subtask_1', projectId: 'proj_1', parentTaskId: 'task_1', name: 'Subtask One', createdAt: '2026-06-12T00:00:00Z', completed: false },
      ],
      logs: [
        { id: 'l1', taskId: 'task_1', projectId: 'proj_1', startTime: '2026-06-15T12:00:00Z', endTime: null }
      ],
      nowIso: '2026-06-15T12:05:00Z',
      locale: 'en',
      customTranslations: {},
      theme: 'dark',
      textAndIconSize: 'medium',
      selectedProject: { id: 'proj_1', name: 'Project Alpha', color: 'rose', createdAt: '2026-06-12T00:00:00Z' },
      rootTasks: [
        { id: 'task_1', projectId: 'proj_1', parentTaskId: null, name: 'Task One', createdAt: '2026-06-12T00:00:00Z', completed: false },
        { id: 'task_2', projectId: 'proj_1', parentTaskId: null, name: 'Task Two', createdAt: '2026-06-12T00:00:00Z', completed: true },
      ],
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
      ...overrides
    };
  };

  it('Given no selected project, When rendered, Then it should prompt to select a project', () => {
    const state = setupMockState({ selectedProject: null });
    render(<TaskListView state={state} isCondensed={false} />);
    expect(screen.getByText('Select project')).toBeDefined();
  });

  it('Given selected project and root tasks, When rendered, Then it should show project name and tasks', () => {
    const state = setupMockState();
    render(<TaskListView state={state} isCondensed={false} />);
    expect(screen.getByText('Project Alpha')).toBeDefined();
    expect(screen.getByText('Task One')).toBeDefined();
    expect(screen.getByText('Task Two')).toBeDefined();
  });

  it('Given root task form, When submitted with valid text, Then it should call onAddTask', () => {
    const state = setupMockState();
    render(<TaskListView state={state} isCondensed={false} />);
    const submitBtn = screen.getByRole('button', { name: /^Add Task$/i });
    fireEvent.click(submitBtn);
    expect(state.onAddTask).toHaveBeenCalledWith('proj_1', 'New Test Task', null);
    expect(state.setNewTaskName).toHaveBeenCalledWith('');
  });

  it('Given root task, When complete square clicked, Then it should toggle complete status', () => {
    const state = setupMockState();
    render(<TaskListView state={state} isCondensed={false} />);
    const checkBtn = document.getElementById('check-task-task_1') as HTMLElement;
    fireEvent.click(checkBtn);
    expect(state.onToggleTaskComplete).toHaveBeenCalledWith('task_1');
  });

  it('Given root task, When start timer clicked, Then it should trigger start timer', () => {
    const state = setupMockState({ logs: [] });
    render(<TaskListView state={state} isCondensed={false} />);
    const playBtn = document.getElementById('start-btn-task_1') as HTMLElement;
    fireEvent.click(playBtn);
    expect(state.onStartTimer).toHaveBeenCalledWith('task_1');
  });

  it('Given editing task, When input value changes and blur, Then it should trigger rename', () => {
    const state = setupMockState({ editingId: 'task_1', editName: 'Task One Custom' });
    render(<TaskListView state={state} isCondensed={false} />);
    const input = screen.getByDisplayValue('Task One Custom');
    fireEvent.change(input, { target: { value: 'Task One Renamed' } });
    fireEvent.blur(input);
    expect(state.onRenameTask).toHaveBeenCalledWith('task_1', 'Task One Renamed');
    expect(state.setEditingId).toHaveBeenCalledWith(null);
  });

  it('Given root task, When subtask button clicked, Then it should open the subtask form and allow submitting a new subtask', () => {
    const state = setupMockState({ showSubtaskFormForId: 'task_1' });
    render(<TaskListView state={state} isCondensed={false} />);

    const submitBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(submitBtn);

    expect(state.onAddTask).toHaveBeenCalledWith('proj_1', 'New Subtask', 'task_1');
    expect(state.setNewSubtaskName).toHaveBeenCalledWith('');
    expect(state.setShowSubtaskFormForId).toHaveBeenCalledWith(null);
  });

  it('Given subtask, When complete button clicked, Then it should toggle subtask completion', () => {
    const state = setupMockState();
    render(<TaskListView state={state} isCondensed={false} />);

    const checkBtn = document.getElementById('check-subtask-subtask_1') as HTMLElement;
    fireEvent.click(checkBtn);

    expect(state.onToggleTaskComplete).toHaveBeenCalledWith('subtask_1');
  });

  it('Given subtask, When delete button clicked, Then it should trigger onDeleteTask', () => {
    const state = setupMockState();
    render(<TaskListView state={state} isCondensed={false} />);

    const deleteBtn = screen.getByTitle('Usuń podzadanie');
    fireEvent.click(deleteBtn);

    expect(state.onDeleteTask).toHaveBeenCalledWith('subtask_1');
  });

  it('Given editing task, When Enter is pressed in rename input, Then it should trigger rename', () => {
    const state = setupMockState({ editingId: 'task_1', editName: 'Task One Custom' });
    render(<TaskListView state={state} isCondensed={false} />);

    const input = screen.getByDisplayValue('Task One Custom');
    fireEvent.change(input, { target: { value: 'Task One Renamed' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(state.onRenameTask).toHaveBeenCalledWith('task_1', 'Task One Renamed');
    expect(state.setEditingId).toHaveBeenCalledWith(null);
  });

  it('Given editing task, When Escape is pressed in rename input, Then it should cancel edit', () => {
    const state = setupMockState({ editingId: 'task_1', editName: 'Task One Custom' });
    render(<TaskListView state={state} isCondensed={false} />);

    const input = screen.getByDisplayValue('Task One Custom');
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    expect(state.setEditingId).toHaveBeenCalledWith(null);
  });

  it('Given running subtask timer, When stop button clicked, Then it should stop subtask timer', () => {
    const state = setupMockState({
      logs: [
        { id: 'l2', taskId: 'subtask_1', projectId: 'proj_1', startTime: '2026-06-15T12:00:00Z', endTime: null }
      ]
    });
    render(<TaskListView state={state} isCondensed={false} />);

    const stopBtn = document.getElementById('stop-subtask-btn-subtask_1') as HTMLElement;
    fireEvent.click(stopBtn);

    expect(state.onStartTimer).toHaveBeenCalledWith('subtask_1');
  });

  it('Given stopped subtask timer, When start button clicked, Then it should start subtask timer', () => {
    const state = setupMockState({ logs: [] });
    render(<TaskListView state={state} isCondensed={false} />);

    const startBtn = document.getElementById('start-subtask-btn-subtask_1') as HTMLElement;
    fireEvent.click(startBtn);

    expect(state.onStartTimer).toHaveBeenCalledWith('subtask_1');
  });

  it('Given subtask, When rename input blurs or Enter key is pressed, Then it should rename subtask', () => {
    const state = setupMockState({ editingId: 'subtask_1', editName: 'Subtask One Custom' });
    render(<TaskListView state={state} isCondensed={false} />);

    const input = screen.getByDisplayValue('Subtask One Custom');
    fireEvent.blur(input);
    expect(state.onRenameTask).toHaveBeenCalledWith('subtask_1', 'Subtask One Custom');
    expect(state.setEditingId).toHaveBeenCalledWith(null);
  });
});
