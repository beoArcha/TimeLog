import { vi } from 'vitest';
import type { RepositoryStateHook } from '@common/hooks/data/useRepositoryState';
import type { AsyncActionRunnerHook } from '@common/hooks/data/useAsyncActionRunner';
import type { useHolidaysManager } from '@common/hooks/data/useHolidaysManager';
import type { usePatchesManager } from '@common/hooks/data/usePatchesManager';

export const createMockRepositoryState = (
  overrides?: Partial<RepositoryStateHook>
): RepositoryStateHook => ({
  projects: [],
  setProjectsState: vi.fn(),
  tasks: [],
  setTasksState: vi.fn(),
  logs: [],
  setLogsState: vi.fn(),
  activeLog: null,
  setActiveLogState: vi.fn(),
  syncRepositoryState: vi.fn(),
  ...overrides,
});

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
