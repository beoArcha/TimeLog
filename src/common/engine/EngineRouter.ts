import { IEngine } from './IEngine';
import { EngineCommands } from './EngineCommands';

export class EngineRouter implements IEngine {
  private static instance: EngineRouter | null = null;
  private implementation: IEngine;

  private constructor() {
    const isDesktop = true;
    if (isDesktop) {
      this.implementation = new EngineCommands();
    } else {
      this.implementation = new EngineCommands();
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
}
