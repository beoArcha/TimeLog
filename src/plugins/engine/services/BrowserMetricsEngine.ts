import {
  IMetricsEngine,
  EngineComputedMetrics,
  ElapsedRangeFilter,
  RangeMetricsResult,
} from '@common/engine/IEngine';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import {
  calculateProjectElapsed,
  calculateTaskElapsed,
  calculateElapsedRange,
  calculateRangeMetrics,
  computeAllMetrics,
} from '../elapsed';

export class BrowserMetricsEngine implements IMetricsEngine {
  private persistence: PersistenceRouter;

  constructor(persistence?: PersistenceRouter) {
    this.persistence = persistence ?? PersistenceRouter.getInstance();
  }

  async getComputedMetrics(nowIso?: string): Promise<EngineComputedMetrics> {
    const state = await this.persistence.core.load();
    if (!state) {
      return {
        snapshotNowIso: nowIso || new Date().toISOString(),
        tasks: {},
        projects: {},
      };
    }
    return computeAllMetrics(state.tasks, state.logs, state.projects, nowIso);
  }

  async getTaskElapsed(taskId: string, nowIso?: string): Promise<number> {
    const state = await this.persistence.core.load();
    if (!state) {
      return 0;
    }
    return calculateTaskElapsed(taskId, state.tasks, state.logs, nowIso);
  }

  async getProjectElapsed(projectId: string, nowIso?: string): Promise<number> {
    const state = await this.persistence.core.load();
    if (!state) {
      return 0;
    }
    return calculateProjectElapsed(projectId, state.tasks, state.logs, nowIso);
  }

  async getElapsedRange(range: ElapsedRangeFilter, nowIso?: string): Promise<number> {
    const state = await this.persistence.core.load();
    if (!state) {
      return 0;
    }
    return calculateElapsedRange(range, state.tasks, state.logs, nowIso);
  }

  async getRangeMetrics(range: ElapsedRangeFilter, nowIso?: string): Promise<RangeMetricsResult> {
    const state = await this.persistence.core.load();
    if (!state) {
      return {
        totalSeconds: 0,
        projectElapsed: {},
        taskElapsed: {},
        clampedLogs: [],
      };
    }
    const patches = range.includePatches ? await this.persistence.patches.getAll() : [];
    return calculateRangeMetrics(range, state.tasks, state.logs, nowIso, patches);
  }

  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    const state = await this.persistence.core.load();
    if (!state) {
      return { totalDurationSec: 0, totalTasks: 0, completedTasks: 0 };
    }

    const projectTasks = state.tasks.filter((t) => t.projectId === projectId);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter((t) => t.completed).length;
    const totalDurationSec = calculateProjectElapsed(projectId, state.tasks, state.logs);

    return {
      totalDurationSec,
      totalTasks,
      completedTasks,
    };
  }
}
