import {
  IWorkflowRule,
  WorkflowConfig,
  WorkflowCheckResult,
  REASON_DAILY_BOUNDARY,
  WARNING_LEAD_MS,
} from '@common/workflows/IWorkflow';
import { TimeLog } from '@bindings/TimeLog';

export class DailyBoundaryRule implements IWorkflowRule {
  readonly id = 'daily_boundary';

  evaluate(config: WorkflowConfig, activeLogs: TimeLog[], nowMs: number): WorkflowCheckResult | null {
    if (!config.autoStopDailyBoundaryEnabled || !config.autoStopDailyBoundaryTime?.trim()) {
      return null;
    }

    const [bH, bM] = config.autoStopDailyBoundaryTime.trim().split(':').map(Number);
    if (isNaN(bH) || isNaN(bM)) {
      return null;
    }

    const nowDate = new Date(nowMs);
    const boundaryDate = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate(),
      bH,
      bM,
      0,
      0
    );
    const boundaryMs = boundaryDate.getTime();
    let willWarn = false;

    for (const log of activeLogs) {
      const startMs = new Date(log.startTime).getTime();
      const startDate = new Date(startMs);

      // Timers started after the daily boundary on the same day represent intentional late work
      const isSameDay =
        startDate.getFullYear() === nowDate.getFullYear() &&
        startDate.getMonth() === nowDate.getMonth() &&
        startDate.getDate() === nowDate.getDate();

      const startedBeforeBoundary = isSameDay ? startMs < boundaryMs : startMs < nowMs;

      if (startedBeforeBoundary && nowMs >= boundaryMs) {
        return {
          stopped: true,
          reason: REASON_DAILY_BOUNDARY,
          warning: false,
        };
      }

      if (
        config.warningNotificationEnabled &&
        startedBeforeBoundary &&
        nowMs >= boundaryMs - WARNING_LEAD_MS &&
        nowMs < boundaryMs
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
