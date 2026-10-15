import { useState, useEffect, useMemo } from 'react';
import { EngineRouter } from '@common/engine/EngineRouter';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { useTranslation } from '@common/i18n/translator';
import { toast } from 'sonner';

interface UseProjectStatisticsProps {
  selectedProject: Project | null;
  tasks?: Task[];
  logs?: TimeLog[];
  nowIso?: string;
  metrics?: EngineComputedMetrics | null;
}

export interface UseProjectStatisticsResult {
  stats: ProjectStatistics | null;
  loading: boolean;
  error: string | null;
  projectDurationSeconds: number;
}

export function useProjectStatistics({
  selectedProject,
  metrics,
}: UseProjectStatisticsProps): UseProjectStatisticsResult {
  const projectId = selectedProject?.id ?? null;
  const projectMetric = projectId && metrics?.projects ? metrics.projects[projectId] : null;

  const [asyncState, setAsyncState] = useState<{
    projectId: string | null;
    stats: ProjectStatistics | null;
    error: string | null;
  }>({
    projectId: null,
    stats: null,
    error: null,
  });

  const { t: tCommon } = useTranslation('common');

  useEffect(() => {
    if (!projectId || projectMetric) {
      return;
    }

    let isMounted = true;
    const fetchStats = async () => {
      try {
        const data = await EngineRouter.getInstance().getProjectStatistics(projectId);
        if (isMounted) {
          setAsyncState({
            projectId,
            stats: data,
            error: null,
          });
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to load project statistics';
          setAsyncState({
            projectId,
            stats: null,
            error: message,
          });
          ErrorHandler.handle(err);
          const errorMsg = tCommon('ErrGeneric') || 'Error';
          toast.error(`${errorMsg}: Failed to load project statistics`);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [projectId, projectMetric, tCommon]);

  const stats = useMemo<ProjectStatistics | null>(() => {
    if (!projectId) return null;
    if (projectMetric) {
      return {
        totalDurationSec: projectMetric.totalElapsedSeconds,
        totalTasks: projectMetric.activeTaskCount + projectMetric.completedTaskCount,
        completedTasks: projectMetric.completedTaskCount,
      };
    }
    return asyncState.projectId === projectId ? asyncState.stats : null;
  }, [projectId, projectMetric, asyncState.projectId, asyncState.stats]);

  const loading = Boolean(projectId && !projectMetric && asyncState.projectId !== projectId);
  const error = projectId && asyncState.projectId === projectId ? asyncState.error : null;
  const projectDurationSeconds = stats
    ? (stats.totalDurationSec ?? (stats as unknown as { totalDurationSeconds?: number }).totalDurationSeconds ?? 0)
    : 0;

  return {
    stats,
    loading,
    error,
    projectDurationSeconds,
  };
}
