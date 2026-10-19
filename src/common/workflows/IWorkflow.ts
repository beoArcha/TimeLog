import { WorkflowConfig } from '@bindings/WorkflowConfig';
import { WorkflowStatus } from '@bindings/WorkflowStatus';
import { WorkflowCheckResult } from '@bindings/WorkflowCheckResult';
import { TimeLog } from '@bindings/TimeLog';

export type { WorkflowConfig, WorkflowStatus, WorkflowCheckResult };

export type AutoStopReason = 'hours_limit' | 'daily_boundary' | 'task_completed';

export const REASON_HOURS_LIMIT: AutoStopReason = 'hours_limit';
export const REASON_DAILY_BOUNDARY: AutoStopReason = 'daily_boundary';
export const REASON_TASK_COMPLETED: AutoStopReason = 'task_completed';

export const WARNING_LEAD_SECONDS = 900;
export const WARNING_LEAD_MS = 900_000;

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  autoStopHoursLimitEnabled: false,
  autoStopHoursLimit: 8,
  autoStopDailyBoundaryEnabled: false,
  autoStopDailyBoundaryTime: '19:00',
  autoStopOnTaskComplete: false,
  warningNotificationEnabled: true,
};

export interface IWorkflowRule {
  readonly id: string;
  evaluate(config: WorkflowConfig, activeLogs: TimeLog[], nowMs: number): WorkflowCheckResult | null;
}

export interface IWorkflowRuleEvaluator {
  evaluate(
    rules: readonly IWorkflowRule[],
    config: WorkflowConfig,
    activeLogs: TimeLog[],
    nowMs: number
  ): WorkflowCheckResult;
}

export interface IWorkflowConfigStore {
  getConfig(): Promise<WorkflowConfig>;
  saveConfig(config: WorkflowConfig): Promise<void>;
}

export interface IWorkflow {
  getConfig(): Promise<WorkflowConfig>;
  saveConfig(config: WorkflowConfig): Promise<void>;
  getStatus(): Promise<WorkflowStatus>;
  checkRules(nowIso?: string): Promise<WorkflowCheckResult>;
  startDaemon(): Promise<void>;
  stopDaemon(): Promise<void>;
}
