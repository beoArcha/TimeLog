import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TasksTable from '@features/db-explorer/components/TasksTable';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: TasksTable', () => {
  const setTasksMock = vi.fn();
  const mockState: any = {
    ...getMockOxyFlowState(),
    tasks: [
      { id: 't1', projectId: 'p1', name: 'Task One', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null }
    ],
    locale: 'en',
    customTranslations: {},
    setTasks: setTasksMock
  };

  it('should render tasks list', () => {
    render(
      <MockProviders state={mockState}>
        <TasksTable />
      </MockProviders>
    );

    expect(screen.getByText(/Task One/i)).not.toBeNull();
  });

  it('should open edit form and handle save', () => {
    const { container } = render(
      <MockProviders state={mockState}>
        <TasksTable />
      </MockProviders>
    );

    const editBtn = container.querySelector('.lucide-pen-line')?.closest('button');
    expect(editBtn).not.toBeNull();
    fireEvent.click(editBtn!);

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    fireEvent.change(input, { target: { value: 'Updated Task Name' } });

    const saveBtn = container.querySelector('.lucide-check')?.closest('button');
    expect(saveBtn).not.toBeNull();
    fireEvent.click(saveBtn!);

    expect(setTasksMock).toHaveBeenCalled();
  });
});
