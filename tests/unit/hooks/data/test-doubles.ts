import { vi } from 'vitest';
import type { RepositoryStateHook } from '@common/hooks/data/useRepositoryState';
import type { AsyncActionRunnerHook } from '@common/hooks/data/useAsyncActionRunner';
import type { useHolidaysManager } from '@common/hooks/data/useHolidaysManager';
import type { usePatchesManager } from '@common/hooks/data/usePatchesManager';
import type { TimerRepositoryState } from '@bindings/TimerRepositoryState';

export const createMockRepositoryState = (
  overrides?: Partial<RepositoryStateHook>
): RepositoryStateHook => {
  const setProjectsState = overrides?.setProjectsState ?? vi.fn();
  const setTasksState = overrides?.setTasksState ?? vi.fn();
  const setLogsState = overrides?.setLogsState ?? vi.fn();
  const setActiveLogState = overrides?.setActiveLogState ?? vi.fn();
  const setActiveLogsState = overrides?.setActiveLogsState ?? vi.fn();
  const syncRepositoryState =
    overrides?.syncRepositoryState ??
    vi.fn((nextState: Partial<TimerRepositoryState>) => {
      if (nextState.projects !== undefined) setProjectsState(nextState.projects);
      if (nextState.tasks !== undefined) setTasksState(nextState.tasks);
      if (nextState.logs !== undefined) setLogsState(nextState.logs);
      if (nextState.activeLog !== undefined) setActiveLogState(nextState.activeLog);
      if (nextState.activeLogs !== undefined) {
        setActiveLogsState(nextState.activeLogs);
      } else if (nextState.activeLog !== undefined) {
        setActiveLogsState(nextState.activeLog ? [nextState.activeLog] : []);
      }
    });

  return {
    projects: [],
    setProjectsState,
    tasks: [],
    setTasksState,
    logs: [],
    setLogsState,
    activeLog: null,
    setActiveLogState,
    activeLogs: [],
    setActiveLogsState,
    syncRepositoryState,
    ...overrides,
  };
};

export const createMockActionRunner = (
  overrides?: Partial<AsyncActionRunnerHook>
): AsyncActionRunnerHook => ({
  isLoading: false,
  setIsLoading: vi.fn(),
  repositoryError: null,
  setRepositoryError: vi.fn(),
  runAction: vi.fn().mockImplementation(async <T>(_msg: string, action: () => Promise<T>): Promise<T | undefined> => action()) as AsyncActionRunnerHook['runAction'],
  ...overrides,
});

export const createMockHolidaysManager = (
  overrides?: Partial<ReturnType<typeof useHolidaysManager>>
): ReturnType<typeof useHolidaysManager> => ({
  holidays: [],
  setHolidaysState: vi.fn(),
  setHolidays: vi.fn(),
  handleAddHoliday: vi.fn(),
  handleUpdateHoliday: vi.fn(),
  handleDeleteHoliday: vi.fn(),
  ...overrides,
});

export const createMockPatchesManager = (
  overrides?: Partial<ReturnType<typeof usePatchesManager>>
): ReturnType<typeof usePatchesManager> => ({
  patches: [],
  setPatchesState: vi.fn(),
  setPatches: vi.fn(),
  ...overrides,
});
