import {
  IWorkflowRule,
  WorkflowConfig,
  WorkflowCheckResult,
  REASON_HOURS_LIMIT,
  WARNING_LEAD_SECONDS,
} from '@common/workflows/IWorkflow';
import { TimeLog } from '@bindings/TimeLog';

export class HoursLimitRule implements IWorkflowRule {
  readonly id = 'hours_limit';

  evaluate(config: WorkflowConfig, activeLogs: TimeLog[], nowMs: number): WorkflowCheckResult | null {
    if (!config.autoStopHoursLimitEnabled || config.autoStopHoursLimit <= 0) {
      return null;
    }

    const limitSeconds = config.autoStopHoursLimit * 3600;
    let willWarn = false;

    for (const log of activeLogs) {
      const startMs = new Date(log.startTime).getTime();
      const elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));

      if (elapsedSeconds >= limitSeconds) {
        return {
          stopped: true,
          reason: REASON_HOURS_LIMIT,
          warning: false,
        };
      }

      if (
        config.warningNotificationEnabled &&
        elapsedSeconds >= Math.max(0, limitSeconds - WARNING_LEAD_SECONDS)
      ) {
        willWarn = true;
      }
    }

    if (willWarn) {
      return {
        stopped: false,
        warning: true,
      };
    }

    return null;
  }
}
