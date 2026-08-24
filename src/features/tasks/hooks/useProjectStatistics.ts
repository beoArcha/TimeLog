import { useState, useEffect, useMemo } from 'react';
import { EngineRouter } from '@common/engine/EngineRouter';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { getProjectDurationSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { useTranslation } from '@common/i18n/translator';
import { toast } from 'sonner';

interface UseProjectStatisticsProps {
  selectedProject: Project | null;
  tasks: Task[];
  logs: TimeLog[];
  nowIso?: string;
  metrics?: import('@bindings/EngineComputedMetrics').EngineComputedMetrics | null;
}

export interface UseProjectStatisticsResult {
  stats: ProjectStatistics | null;
  loading: boolean;
  error: string | null;
  projectDurationSeconds: number;
}

export function useProjectStatistics({
  selectedProject,
  tasks,
  logs,
  nowIso,
  metrics,
}: UseProjectStatisticsProps): UseProjectStatisticsResult {
  const [asyncStats, setAsyncStats] = useState<ProjectStatistics | null>(null);
  const [asyncLoading, setAsyncLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t: tCommon } = useTranslation('common');

  const projectId = selectedProject?.id ?? null;
  const projectMetric = projectId && metrics?.projects ? metrics.projects[projectId] : null;

  const projectDurationSeconds = useMemo(() => {
    if (!projectId) return 0;
    if (projectMetric) {
      return projectMetric.totalElapsedSeconds;
    }
    return nowIso ? getProjectDurationSeconds(projectId, tasks, logs, nowIso) : 0;
  }, [projectId, projectMetric, tasks, logs, nowIso]);

  const statsFromMetrics = useMemo<ProjectStatistics | null>(() => {
    if (!projectId || !projectMetric) return null;
    return {
      totalDurationSec: projectMetric.totalElapsedSeconds,
      totalTasks: projectMetric.activeTaskCount + projectMetric.completedTaskCount,
      completedTasks: projectMetric.completedTaskCount,
    };
  }, [projectId, projectMetric]);

  const fallbackStats = useMemo<ProjectStatistics | null>(() => {
    if (!projectId) return null;
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.completed).length;
    return {
      totalDurationSec: projectDurationSeconds,
      totalTasks,
      completedTasks,
    };
  }, [projectId, tasks, projectDurationSeconds]);


  useEffect(() => {
    if (!projectId || projectMetric) {
      return;
    }

    let isMounted = true;
    const fetchStats = async () => {
      try {
        setAsyncLoading(true);
        const data = await EngineRouter.getInstance().getProjectStatistics(projectId);
        if (isMounted) {
          setAsyncStats(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load project statistics');
          ErrorHandler.handle(err);
          const errorMsg = tCommon('ErrGeneric') || 'Error';
          toast.error(`${errorMsg}: Failed to load project statistics`);
        }
      } finally {
        if (isMounted) {
          setAsyncLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [projectId, projectMetric, tCommon]);

  const stats = statsFromMetrics ?? asyncStats ?? fallbackStats;
  const loading = projectMetric ? false : asyncLoading;

  return {
    stats,
    loading,
    error: projectId ? error : null,
    projectDurationSeconds,
  };
}
