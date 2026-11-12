import {
  IEngine,
  ITimerEngine,
  IMetricsEngine,
  ITimeLogsEngine,
  IValidationEngine,
  EngineComputedMetrics,
  ElapsedRangeFilter,
} from '@common/engine/IEngine';
import { IBillingEngine } from '@common/engine/billing/types';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { ReportDocument } from '@bindings/ReportDocument';
import { ReportRequest } from '@bindings/ReportRequest';
import { BrowserTimerEngine } from './services/BrowserTimerEngine';
import { BrowserMetricsEngine } from './services/BrowserMetricsEngine';
import { BrowserTimeLogsEngine } from './services/BrowserTimeLogsEngine';
import { BrowserValidationEngine } from './services/BrowserValidationEngine';
import { BrowserBillingEngine } from './services/BrowserBillingEngine';
import { BrowserReportEngine } from './services/BrowserReportEngine';

export class EnginePlugin implements IEngine {
  readonly timer: ITimerEngine;
  readonly metrics: IMetricsEngine;
  readonly timeLogs: ITimeLogsEngine;
  readonly validation: IValidationEngine;
  readonly billing: IBillingEngine;
  private readonly reports: BrowserReportEngine;

  /**
   * Reports stay outside `IEngine` until the Tauri `EngineCommands` side exposes a matching command,
   * so `reports` is a separate optional parameter instead of part of `services`.
   */
  constructor(services?: Partial<IEngine>, reports?: BrowserReportEngine) {
    this.timer = services?.timer ?? new BrowserTimerEngine();
    this.metrics = services?.metrics ?? new BrowserMetricsEngine();
    this.timeLogs = services?.timeLogs ?? new BrowserTimeLogsEngine();
    this.validation = services?.validation ?? new BrowserValidationEngine();
    this.billing = services?.billing ?? new BrowserBillingEngine();
    this.reports = reports ?? new BrowserReportEngine();
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

  async switchTimer(taskId: string): Promise<void> {
    return this.timer.switchTimer(taskId);
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
    reason: string | null,
    auditSource?: string | null
  ): Promise<void> {
    return this.timeLogs.editTimeLog(id, taskId, startTime, endTime, note, reason, auditSource);
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

  async buildReport(request: ReportRequest): Promise<ReportDocument> {
    return this.reports.buildReport(request);
  }
}
