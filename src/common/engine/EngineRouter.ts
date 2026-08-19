import { isDesktopEnvironment } from '../utils/environment';
import { IEngine, CreateProjectInput, CreateTaskInput } from './IEngine';
import { EngineCommands } from './EngineCommands';
import { EnginePlugin } from '../../plugins/engine/EnginePlugin';
import { ErrorHandler, EngineException } from '../exceptions';

import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { TaskStatus } from '@bindings/TaskStatus';
import { Settings } from '@bindings/Settings';
import { RuntimeConfig } from '@bindings/RuntimeConfig';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { ElapsedRangeFilter } from '../../plugins/engine/elapsed';

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

  // Timer Lifecycle
  async startTimer(taskId: string): Promise<void> {
    return this.implementation.startTimer(taskId);
  }

  async stopTimer(projectId?: string): Promise<void> {
    return this.implementation.stopTimer(projectId);
  }

  async resumeTimer(taskId: string): Promise<void> {
    if (this.implementation.resumeTimer) {
      return this.implementation.resumeTimer(taskId);
    }
    return this.implementation.startTimer(taskId);
  }

  async getActiveLogs(): Promise<string[]> {
    if (this.implementation.getActiveLogs) {
      return this.implementation.getActiveLogs();
    }
    return [];
  }

  async getComputedMetrics(nowIso?: string): Promise<EngineComputedMetrics> {
    if (this.implementation.getComputedMetrics) {
      return this.implementation.getComputedMetrics(nowIso);
    }
    return {
      snapshotNowIso: nowIso || new Date().toISOString(),
      tasks: {},
      projects: {},
    };
  }

  async getTaskElapsed(taskId: string, nowIso?: string): Promise<number> {
    if (this.implementation.getTaskElapsed) {
      return this.implementation.getTaskElapsed(taskId, nowIso);
    }
    return 0;
  }

  async getProjectElapsed(projectId: string, nowIso?: string): Promise<number> {
    if (this.implementation.getProjectElapsed) {
      return this.implementation.getProjectElapsed(projectId, nowIso);
    }
    return 0;
  }

  async getElapsedRange(range: ElapsedRangeFilter, nowIso?: string): Promise<number> {
    if (this.implementation.getElapsedRange) {
      return this.implementation.getElapsedRange(range, nowIso);
    }
    return 0;
  }

  async editTimeLog(
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ): Promise<void> {
    return this.implementation.editTimeLog(id, taskId, startTime, endTime, note, reason);
  }

  async addProject(input: CreateProjectInput): Promise<TimerRepositoryState> {
    if (this.implementation.addProject) {
      return this.implementation.addProject(input);
    }
    const err = new EngineException('addProject is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async updateProject(
    projectId: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ): Promise<TimerRepositoryState> {
    if (this.implementation.updateProject) {
      return this.implementation.updateProject(projectId, name, color, description, icon, tags);
    }
    const err = new EngineException('updateProject is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async renameProject(projectId: string, name: string): Promise<TimerRepositoryState> {
    if (this.implementation.renameProject) {
      return this.implementation.renameProject(projectId, name);
    }
    const err = new EngineException('renameProject is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async toggleProjectArchive(projectId: string): Promise<TimerRepositoryState> {
    if (this.implementation.toggleProjectArchive) {
      return this.implementation.toggleProjectArchive(projectId);
    }
    const err = new EngineException('toggleProjectArchive is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    return this.implementation.getProjectStatistics(projectId);
  }

  async addTask(input: CreateTaskInput): Promise<TimerRepositoryState> {
    if (this.implementation.addTask) {
      return this.implementation.addTask(input);
    }
    const err = new EngineException('addTask is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async updateTask(
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ): Promise<TimerRepositoryState> {
    if (this.implementation.updateTask) {
      return this.implementation.updateTask(taskId, name, parentTaskId, status, completed);
    }
    const err = new EngineException('updateTask is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async renameTask(taskId: string, name: string): Promise<TimerRepositoryState> {
    if (this.implementation.renameTask) {
      return this.implementation.renameTask(taskId, name);
    }
    const err = new EngineException('renameTask is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async deleteTask(taskId: string): Promise<TimerRepositoryState> {
    if (this.implementation.deleteTask) {
      return this.implementation.deleteTask(taskId);
    }
    const err = new EngineException('deleteTask is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async toggleTaskComplete(taskId: string): Promise<TimerRepositoryState> {
    if (this.implementation.toggleTaskComplete) {
      return this.implementation.toggleTaskComplete(taskId);
    }
    const err = new EngineException('toggleTaskComplete is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async getSettings(): Promise<Settings> {
    if (this.implementation.getSettings) {
      return this.implementation.getSettings();
    }
    const err = new EngineException('getSettings is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async saveSettings(settings: Settings): Promise<void> {
    if (this.implementation.saveSettings) {
      return this.implementation.saveSettings(settings);
    }
    const err = new EngineException('saveSettings is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async getRuntimeConfigs(): Promise<RuntimeConfig[]> {
    if (this.implementation.getRuntimeConfigs) {
      return this.implementation.getRuntimeConfigs();
    }
    const err = new EngineException('getRuntimeConfigs is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async saveRuntimeConfig(config: RuntimeConfig): Promise<void> {
    if (this.implementation.saveRuntimeConfig) {
      return this.implementation.saveRuntimeConfig(config);
    }
    const err = new EngineException('saveRuntimeConfig is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }

  async getState(): Promise<TimerRepositoryState | null> {
    if (this.implementation.getState) {
      return this.implementation.getState();
    }
    return null;
  }

  async resetState(): Promise<TimerRepositoryState> {
    if (this.implementation.resetState) {
      return this.implementation.resetState();
    }
    const err = new EngineException('resetState is not supported by active engine implementation', undefined, 'ERR_ENGINE_NOT_SUPPORTED');
    ErrorHandler.handle(err);
    throw err;
  }
}
