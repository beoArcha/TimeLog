import { isDesktopEnvironment } from '../utils/environment';
import {
  IEngine,
  ITimerEngine,
  IMetricsEngine,
  ITimeLogsEngine,
  IValidationEngine,
  EngineComputedMetrics,
  ElapsedRangeFilter,
} from './IEngine';
import { EngineCommands } from './EngineCommands';
import { EnginePlugin } from '@plugins/engine/EnginePlugin';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';

export class EngineRouter implements IEngine {
  private static instance: EngineRouter | null = null;
  private implementation: IEngine;

  private constructor() {
    if (isDesktopEnvironment()) {
      this.implementation = new EngineCommands();
    } else {
      this.implementation = new EnginePlugin();
    }
  }

  static getInstance(): EngineRouter {
    if (!this.instance) {
      this.instance = new EngineRouter();
    }
    return this.instance;
  }

  setImplementationForTesting(impl: IEngine): void {
    this.implementation = impl;
  }

  static resetForTesting(): void {
    EngineRouter.instance = null;
  }

  get timer(): ITimerEngine {
    return {
      startTimer: (taskId: string) => this.startTimer(taskId),
      stopTimer: (projectId?: string) => this.stopTimer(projectId),
      resumeTimer: (taskId: string) => this.resumeTimer(taskId),
      getActiveLogs: () => this.getActiveLogs(),
    };
  }

  get metrics(): IMetricsEngine {
    return {
      getComputedMetrics: (nowIso?: string) => this.getComputedMetrics(nowIso),
      getTaskElapsed: (taskId: string, nowIso?: string) => this.getTaskElapsed(taskId, nowIso),
      getProjectElapsed: (projectId: string, nowIso?: string) => this.getProjectElapsed(projectId, nowIso),
      getElapsedRange: (range: ElapsedRangeFilter, nowIso?: string) => this.getElapsedRange(range, nowIso),
      getProjectStatistics: (projectId: string) => this.getProjectStatistics(projectId),
    };
  }

  get timeLogs(): ITimeLogsEngine {
    return {
      editTimeLog: (id, taskId, startTime, endTime, note, reason) =>
        this.editTimeLog(id, taskId, startTime, endTime, note, reason),
    };
  }

  get validation(): IValidationEngine {
    return {
      validateProjectName: (name, existingProjects, excludeProjectId) =>
        this.validateProjectName(name, existingProjects, excludeProjectId),
      validateTaskName: (name) => this.validateTaskName(name),
      validateTaskHierarchy: (taskId, parentTaskId, tasks) =>
        this.validateTaskHierarchy(taskId, parentTaskId, tasks),
    };
  }

  async startTimer(taskId: string): Promise<void> {
    return this.implementation.timer.startTimer(taskId);
  }

  async stopTimer(projectId?: string): Promise<void> {
    return this.implementation.timer.stopTimer(projectId);
  }

  async resumeTimer(taskId: string): Promise<void> {
    return this.implementation.timer.resumeTimer(taskId);
  }

  async getActiveLogs(): Promise<string[]> {
    return this.implementation.timer.getActiveLogs();
  }

  async getComputedMetrics(nowIso?: string): Promise<EngineComputedMetrics> {
    return this.implementation.metrics.getComputedMetrics(nowIso);
  }

  async getTaskElapsed(taskId: string, nowIso?: string): Promise<number> {
    return this.implementation.metrics.getTaskElapsed(taskId, nowIso);
  }

  async getProjectElapsed(projectId: string, nowIso?: string): Promise<number> {
    return this.implementation.metrics.getProjectElapsed(projectId, nowIso);
  }

  async getElapsedRange(range: ElapsedRangeFilter, nowIso?: string): Promise<number> {
    return this.implementation.metrics.getElapsedRange(range, nowIso);
  }

  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    return this.implementation.metrics.getProjectStatistics(projectId);
  }

  async editTimeLog(
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ): Promise<void> {
    return this.implementation.timeLogs.editTimeLog(id, taskId, startTime, endTime, note, reason);
  }

  async validateProjectName(
    name: string,
    existingProjects: Project[],
    excludeProjectId?: string
  ): Promise<void> {
    return this.implementation.validation.validateProjectName(name, existingProjects, excludeProjectId);
  }

  async validateTaskName(name: string): Promise<void> {
    return this.implementation.validation.validateTaskName(name);
  }

  async validateTaskHierarchy(
    taskId: string | null | undefined,
    parentTaskId: string | null | undefined,
    tasks: Task[]
  ): Promise<void> {
    return this.implementation.validation.validateTaskHierarchy(taskId, parentTaskId, tasks);
  }
}
