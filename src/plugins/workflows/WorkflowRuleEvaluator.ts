import {
  IWorkflowRule,
  IWorkflowRuleEvaluator,
  WorkflowConfig,
  WorkflowCheckResult,
} from '@common/workflows/IWorkflow';
import { TimeLog } from '@bindings/TimeLog';

export class WorkflowRuleEvaluator implements IWorkflowRuleEvaluator {
  evaluate(
    rules: readonly IWorkflowRule[],
    config: WorkflowConfig,
    activeLogs: TimeLog[],
    nowMs: number
  ): WorkflowCheckResult {
    if (!activeLogs || activeLogs.length === 0) {
      return { stopped: false, warning: false };
    }

    let willWarn = false;

    for (const rule of rules) {
      const result = rule.evaluate(config, activeLogs, nowMs);
      if (result) {
        if (result.stopped) {
          return result;
        }
        if (result.warning) {
          willWarn = true;
        }
      }
    }

    return {
      stopped: false,
      warning: willWarn,
    };
  }
}
