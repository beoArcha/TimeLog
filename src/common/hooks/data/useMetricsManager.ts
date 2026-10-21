import { useState } from 'react';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { EngineRouter } from '@common/engine/EngineRouter';

export const useMetricsManager = () => {
  const [computedMetrics, setComputedMetrics] = useState<EngineComputedMetrics | null>(null);
  const engine = EngineRouter.getInstance();

  const fetchComputedMetrics = async (nowIso?: string): Promise<EngineComputedMetrics | null> => {
    try {
      const metrics = await engine.metrics.getComputedMetrics(nowIso);
      setComputedMetrics(prev => {
        if (!prev) return metrics;
        const tasksEqual = JSON.stringify(prev.tasks) === JSON.stringify(metrics.tasks);
        const projectsEqual = JSON.stringify(prev.projects) === JSON.stringify(metrics.projects);
        if (tasksEqual && projectsEqual && prev.snapshotNowIso === metrics.snapshotNowIso) {
          return prev;
        }
        return metrics;
      });
      return metrics;
    } catch {
      return null;
    }
  };

  return {
    computedMetrics,
    setComputedMetrics,
    fetchComputedMetrics,
  };
};
