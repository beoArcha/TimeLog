import { isDesktopEnvironment } from '../utils/environment';
import { IWorkflow, WorkflowConfig, WorkflowStatus, WorkflowCheckResult } from './IWorkflow';
import { WorkflowCommands } from './WorkflowCommands';
import { WorkflowPlugin } from '@plugins/workflows/WorkflowPlugin';
import { IRouter } from '../types/routing';

export class WorkflowRouter implements IWorkflow, IRouter<IWorkflow> {
  private static instance: WorkflowRouter | null = null;
  private implementation: IWorkflow;

  private constructor() {
    if (isDesktopEnvironment()) {
      this.implementation = new WorkflowCommands();
    } else {
      this.implementation = new WorkflowPlugin();
    }
  }

  static getInstance(): WorkflowRouter {
    if (!WorkflowRouter.instance) {
      WorkflowRouter.instance = new WorkflowRouter();
    }
    return WorkflowRouter.instance;
  }

  setImplementationForTesting(implementation: IWorkflow): void {
    this.implementation = implementation;
  }

  static resetForTesting(): void {
    WorkflowRouter.instance = null;
  }

  getConfig(): Promise<WorkflowConfig> {
    return this.implementation.getConfig();
  }

  saveConfig(config: WorkflowConfig): Promise<void> {
    return this.implementation.saveConfig(config);
  }

  getStatus(): Promise<WorkflowStatus> {
    return this.implementation.getStatus();
  }

  checkRules(nowIso?: string): Promise<WorkflowCheckResult> {
    return this.implementation.checkRules(nowIso);
  }

  startDaemon(): Promise<void> {
    return this.implementation.startDaemon();
  }

  stopDaemon(): Promise<void> {
    return this.implementation.stopDaemon();
  }
}
