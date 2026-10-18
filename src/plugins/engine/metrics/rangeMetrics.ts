import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';
import { RangeMetricsResult } from '@bindings/RangeMetricsResult';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { PatchLog } from '@bindings/PatchLog';
import { clampInterval } from './clamping';

/**
 * Pure calculation: Evaluates window-clamped durations and segment metrics for a given date range.
 * Mirrors the desktop Tauri Rust engine logic exactly.
 */
export function calculateRangeMetrics(
  filter: ElapsedRangeFilter,
  tasks: Task[],
  logs: TimeLog[],
  nowIso?: string,
  patches?: PatchLog[]
): RangeMetricsResult {
  const currentNow = nowIso ? new Date(nowIso).getTime() : Date.now();
  const rangeStart = filter.from ? new Date(filter.from).getTime() : -Infinity;
  const rangeEnd = filter.to ? new Date(filter.to).getTime() : Infinity;

  let relevantTaskIds: Set<string> | null = null;

  if (filter.taskId) {
    relevantTaskIds = new Set<string>([filter.taskId]);
    const collectSubtasks = (parent: string) => {
      for (const t of tasks) {
        if (t.parentTaskId === parent && !relevantTaskIds?.has(t.id)) {
          relevantTaskIds?.add(t.id);
          collectSubtasks(t.id);
        }
      }
    };
    collectSubtasks(filter.taskId);
  }

  let totalSeconds = 0;
  const projectElapsed: Record<string, number> = {};
  const taskElapsed: Record<string, number> = {};
  const clampedLogs: ClampedTimeLog[] = [];

  for (const log of logs) {
    if (relevantTaskIds && !relevantTaskIds.has(log.taskId)) {
      continue;
    }
    if (filter.projectId && log.projectId !== filter.projectId) {
      continue;
    }

    const clamped = clampInterval(
      {
        id: log.id,
        projectId: log.projectId,
        taskId: log.taskId,
        startTime: log.startTime,
        endTime: log.endTime,
        note: log.note,
        isPatch: false,
      },
      rangeStart,
      rangeEnd,
      currentNow
    );

    if (clamped) {
      totalSeconds += clamped.clampedDurationSeconds;
      projectElapsed[clamped.projectId] = (projectElapsed[clamped.projectId] || 0) + clamped.clampedDurationSeconds;
      taskElapsed[clamped.taskId] = (taskElapsed[clamped.taskId] || 0) + clamped.clampedDurationSeconds;
      clampedLogs.push(clamped);
    }
  }

  if (filter.includePatches && patches) {
    for (const patch of patches) {
      if (filter.projectId && patch.projectId !== filter.projectId) {
        continue;
      }
      if (relevantTaskIds) {
        if (!patch.taskId || !relevantTaskIds.has(patch.taskId)) {
          continue;
        }
      }

      const taskIdStr = patch.taskId ?? '';
      const clamped = clampInterval(
        {
          id: patch.id,
          projectId: patch.projectId,
          taskId: taskIdStr,
          startTime: patch.startTime,
          endTime: patch.endTime,
          note: patch.patchNote,
          isPatch: true,
        },
        rangeStart,
        rangeEnd,
        currentNow
      );

      if (clamped) {
        totalSeconds += clamped.clampedDurationSeconds;
        projectElapsed[clamped.projectId] = (projectElapsed[clamped.projectId] || 0) + clamped.clampedDurationSeconds;
        if (clamped.taskId) {
          taskElapsed[clamped.taskId] = (taskElapsed[clamped.taskId] || 0) + clamped.clampedDurationSeconds;
        }
        clampedLogs.push(clamped);
      }
    }
  }

  return {
    totalSeconds,
    projectElapsed,
    taskElapsed,
    clampedLogs,
  };
}

/**
 * Pure calculation: Calculates total elapsed seconds within a time range [from, to]
 * optionally filtered by taskId or projectId.
 * Internal to EnginePlugin (Browser runtime). Does NOT mutate state.
 */
export function calculateElapsedRange(
  range: ElapsedRangeFilter,
  tasks: Task[],
  logs: TimeLog[],
  nowIso?: string
): number {
  return calculateRangeMetrics(range, tasks, logs, nowIso).totalSeconds;
}
