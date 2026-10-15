import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDataLifecycle } from '@common/hooks/data/useDataLifecycle';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';

describe('Unit Tests: useDataLifecycle Hook', () => {
  const router = PersistenceRouter.getInstance();

  const mockRepositoryState = {
    projects: [],
    setProjectsState: vi.fn(),
    tasks: [],
    setTasksState: vi.fn(),
    logs: [],
    setLogsState: vi.fn(),
    activeLog: null,
    setActiveLogState: vi.fn(),
    syncRepositoryState: vi.fn(),
  };

  const mockHolidaysManager = {
    holidays: [],
    setHolidaysState: vi.fn(),
    setHolidays: vi.fn(),
    handleAddHoliday: vi.fn(),
    handleDeleteHoliday: vi.fn(),
  };

  const mockPatchesManager = {
    patches: [],
    setPatchesState: vi.fn(),
    setPatches: vi.fn(),
  };

  const mockActionRunner = {
    isLoading: false,
    setIsLoading: vi.fn(),
    repositoryError: null,
    setRepositoryError: vi.fn(),
    runAction: vi.fn(async (_msg: string, fn: () => Promise<any>) => fn()),
  };

  const refreshComputedMetrics = vi.fn().mockResolvedValue(null);
  const onTaskSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hydrate repository state on mount', async () => {
    const loadedState = {
      projects: [{ id: 'p1', name: 'Proj 1', color: 'blue', createdAt: '2026-01-01' }],
      tasks: [{ id: 't1', projectId: 'p1', name: 'Task 1', createdAt: '2026-01-01', completed: false }],
      logs: [],
      activeLog: null,
    };
    vi.spyOn(router.core, 'load').mockResolvedValue(loadedState as any);
    vi.spyOn(router.holidays, 'getAll').mockResolvedValue([]);
    vi.spyOn(router.patches, 'getAll').mockResolvedValue([]);

    const { result } = renderHook(() =>
      useDataLifecycle({
        repositoryState: mockRepositoryState as any,
        holidaysManager: mockHolidaysManager as any,
        patchesManager: mockPatchesManager as any,
        actionRunner: mockActionRunner as any,
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
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, reload: vi.fn() } as any;

    const resetSpy = vi.spyOn(router.core, 'reset').mockResolvedValue({} as any);

    const { result } = renderHook(() =>
      useDataLifecycle({
        repositoryState: mockRepositoryState as any,
        holidaysManager: mockHolidaysManager as any,
        patchesManager: mockPatchesManager as any,
        actionRunner: mockActionRunner as any,
        refreshComputedMetrics,
      })
    );

    await act(async () => {
      await result.current.handleResetLocalStorage();
    });

    expect(resetSpy).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();

    (window as any).location = originalLocation;
  });
});
