import { useState, useEffect, useMemo } from 'react';
import { EngineRouter } from '@common/engine/EngineRouter';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { getProjectDurationSeconds } from '@/src/features/timelogs/utils/TimelogUtils';

interface UseProjectStatisticsProps {
  selectedProject: Project | null;
  tasks: Task[];
  logs: TimeLog[];
  nowIso: string;
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
}: UseProjectStatisticsProps): UseProjectStatisticsResult {
  const [stats, setStats] = useState<ProjectStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const projectId = selectedProject?.id ?? null;

  useEffect(() => {
    if (!projectId) {
      queueMicrotask(() => {
        setStats(null);
        setLoading(false);
        setError(null);
      });
      return;
    }

    let isMounted = true;
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await EngineRouter.getInstance().getProjectStatistics(projectId);
        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load project statistics');
          console.error('Failed to load project statistics:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [projectId, tasks, logs]);

  const projectDurationSeconds = useMemo(() => {
    if (!projectId) return 0;
    return getProjectDurationSeconds(projectId, tasks, logs, nowIso);
  }, [projectId, tasks, logs, nowIso]);

  return {
    stats,
    loading,
    error,
    projectDurationSeconds,
  };
}
