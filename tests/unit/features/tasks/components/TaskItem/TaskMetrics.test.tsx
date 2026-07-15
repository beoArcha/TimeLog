// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TaskMetrics } from '@features/tasks/components/TaskItem/TaskMetrics';
import { Task } from '@bindings/Task';

describe('Unit Tests: TaskMetrics', () => {
  const task: Task = { id: 't1', projectId: 'p1', name: 'Task One', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null };

  const mockProps = {
    rootTask: task,
    rootDuration: 3600,
    isCurrentRunning: false,
    isAnyRunning: false,
    isCondensed: false,
    showSubtaskFormForId: null,
    theme: 'dark',
    locale: 'en' as const,
    customTranslations: {},
    onStartTimer: vi.fn(),
    setShowSubtaskFormForId: vi.fn()
  };

  afterEach(() => {
    cleanup();
  });

  it('should calculate and display task duration seconds metrics', () => {
    render(<TaskMetrics {...mockProps} />);
    expect(screen.getByText(/01:00:00/i)).not.toBeNull();
  });
});
