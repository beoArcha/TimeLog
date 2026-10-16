// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import TimeLogsTable from '@features/db-explorer/components/TimeLogsTable';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aTimeLog, aProject, aTask } from '@tests/shared/builders/entity-builders';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: TimeLogsTable', () => {
  afterEach(() => {
    cleanup();
  });

  const createMockState = (logs = [aTimeLog({ id: 'l1', taskId: 't1', projectId: 'p1', note: 'Session 1' })]): OxyFlowState => ({
    ...getMockOxyFlowState(),
    projects: [aProject({ id: 'p1', name: 'Project Alpha' })],
    tasks: [aTask({ id: 't1', projectId: 'p1', name: 'Task Alpha' })],
    logs,
    locale: 'en',
    customTranslations: {},
  });

  it('should render table headers and realistic log row presentation', () => {
    // Arrange
    const state = createMockState();

    // Act
    const { container } = render(
      <MockProviders state={state}>
        <TimeLogsTable />
      </MockProviders>
    );

    // Assert
    expect(screen.getByText('id')).toBeTruthy();
    expect(screen.getByText('task_id')).toBeTruthy();
    expect(screen.getByText('note')).toBeTruthy();

    expect(screen.getByText('l1')).toBeTruthy();
    expect(screen.getByText('Session 1')).toBeTruthy();

    const table = container.querySelector('table');
    expect(table).not.toBeNull();
  });

  it('should toggle manual add log form when add log button is clicked', () => {
    // Arrange
    const state = createMockState();
    const { container } = render(
      <MockProviders state={state}>
        <TimeLogsTable />
      </MockProviders>
    );

    // Act - find the add log manually button in headerRight
    const addBtn = container.querySelector('button');
    expect(addBtn).not.toBeNull();
    fireEvent.click(addBtn!);

    // Assert - form elements should appear
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
  });
});
