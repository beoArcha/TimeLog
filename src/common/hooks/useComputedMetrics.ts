import { useData } from './DataContext';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { TaskComputedMetrics } from '@bindings/TaskComputedMetrics';
import { ProjectComputedMetrics } from '@bindings/ProjectComputedMetrics';

export const useComputedMetrics = (): {
  metrics: EngineComputedMetrics | null;
  getTaskMetrics: (taskId: string) => TaskComputedMetrics | undefined;
  getProjectMetrics: (projectId: string) => ProjectComputedMetrics | undefined;
  refreshComputedMetrics: (nowIso?: string) => Promise<EngineComputedMetrics | null>;
} => {
  const { computedMetrics, refreshComputedMetrics } = useData();

  const getTaskMetrics = (taskId: string): TaskComputedMetrics | undefined => {
    return computedMetrics?.tasks[taskId];
  };

  const getProjectMetrics = (projectId: string): ProjectComputedMetrics | undefined => {
    return computedMetrics?.projects[projectId];
  };

  return {
    metrics: computedMetrics,
    getTaskMetrics,
    getProjectMetrics,
    refreshComputedMetrics,
  };
};
