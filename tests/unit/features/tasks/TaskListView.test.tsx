// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskListView from '@features/tasks/TaskListView';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: TaskListView', () => {
  const mockState = {
    ...getMockOxyFlowState(),
    tasks: [],
    logs: [],
    nowIso: '2026-06-15T12:00:00Z',
    locale: 'en',
    customTranslations: {},
    theme: 'dark',
    selectedProject: { id: 'p1', name: 'Selected Project', color: 'indigo', createdAt: '2026-06-15', archived: false, description: null, icon: null, tags: null },
    rootTasks: [],
    onAddTask: vi.fn(),
  };

  it('should render project header card and empty tasks layout', () => {
    render(<TaskListView state={mockState} isCondensed={false} />);
    expect(screen.getByText(/Selected Project/i)).not.toBeNull();
  });
});
