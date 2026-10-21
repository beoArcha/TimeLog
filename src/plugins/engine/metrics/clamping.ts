import { ClampedTimeLog } from '@bindings/ClampedTimeLog';

export interface IntervalClampingInput {
  id: string;
  projectId: string;
  taskId: string;
  startTime: string;
  endTime?: string | null;
  note?: string | null;
  isPatch: boolean;
}

export function clampInterval(
  input: IntervalClampingInput,
  rangeStart: number,
  rangeEnd: number,
  referenceNowMs: number
): ClampedTimeLog | null {
  const startMs = new Date(input.startTime).getTime();
  const endMs = input.endTime ? new Date(input.endTime).getTime() : referenceNowMs;

  if (endMs < startMs) {
    return null;
  }

  const originalDuration = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const effectiveStart = rangeStart !== -Infinity ? Math.max(startMs, rangeStart) : startMs;
  const effectiveEnd = rangeEnd !== Infinity ? Math.min(endMs, rangeEnd) : endMs;

  if (effectiveEnd <= effectiveStart) {
    return null;
  }

  const clampedDuration = Math.max(0, Math.floor((effectiveEnd - effectiveStart) / 1000));
  const isMultiDay = effectiveStart !== startMs || effectiveEnd !== endMs;

  return {
    id: input.id,
    projectId: input.projectId,
    taskId: input.taskId,
    startTime: input.startTime,
    endTime: input.endTime ?? undefined,
    originalDurationSeconds: originalDuration,
    clampedDurationSeconds: clampedDuration,
    isMultiDaySegment: isMultiDay,
    clampedStartTime: new Date(effectiveStart).toISOString(),
    clampedEndTime: new Date(effectiveEnd).toISOString(),
    note: input.note ?? undefined,
    isPatch: input.isPatch,
  };
}
