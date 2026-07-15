// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import TaskItem from '@features/tasks/components/TaskItem/TaskItem';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';
import { Task } from '@bindings/Task';

describe('Unit Tests: TaskItem', () => {
  const task: Task = { id: 't1', projectId: 'p1', name: 'Task Item Name', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null };

  const mockState = {
    ...getMockOxyFlowState(),
    locale: 'en',
    customTranslations: {},
    tasks: [task],
    logs: [],
    nowIso: '2026-06-15T12:00:00Z',
    theme: 'dark',
    projectTasks: [task],
    selectedProject: { id: 'p1', name: 'Proj 1', color: 'indigo', createdAt: '2026-06-15', archived: false, description: null, icon: null, tags: null },
    onToggleTaskComplete: vi.fn(),
    onRenameTask: vi.fn(),
    onUpdateTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onStartTimer: vi.fn(),
    onAddTask: vi.fn(),
  };

  afterEach(() => {
    cleanup();
  });

  it('should render task item details', () => {
    render(
      <TaskItem
        rootTask={task}
        state={mockState}
        isCondensed={false}
        th={{}}
      />
    );

    expect(screen.getByText(/Task Item Name/i)).not.toBeNull();
  });
});
