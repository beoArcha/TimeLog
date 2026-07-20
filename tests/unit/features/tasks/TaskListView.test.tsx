// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskListView from '@features/tasks/TaskListView';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';
import { EngineRouter } from '@common/engine/EngineRouter';

describe('Unit Tests: TaskListView', () => {
  const mockGetProjectStatistics = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProjectStatistics.mockResolvedValue({
      totalTasks: 0,
      completedTasks: 0,
      totalDurationSeconds: 0n
    });
    EngineRouter.getInstance().setImplementationForTesting({
      startTimer: vi.fn(),
      stopTimer: vi.fn(),
      editTimeLog: vi.fn(),
      getProjectStatistics: mockGetProjectStatistics,
    } as any);
  });

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

  it('should render project header card and empty tasks layout', async () => {
    render(<TaskListView state={mockState} isCondensed={false} />);
    expect(screen.getByText(/Selected Project/i)).not.toBeNull();

    await waitFor(() => {
      expect(mockGetProjectStatistics).toHaveBeenCalledWith('p1');
    });

    await screen.findByText('Total Duration');
  });
});
