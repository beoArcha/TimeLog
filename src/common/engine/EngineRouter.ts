import { isDesktopEnvironment } from '../utils/environment';
import { IEngine } from './IEngine';
import { EngineCommands } from './EngineCommands';
import { EnginePlugin } from '../../plugins/engine/EnginePlugin';

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

  async startTimer(taskId: string): Promise<void> {
    return this.implementation.startTimer(taskId);
  }

  async stopTimer(projectId?: string): Promise<void> {
    return this.implementation.stopTimer(projectId);
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
}
