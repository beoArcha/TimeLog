import { useState, useEffect, useMemo } from 'react';
import { EngineRouter } from '@common/engine/EngineRouter';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { getProjectDurationSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { translate } from '@common/i18n/i18n';
import { toast } from 'sonner';
import { Locale } from '@bindings/Locale';

interface UseProjectStatisticsProps {
  selectedProject: Project | null;
  tasks: Task[];
  logs: TimeLog[];
  nowIso: string;
  locale?: Locale;
  customTranslations?: any;
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
  locale,
  customTranslations,
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
          ErrorHandler.handle(err);
          const errorMsg = translate(locale || 'en', 'common.error', customTranslations) || 'Error';
          toast.error(`${errorMsg}: Failed to load project statistics`);
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
  }, [projectId, tasks, logs, locale, customTranslations]);

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
