import { TimeLog } from '@bindings/TimeLog';

export function resolveSourceLogs(
  propLogs?: TimeLog[],
  timerLogs?: TimeLog[],
  dataLogs?: TimeLog[]
): TimeLog[] {
  if (propLogs) return propLogs;
  if (timerLogs) return timerLogs;
  if (dataLogs) return dataLogs;
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
  const start = new Date(log.startTime).getTime();
  if (isNaN(start)) return 0;
  if (!log.endTime) return 0;
  const end = new Date(log.endTime).getTime();
  if (isNaN(end)) return 0;
  return Math.max(0, Math.floor((end - start) / 1000));
}
