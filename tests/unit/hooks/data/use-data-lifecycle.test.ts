import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDataLifecycle } from '@common/hooks/data/useDataLifecycle';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import {
  createMockRepositoryState,
  createMockActionRunner,
  createMockHolidaysManager,
  createMockPatchesManager,
} from './test-doubles';

describe('Unit Tests: useDataLifecycle Hook', () => {
  const router = PersistenceRouter.getInstance();

  const mockRepositoryState = createMockRepositoryState();
  const mockHolidaysManager = createMockHolidaysManager();
  const mockPatchesManager = createMockPatchesManager();
  const mockActionRunner = createMockActionRunner();

  const refreshComputedMetrics = vi.fn().mockResolvedValue(null);
  const onTaskSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hydrate repository state on mount', async () => {
    const loadedState: TimerRepositoryState = {
      projects: [{ id: 'p1', name: 'Proj 1', color: 'blue', createdAt: '2026-01-01', archived: false, description: null, icon: null, tags: null }],
      tasks: [{ id: 't1', projectId: 'p1', name: 'Task 1', createdAt: '2026-01-01', completed: false, status: null, parentTaskId: null }],
      logs: [],
      activeLog: null,
    };
    vi.spyOn(router.core, 'load').mockResolvedValue(loadedState);
    vi.spyOn(router.holidays, 'getAll').mockResolvedValue([]);
    vi.spyOn(router.patches, 'getAll').mockResolvedValue([]);

    const { result } = renderHook(() =>
      useDataLifecycle({
        repositoryState: mockRepositoryState,
        holidaysManager: mockHolidaysManager,
        patchesManager: mockPatchesManager,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
        onTaskSelected,
      })
    );

    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    expect(mockRepositoryState.setProjectsState).toHaveBeenCalledWith(loadedState.projects);
    expect(mockRepositoryState.setTasksState).toHaveBeenCalledWith(loadedState.tasks);
    expect(onTaskSelected).toHaveBeenCalledWith('t1');
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should reset storage and trigger window reload on handleResetLocalStorage', async () => {
    const reloadMock = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadMock },
    });

    const resetSpy = vi.spyOn(router.core, 'reset').mockResolvedValue({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    const { result } = renderHook(() =>
      useDataLifecycle({
        repositoryState: mockRepositoryState,
        holidaysManager: mockHolidaysManager,
        patchesManager: mockPatchesManager,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
      })
    );

    await act(async () => {
      await result.current.handleResetLocalStorage();
    });

    expect(resetSpy).toHaveBeenCalled();
    expect(reloadMock).toHaveBeenCalled();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });
});
