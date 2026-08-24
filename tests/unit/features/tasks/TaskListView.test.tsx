import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TaskListView from '@features/tasks/TaskListView';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';
import { EngineRouter } from '@common/engine/EngineRouter';

describe('Unit Tests: TaskListView', () => {
  const mockGetProjectStatistics = vi.fn();

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProjectStatistics.mockResolvedValue({
      totalTasks: 0,
      completedTasks: 0,
      totalDurationSec: 0
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

  it('should render project header card with synchronous metrics immediately', async () => {
    const stateWithMetrics = {
      ...mockState,
      metrics: {
        snapshotNowIso: '2026-06-15T12:00:00Z',
        tasks: {},
        projects: {
          p1: {
            projectId: 'p1',
            totalElapsedSeconds: 7200,
            todayElapsedSeconds: 3600,
            thisWeekElapsedSeconds: 7200,
            activeTaskCount: 2,
            completedTaskCount: 1,
            isRunning: false,
          },
        },
      },
    };

    render(<TaskListView state={stateWithMetrics} isCondensed={false} />);
    expect(screen.getByText(/Selected Project/i)).not.toBeNull();
    expect(screen.getByText('Total Duration')).not.toBeNull();
    expect(screen.getByTestId('stats-cards-grid')).not.toBeNull();
    expect(screen.queryByTestId('stats-skeleton-grid')).toBeNull();
  });
});
