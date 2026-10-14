import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { TaskComputedMetrics } from '@bindings/TaskComputedMetrics';
import { ProjectComputedMetrics } from '@bindings/ProjectComputedMetrics';
import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';

export {
  type EngineComputedMetrics,
  type TaskComputedMetrics,
  type ProjectComputedMetrics,
  type ElapsedRangeFilter,
};

export interface IEngine {
  startTimer(taskId: string): Promise<void>;
  stopTimer(projectId?: string): Promise<void>;
  resumeTimer?(taskId: string): Promise<void>;
  getActiveLogs?(): Promise<string[]>;

  getComputedMetrics?(nowIso?: string): Promise<EngineComputedMetrics>;
  getTaskElapsed?(taskId: string, nowIso?: string): Promise<number>;
  getProjectElapsed?(projectId: string, nowIso?: string): Promise<number>;
  getElapsedRange?(range: ElapsedRangeFilter, nowIso?: string): Promise<number>;
  getProjectStatistics(projectId: string): Promise<ProjectStatistics>;

  editTimeLog(
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ): Promise<void>;
}
