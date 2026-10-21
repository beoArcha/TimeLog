import {
  IWorkflow,
  WorkflowConfig,
  WorkflowStatus,
  WorkflowCheckResult,
  AutoStopReason,
  IWorkflowRule,
  IWorkflowRuleEvaluator,
  IWorkflowConfigStore,
  DEFAULT_WORKFLOW_CONFIG,
} from '@common/workflows/IWorkflow';
import { WorkflowRuleEvaluator } from './WorkflowRuleEvaluator';
import { LocalStorageWorkflowConfigStore } from './LocalStorageWorkflowConfigStore';
import { HoursLimitRule } from './rules/HoursLimitRule';
import { DailyBoundaryRule } from './rules/DailyBoundaryRule';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EngineRouter } from '@common/engine/EngineRouter';
import { PluginRegistry } from '@plugins/PluginRegistry';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { WorkflowException } from '@common/exceptions/AppExceptions';

export { DEFAULT_WORKFLOW_CONFIG };

export function createDefaultWorkflowRules(): IWorkflowRule[] {
  return [new HoursLimitRule(), new DailyBoundaryRule()];
}

export class WorkflowPlugin implements IWorkflow {
  private isDaemonRunning = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastCheckIso: string | null = null;
  private lastAutoStopReason: AutoStopReason | null = null;
  private lastAutoStopTimeIso: string | null = null;
  private readonly rules: IWorkflowRule[];
  private readonly ruleEvaluator: IWorkflowRuleEvaluator;
  private readonly configStore: IWorkflowConfigStore;

  constructor(
    rules: readonly IWorkflowRule[] = createDefaultWorkflowRules(),
    configStore: IWorkflowConfigStore = new LocalStorageWorkflowConfigStore(),
    ruleEvaluator: IWorkflowRuleEvaluator = new WorkflowRuleEvaluator()
  ) {
    this.rules = [...rules];
    this.configStore = configStore;
    this.ruleEvaluator = ruleEvaluator;
  }

  addRule(rule: IWorkflowRule): void {
    this.rules.push(rule);
  }

  async getConfig(): Promise<WorkflowConfig> {
    return this.configStore.getConfig();
  }

  async saveConfig(config: WorkflowConfig): Promise<void> {
    return this.configStore.saveConfig(config);
  }

  async getStatus(): Promise<WorkflowStatus> {
    return {
      isDaemonRunning: this.isDaemonRunning,
      lastCheckIso: this.lastCheckIso,
      lastAutoStopReason: this.lastAutoStopReason,
      lastAutoStopTimeIso: this.lastAutoStopTimeIso,
    };
  }

  async checkRules(nowIso?: string): Promise<WorkflowCheckResult> {
    try {
      const nowMs = nowIso ? new Date(nowIso).getTime() : Date.now();
      const config = await this.getConfig();

      const activeLogIds = await EngineRouter.getInstance().timer.getActiveLogs();
      if (!activeLogIds || activeLogIds.length === 0) {
        this.lastCheckIso = new Date(nowMs).toISOString();
        return { stopped: false, warning: false };
      }

      const state = await PersistenceRouter.getInstance().core.load();
      const activeLogs = (state?.logs || []).filter((l) => !l.endTime);

      const result = this.ruleEvaluator.evaluate(this.rules, config, activeLogs, nowMs);
      this.lastCheckIso = new Date(nowMs).toISOString();

      if (result.stopped && result.reason) {
        await EngineRouter.getInstance().timer.stopTimer();
        this.lastAutoStopReason = result.reason as AutoStopReason;
        this.lastAutoStopTimeIso = new Date(nowMs).toISOString();
        await PluginRegistry.getInstance().emitEvent('workflow:autostop', {
          reason: result.reason,
          timeIso: this.lastAutoStopTimeIso,
        });
      } else if (result.warning) {
        await PluginRegistry.getInstance().emitEvent('workflow:warning', {
          timeIso: this.lastCheckIso,
        });
      }

      return result;
    } catch (err) {
      ErrorHandler.handle(
        new WorkflowException('Rule evaluation check encountered an error in browser plugin', err)
      );
      return { stopped: false, warning: false };
    }
  }

  async startDaemon(): Promise<void> {
    if (this.isDaemonRunning) return;
    this.isDaemonRunning = true;

    this.intervalId = setInterval(() => {
      this.checkRules().catch((err) => {
        ErrorHandler.handle(
          new WorkflowException('Daemon background check tick failed in WorkflowPlugin', err)
        );
      });
    }, 10_000);
  }

  async stopDaemon(): Promise<void> {
    this.isDaemonRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
