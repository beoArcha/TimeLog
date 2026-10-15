import { isDesktopEnvironment } from '../utils/environment';
import { IEngine } from './IEngine';
import { EngineCommands } from './EngineCommands';
import { EnginePlugin } from '@plugins/engine/EnginePlugin';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';

/**
 * Unified dispatch router for the timer engine.
 * Automatically delegates to Tauri IPC commands in desktop mode
 * or to the local in-memory engine plugin in browser mode.
 */
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

  /** Returns the singleton router instance. */
  static getInstance(): EngineRouter {
    if (!this.instance) {
      this.instance = new EngineRouter();
    }
    return this.instance;
  }

  /** Overrides the underlying engine implementation for test suites. */
  setImplementationForTesting(impl: IEngine): void {
    this.implementation = impl;
  }

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

  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    return this.implementation.getProjectStatistics(projectId);
  }
}
