// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import TasksTable from '@features/db-explorer/components/TasksTable';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aTask, aProject } from '@tests/shared/builders/entity-builders';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/test-helpers';
import { Task } from '@bindings/Task';

describe('Unit Tests: TasksTable', () => {
  const setTasksMock = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const createMockState = (tasks: Task[]): OxyFlowState => ({
    ...getMockOxyFlowState(),
    projects: [aProject({ id: 'p1', name: 'Project Alpha' })],
    tasks,
    locale: 'en',
    customTranslations: {},
    setTasks: setTasksMock,
  });

  it('should render tasks list with completed TRUE and FALSE badges', () => {
    // Arrange
    const taskPending = aTask({ id: 't1', name: 'Pending Task', completed: false });
    const taskDone = aTask({ id: 't2', name: 'Done Task', completed: true });
    const state = createMockState([taskPending, taskDone]);

    // Act
    render(
      <MockProviders state={state}>
        <TasksTable />
      </MockProviders>
    );

    // Assert
    expect(screen.getByText('Pending Task')).toBeTruthy();
    expect(screen.getByText('Done Task')).toBeTruthy();
    expect(screen.getByText('FALSE')).toBeTruthy();
    expect(screen.getByText('TRUE')).toBeTruthy();
  });

  it('should open edit form and handle save', () => {
    // Arrange
    const task = aTask({ id: 't1', name: 'Task One', completed: false });
    const state = createMockState([task]);
    const { container } = render(
      <MockProviders state={state}>
        <TasksTable />
      </MockProviders>
    );

    // Act - click edit button
    const editBtn = container.querySelector('.lucide-pen-line')?.closest('button');
    expect(editBtn).not.toBeNull();
    fireEvent.click(editBtn!);

    // Change input value
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    fireEvent.change(input, { target: { value: 'Updated Task Name' } });

    // Click save button
    const saveBtn = container.querySelector('.lucide-check')?.closest('button');
    expect(saveBtn).not.toBeNull();
    fireEvent.click(saveBtn!);

    // Assert
    expect(setTasksMock).toHaveBeenCalledTimes(1);
  });

  it('should render headers without crashing when tasks list is empty', () => {
    // Arrange
    const state = createMockState([]);

    // Act
    const { container } = render(
      <MockProviders state={state}>
        <TasksTable />
      </MockProviders>
    );

    // Assert
    expect(screen.getByText('id')).toBeTruthy();
    expect(screen.getByText('name')).toBeTruthy();
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(0);
  });
});
