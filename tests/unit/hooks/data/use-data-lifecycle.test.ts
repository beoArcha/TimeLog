import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDataLifecycle } from '@common/hooks/data/useDataLifecycle';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should hydrate repository state on mount when state exists', async () => {
    // Arrange
    const loadedState: TimerRepositoryState = {
      projects: [aProject({ id: 'p1', name: 'Proj 1', color: 'blue' })],
      tasks: [aTask({ id: 't1', projectId: 'p1', name: 'Task 1' })],
      logs: [],
      activeLog: null,
    };
    vi.spyOn(router.core, 'load').mockResolvedValue(loadedState);
    vi.spyOn(router.holidays, 'getAll').mockResolvedValue([]);
    vi.spyOn(router.patches, 'getAll').mockResolvedValue([]);

    // Act
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

    // Assert
    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    expect(mockRepositoryState.setProjectsState).toHaveBeenCalledWith(loadedState.projects);
    expect(mockRepositoryState.setTasksState).toHaveBeenCalledWith(loadedState.tasks);
    expect(onTaskSelected).toHaveBeenCalledWith('t1');
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should handle null state gracefully on mount', async () => {
    // Arrange
    vi.spyOn(router.core, 'load').mockResolvedValue(null);
    vi.spyOn(router.holidays, 'getAll').mockResolvedValue([]);
    vi.spyOn(router.patches, 'getAll').mockResolvedValue([]);

    // Act
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

    // Assert
    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    expect(mockRepositoryState.setProjectsState).not.toHaveBeenCalled();
    expect(mockRepositoryState.setTasksState).not.toHaveBeenCalled();
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should reset storage and trigger window reload on handleResetLocalStorage', async () => {
    // Arrange
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

    // Act
    await act(async () => {
      await result.current.handleResetLocalStorage();
    });

    // Assert
    expect(resetSpy).toHaveBeenCalled();
    expect(reloadMock).toHaveBeenCalled();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('should restore database state via handleRestoreState', async () => {
    // Arrange
    const restoreProjects = [aProject({ id: 'p-restored' })];
    const restoreTasks = [aTask({ id: 't-restored' })];
    const overrideResult: TimerRepositoryState = {
      projects: restoreProjects,
      tasks: restoreTasks,
      logs: [],
      activeLog: null,
    };
    vi.spyOn(router.core, 'overrideState').mockResolvedValue(overrideResult);

    const { result } = renderHook(() =>
      useDataLifecycle({
        repositoryState: mockRepositoryState,
        holidaysManager: mockHolidaysManager,
        patchesManager: mockPatchesManager,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
      })
    );

    // Act
    await act(async () => {
      await result.current.handleRestoreState({
        projects: restoreProjects,
        tasks: restoreTasks,
        logs: [],
        holidays: [],
        patches: [],
      });
    });

    // Assert
    expect(router.core.overrideState).toHaveBeenCalledWith({
      projects: restoreProjects,
      tasks: restoreTasks,
      logs: [],
    });
    expect(mockRepositoryState.setProjectsState).toHaveBeenCalledWith(restoreProjects);
    expect(mockRepositoryState.setTasksState).toHaveBeenCalledWith(restoreTasks);
    expect(mockHolidaysManager.setHolidays).toHaveBeenCalledWith([]);
    expect(mockPatchesManager.setPatches).toHaveBeenCalledWith([]);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should return true when refreshData completes successfully', async () => {
    vi.spyOn(router.core, 'load').mockResolvedValue({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });
    vi.spyOn(router.holidays, 'getAll').mockResolvedValue([]);
    vi.spyOn(router.patches, 'getAll').mockResolvedValue([]);

    const { result } = renderHook(() =>
      useDataLifecycle({
        repositoryState: mockRepositoryState,
        holidaysManager: mockHolidaysManager,
        patchesManager: mockPatchesManager,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
      })
    );

    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    let refreshed: boolean | undefined;
    await act(async () => {
      refreshed = await result.current.refreshData();
    });

    expect(refreshed).toBe(true);
  });

  it('should return false when refreshData fails instead of reporting a false success', async () => {
    vi.spyOn(router.core, 'load').mockRejectedValue(new Error('Repository unavailable'));
    vi.spyOn(router.holidays, 'getAll').mockResolvedValue([]);
    vi.spyOn(router.patches, 'getAll').mockResolvedValue([]);

    const runAction = vi.fn(async (_message: string, action: () => Promise<unknown>) => {
      try {
        return await action();
      } catch {
        return undefined;
      }
    }) as unknown as typeof mockActionRunner.runAction;
    const actionRunner = createMockActionRunner({ runAction });

    const { result } = renderHook(() =>
      useDataLifecycle({
        repositoryState: mockRepositoryState,
        holidaysManager: mockHolidaysManager,
        patchesManager: mockPatchesManager,
        actionRunner,
        refreshComputedMetrics,
      })
    );

    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    let refreshed: boolean | undefined;
    await act(async () => {
      refreshed = await result.current.refreshData();
    });

    expect(refreshed).toBe(false);
  });

  it('should manage engineState correctly', () => {
    // Arrange
    const { result } = renderHook(() =>
      useDataLifecycle({
        repositoryState: mockRepositoryState,
        holidaysManager: mockHolidaysManager,
        patchesManager: mockPatchesManager,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
      })
    );

    expect(result.current.engineState).toBe('connected');

    // Act
    act(() => {
      result.current.setEngineState('searching');
    });

    // Assert
    expect(result.current.engineState).toBe('searching');
  });
});
