import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { TaskComputedMetrics } from '@bindings/TaskComputedMetrics';
import { ProjectComputedMetrics } from '@bindings/ProjectComputedMetrics';
import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';
import { RangeMetricsResult } from '@bindings/RangeMetricsResult';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';

import {
  IBillingEngine,
  RangeBillingResult,
  EffectiveRateResult,
  TaskBillingSummary,
  CurrencyBillingSummary,
  RateStatus,
  RateMode,
} from './billing/types';

export {
  type EngineComputedMetrics,
  type TaskComputedMetrics,
  type ProjectComputedMetrics,
  type ElapsedRangeFilter,
  type RangeMetricsResult,
  type ClampedTimeLog,
  type IBillingEngine,
  type RangeBillingResult,
  type EffectiveRateResult,
  type TaskBillingSummary,
  type CurrencyBillingSummary,
  type RateStatus,
  type RateMode,
};

export interface ITimerEngine {
  startTimer(taskId: string): Promise<void>;
  stopTimer(projectId?: string): Promise<void>;
  resumeTimer(taskId: string): Promise<void>;
  switchTimer(taskId: string): Promise<void>;
  getActiveLogs(): Promise<string[]>;
}

export interface IMetricsEngine {
  getComputedMetrics(nowIso?: string): Promise<EngineComputedMetrics>;
  getTaskElapsed(taskId: string, nowIso?: string): Promise<number>;
  getProjectElapsed(projectId: string, nowIso?: string): Promise<number>;
  getElapsedRange(range: ElapsedRangeFilter, nowIso?: string): Promise<number>;
  getRangeMetrics(range: ElapsedRangeFilter, nowIso?: string): Promise<RangeMetricsResult>;
  getProjectStatistics(projectId: string): Promise<ProjectStatistics>;
}

export interface ITimeLogsEngine {
  editTimeLog(
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ): Promise<void>;
}

export interface IValidationEngine {
  validateProjectName(
    name: string,
    existingProjects: Project[],
    excludeProjectId?: string
  ): Promise<void>;
  validateTaskName(name: string): Promise<void>;
  validateTaskHierarchy(
    taskId: string | null | undefined,
    parentTaskId: string | null | undefined,
    tasks: Task[]
  ): Promise<void>;
}

export interface IEngine {
  readonly timer: ITimerEngine;
  readonly metrics: IMetricsEngine;
  readonly timeLogs: ITimeLogsEngine;
  readonly validation: IValidationEngine;
  readonly billing: IBillingEngine;
}
