import { useState, useEffect, useRef } from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { RepositoryStateHook } from './useRepositoryState';
import { AsyncActionRunnerHook } from './useAsyncActionRunner';
import { useHolidaysManager } from './useHolidaysManager';
import { usePatchesManager } from './usePatchesManager';

export interface UseDataLifecycleOptions {
  repositoryState: RepositoryStateHook;
  holidaysManager: ReturnType<typeof useHolidaysManager>;
  patchesManager: ReturnType<typeof usePatchesManager>;
  actionRunner: AsyncActionRunnerHook;
  refreshComputedMetrics: (nowIso?: string) => Promise<unknown>;
  onTaskSelected?: (taskId: string | null) => void;
}

export const useDataLifecycle = ({
  repositoryState,
  holidaysManager,
  patchesManager,
  actionRunner,
  refreshComputedMetrics,
  onTaskSelected,
}: UseDataLifecycleOptions) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [engineState, setEngineState] = useState<'searching' | 'connected'>('connected');
  const isResetting = useRef(false);

  const initDepsRef = useRef({
    actionRunner,
    repositoryState,
    holidaysManager,
    patchesManager,
    refreshComputedMetrics,
    onTaskSelected,
  });

  useEffect(() => {
    initDepsRef.current = {
      actionRunner,
      repositoryState,
      holidaysManager,
      patchesManager,
      refreshComputedMetrics,
      onTaskSelected,
    };
  });

  const refreshData = async () => {
    const deps = initDepsRef.current;
    await deps.actionRunner.runAction('Failed to load repository state', async () => {
      const router = PersistenceRouter.getInstance();
      const [state, loadedHolidays, loadedPatches] = await Promise.all([
        router.core.load(),
        router.holidays.getAll(),
        router.patches.getAll(),
      ]);

      if (state !== null) {
        deps.repositoryState.setProjectsState(state.projects);
        deps.repositoryState.setTasksState(state.tasks);
        deps.repositoryState.setLogsState(state.logs);
        deps.repositoryState.setActiveLogState(state.activeLog);
        deps.repositoryState.setActiveLogsState(state.activeLogs ?? (state.activeLog ? [state.activeLog] : []));
        deps.onTaskSelected?.(state.tasks?.[0]?.id ?? null);
      }
      deps.holidaysManager.setHolidaysState(loadedHolidays);
      deps.patchesManager.setPatchesState(loadedPatches);
      await deps.refreshComputedMetrics();
    });
  };

  useEffect(() => {
    const init = async () => {
      await refreshData();
      setIsInitialized(true);
    };

    init();
  }, []);

  const handleResetLocalStorage = async () => {
    isResetting.current = true;
    await actionRunner.runAction('Failed to reset storage', async () => {
      await PersistenceRouter.getInstance().core.reset();
      window.location.reload();
    });
  };

  const handleRestoreState = async (data: {
    projects?: Project[];
    tasks?: Task[];
    logs?: TimeLog[];
    holidays?: HolidayLeave[];
    patches?: PatchLog[];
  }) => {
    await actionRunner.runAction(
      'Failed to restore database state',
      async () => {
        const payload: Partial<TimerRepositoryState> = {};
        if (data.projects) payload.projects = data.projects;
        if (data.tasks) payload.tasks = data.tasks;
        if (data.logs) payload.logs = data.logs;

        const nextState = await PersistenceRouter.getInstance().core.overrideState(payload);

        if (data.projects) repositoryState.setProjectsState(nextState.projects);
        if (data.tasks) repositoryState.setTasksState(nextState.tasks);
        if (data.logs) repositoryState.setLogsState(nextState.logs);
        if (nextState.activeLog !== undefined) {
          repositoryState.setActiveLogState(nextState.activeLog);
          repositoryState.setActiveLogsState(nextState.activeLogs ?? (nextState.activeLog ? [nextState.activeLog] : []));
        }

        if (data.holidays) await holidaysManager.setHolidays(data.holidays);
        if (data.patches) await patchesManager.setPatches(data.patches);
        await refreshComputedMetrics();
      },
      { errorCode: 'ERR_REPOSITORY_RESTORE', rethrow: true }
    );
  };

  return {
    isInitialized,
    setIsInitialized,
    engineState,
    setEngineState,
    isResetting,
    handleResetLocalStorage,
    handleRestoreState,
    refreshData,
  };
};

export type DataLifecycleHook = ReturnType<typeof useDataLifecycle>;
