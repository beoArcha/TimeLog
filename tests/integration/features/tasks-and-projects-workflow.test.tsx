// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TaskListView, { TaskListViewState } from '@features/tasks/TaskListView';
import { SidebarProjectForm } from '@layouts/parts/sidebar/SidebarProjectForm';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';
import { setupMatchMediaMock } from '@tests/shared/test-helpers';

const createMockTaskListViewState = (overrides?: Partial<TaskListViewState>): TaskListViewState => ({
  tasks: [],
  logs: [],
  selectedProject: null,
  rootTasks: [],
  onAddTask: vi.fn(),
  ...overrides,
});

describe('Given Tasks and Projects integration workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('When user submits a new project via sidebar form', () => {
    it('Then it should invoke onAddProject with trimmed name and selected color', () => {
      // Given
      const addProjectSpy = vi.fn();

      render(
        <MockProviders>
          <SidebarProjectForm
            initialName="Project Epsilon"
            initialColor="rose"
            locale="en"
            onAddProject={addProjectSpy}
          />
        </MockProviders>
      );

      // When
      const submitBtn = screen.getByRole('button', { name: /save|create|add/i });
      fireEvent.click(submitBtn);

      // Then
      expect(addProjectSpy).toHaveBeenCalledWith('Project Epsilon', 'rose', null, null, null, false);
    });
  });

  describe('When a project is selected in TaskListView', () => {
    it('Then it should display project tasks and allow adding new root tasks', () => {
      // Given
      const project = aProject({ id: 'p1', name: 'Alpha Project', color: 'teal' });
      const task = aTask({ id: 't1', projectId: 'p1', name: 'Initial Task', completed: false });
      const onAddTaskSpy = vi.fn();

      const state = createMockTaskListViewState({
        tasks: [task],
        projectTasks: [task],
        rootTasks: [task],
        logs: [],
        selectedProject: project,
        onAddTask: onAddTaskSpy,
      });

      // When
      render(
        <MockProviders>
          <TaskListView state={state} isCondensed={false} />
        </MockProviders>
      );

      // Then
      expect(screen.getByText('Alpha Project')).toBeDefined();
      expect(screen.getByText('Initial Task')).toBeDefined();

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Subsystem Task' } });

      const addBtn = screen.getByRole('button', { name: /^Add Task$/i });
      fireEvent.click(addBtn);

      expect(onAddTaskSpy).toHaveBeenCalledWith('p1', 'New Subsystem Task', null);
    });
  });

  describe('When user starts timer on a task item', () => {
    it('Then it should invoke onStartTimer with target task ID', () => {
      // Given
      const project = aProject({ id: 'p1', name: 'Alpha Project' });
      const task = aTask({ id: 't1', projectId: 'p1', name: 'Timer Target Task', completed: false });
      const onStartTimerSpy = vi.fn();

      const state = createMockTaskListViewState({
        tasks: [task],
        projectTasks: [task],
        rootTasks: [task],
        logs: [],
        selectedProject: project,
        onAddTask: vi.fn(),
        onStartTimer: onStartTimerSpy,
      });

      render(
        <MockProviders>
          <TaskListView state={state} isCondensed={false} />
        </MockProviders>
      );

      // When
      const playBtn = screen.getByRole('button', { name: /start/i });
      expect(playBtn).toBeDefined();
      fireEvent.click(playBtn);

      // Then
      expect(onStartTimerSpy).toHaveBeenCalledWith('t1');
    });
  });

  describe('When user marks a task completed', () => {
    it('Then it should invoke onToggleTaskComplete with task ID', () => {
      // Given
      const project = aProject({ id: 'p1', name: 'Alpha Project' });
      const task = aTask({ id: 't1', projectId: 'p1', name: 'Checkable Task', completed: false });
      const onToggleCompleteSpy = vi.fn();

      const state = createMockTaskListViewState({
        tasks: [task],
        projectTasks: [task],
        rootTasks: [task],
        logs: [],
        selectedProject: project,
        onAddTask: vi.fn(),
        onToggleTaskComplete: onToggleCompleteSpy,
      });

      render(
        <MockProviders>
          <TaskListView state={state} isCondensed={false} />
        </MockProviders>
      );

      // When
      const checkBtn = screen.getByRole('checkbox');
      expect(checkBtn).toBeDefined();
      fireEvent.click(checkBtn);

      // Then
      expect(onToggleCompleteSpy).toHaveBeenCalledWith('t1');
    });
  });

  describe('When user opens subtask form under a parent task and submits', () => {
    it('Then it should invoke onAddTask with parent ID parameter', () => {
      // Given
      const project = aProject({ id: 'p1', name: 'Alpha Project' });
      const parentTask = aTask({ id: 't1', projectId: 'p1', name: 'Parent Task', parentTaskId: null });
      const onAddTaskSpy = vi.fn();

      const state = createMockTaskListViewState({
        tasks: [parentTask],
        projectTasks: [parentTask],
        rootTasks: [parentTask],
        logs: [],
        selectedProject: project,
        onAddTask: onAddTaskSpy,
        showSubtaskFormForId: 't1',
        newSubtaskName: 'Child Subtask A',
      });

      render(
        <MockProviders>
          <TaskListView state={state} isCondensed={false} />
        </MockProviders>
      );

      // When
      const subtaskInput = screen.getByDisplayValue('Child Subtask A');
      const addSubtaskBtn = subtaskInput.closest('form')?.querySelector('button[type="submit"]');
      expect(addSubtaskBtn).toBeDefined();
      fireEvent.click(addSubtaskBtn!);

      // Then
      expect(onAddTaskSpy).toHaveBeenCalledWith('p1', 'Child Subtask A', 't1');
    });
  });
});
