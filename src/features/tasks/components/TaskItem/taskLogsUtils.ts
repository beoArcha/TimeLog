import { TimeLog } from '@bindings/TimeLog';
import { getLogDurationSeconds } from '@features/reports/utils/grouping';

export function resolveSourceLogs(
  propLogs?: TimeLog[],
  timerLogs?: TimeLog[],
  dataLogs?: TimeLog[]
): TimeLog[] {
  if (propLogs && propLogs.length > 0) return propLogs;
  if (timerLogs && timerLogs.length > 0) return timerLogs;
  if (dataLogs && dataLogs.length > 0) return dataLogs;
  return [];
}

export function resolveEffectiveTimezoneSetting(settings: unknown): string | undefined {
  if (!settings || typeof settings !== 'object') {
    return undefined;
  }
  const s = settings as Record<string, unknown>;
  if (typeof s.resolvedTimezone === 'string') {
    return s.resolvedTimezone;
  }
  if (typeof s.timezone === 'string') {
    return s.timezone;
  }
  return undefined;
}

export function calculateLogDuration(log: TimeLog): number {
  return getLogDurationSeconds(log, new Date().toISOString());
}
