// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SubtaskList } from '@features/tasks/components/TaskItem/SubtaskList';

describe('Unit Tests: SubtaskList', () => {
  const mockProps = {
    subTasks: [
      { id: 't2', projectId: 'p1', name: 'Subtask One', completed: false, createdAt: '2026-06-15T01:00:00Z', status: null, parentTaskId: 't1' }
    ],
    tasks: [],
    logs: [],
    nowIso: '2026-06-15T12:00:00Z',
    isCondensed: false,
    editingId: null,
    editName: '',
    theme: 'dark',
    locale: 'en' as const,
    customTranslations: {},
    th: {},
    onToggleTaskComplete: vi.fn(),
    onRenameTask: vi.fn(),
    onUpdateTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onStartTimer: vi.fn(),
    setEditingId: vi.fn(),
    setEditName: vi.fn(),
  };

  afterEach(() => {
    cleanup();
  });

  it('should render subtasks list', () => {
    render(<SubtaskList {...mockProps} />);
    expect(screen.getByText(/Subtask One/i)).not.toBeNull();
  });
});
