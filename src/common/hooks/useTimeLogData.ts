import { useHolidaysManager } from './data/useHolidaysManager';
import { usePatchesManager } from './data/usePatchesManager';
import { useMetricsManager } from './data/useMetricsManager';
import { useRepositoryState } from './data/useRepositoryState';
import { useAsyncActionRunner } from './data/useAsyncActionRunner';
import { useDataLifecycle } from './data/useDataLifecycle';
import { useProjectsManager } from './data/useProjectsManager';
import { useTasksManager } from './data/useTasksManager';
import { useTimerManager } from './data/useTimerManager';
import { ApiPayload } from '../persistence/IPersistence';

export { type ApiPayload };

export const useTimeLogData = (pushToApi: (payload: ApiPayload, logMsg: string) => void) => {
  const repositoryState = useRepositoryState();
  const actionRunner = useAsyncActionRunner();
  const { isLoading, repositoryError, setRepositoryError } = actionRunner;

  const metricsManager = useMetricsManager();
  const { fetchComputedMetrics } = metricsManager;

  const holidaysManager = useHolidaysManager({ onError: setRepositoryError });
  const patchesManager = usePatchesManager({ onError: setRepositoryError });

  const projectsManager = useProjectsManager({
    repositoryState,
    actionRunner,
    refreshComputedMetrics: fetchComputedMetrics,
  });

  const tasksManager = useTasksManager({
    repositoryState,
    actionRunner,
    refreshComputedMetrics: fetchComputedMetrics,
  });

  const timerManager = useTimerManager({
    repositoryState,
    actionRunner,
    pushToApi,
    refreshComputedMetrics: fetchComputedMetrics,
  });

  const lifecycle = useDataLifecycle({
    repositoryState,
    holidaysManager,
    patchesManager,
    actionRunner,
    refreshComputedMetrics: fetchComputedMetrics,
    onTaskSelected: tasksManager.setSelectedTaskId,
  });

  return {
    ...repositoryState,
    ...lifecycle,
    ...metricsManager,
    refreshComputedMetrics: fetchComputedMetrics,
    ...holidaysManager,
    ...patchesManager,
    ...projectsManager,
    ...tasksManager,
    ...timerManager,
    isLoading,
    repositoryError,
  };
};
