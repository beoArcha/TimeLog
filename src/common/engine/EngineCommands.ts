import {
  IEngine,
  ITimerEngine,
  IMetricsEngine,
  ITimeLogsEngine,
  IValidationEngine,
  EngineComputedMetrics,
  ElapsedRangeFilter,
} from './IEngine';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TauriTimerEngine } from './commands/TauriTimerEngine';
import { TauriMetricsEngine } from './commands/TauriMetricsEngine';
import { TauriTimeLogsEngine } from './commands/TauriTimeLogsEngine';
import { TauriValidationEngine } from './commands/TauriValidationEngine';

export class EngineCommands implements IEngine {
  readonly timer: ITimerEngine;
  readonly metrics: IMetricsEngine;
  readonly timeLogs: ITimeLogsEngine;
  readonly validation: IValidationEngine;

  constructor(services?: Partial<IEngine>) {
    this.timer = services?.timer ?? new TauriTimerEngine();
    this.metrics = services?.metrics ?? new TauriMetricsEngine();
    this.timeLogs = services?.timeLogs ?? new TauriTimeLogsEngine();
    this.validation = services?.validation ?? new TauriValidationEngine();
  }

  async startTimer(taskId: string): Promise<void> {
    return this.timer.startTimer(taskId);
  }

  async stopTimer(projectId?: string): Promise<void> {
    return this.timer.stopTimer(projectId);
  }

  async resumeTimer(taskId: string): Promise<void> {
    return this.timer.resumeTimer(taskId);
  }

  async getActiveLogs(): Promise<string[]> {
    return this.timer.getActiveLogs();
  }

  async getComputedMetrics(nowIso?: string): Promise<EngineComputedMetrics> {
    return this.metrics.getComputedMetrics(nowIso);
  }

  async getTaskElapsed(taskId: string, nowIso?: string): Promise<number> {
    return this.metrics.getTaskElapsed(taskId, nowIso);
  }

  async getProjectElapsed(projectId: string, nowIso?: string): Promise<number> {
    return this.metrics.getProjectElapsed(projectId, nowIso);
  }

  async getElapsedRange(range: ElapsedRangeFilter, nowIso?: string): Promise<number> {
    return this.metrics.getElapsedRange(range, nowIso);
  }

  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    return this.metrics.getProjectStatistics(projectId);
  }

  async editTimeLog(
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ): Promise<void> {
    return this.timeLogs.editTimeLog(id, taskId, startTime, endTime, note, reason);
  }

  async validateProjectName(
    name: string,
    existingProjects: Project[],
    excludeProjectId?: string
  ): Promise<void> {
    return this.validation.validateProjectName(name, existingProjects, excludeProjectId);
  }

  async validateTaskName(name: string): Promise<void> {
    return this.validation.validateTaskName(name);
  }

  async validateTaskHierarchy(
    taskId: string | null | undefined,
    parentTaskId: string | null | undefined,
    tasks: Task[]
  ): Promise<void> {
    return this.validation.validateTaskHierarchy(taskId, parentTaskId, tasks);
  }
}
