import { useState, useEffect } from 'react';
import { formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { TimeLog } from '@bindings/TimeLog';

export interface UseLiveTaskElapsedOptions {
  /**
   * Frequency of timer ticks when the task is active in milliseconds.
   * Default: 1000 ms (1 Hz). Supports 15–240 Hz.
   */
  refreshIntervalMs?: number;
  /** Precomputed engine metrics snapshot. */
  metrics?: EngineComputedMetrics | null;
  /** Current active log if any. */
  activeLog?: TimeLog | null;  
}

export interface UseLiveTaskElapsedResult {
  elapsedSeconds: number;
  formattedElapsed: string;
  isRunning: boolean;
}

/**
 * Single Source of Truth live elapsed timer hook for tasks.
 *
 * Inactive tasks return the static snapshot from Engine (0 CPU overhead).
 * Active tasks dynamically compute elapsed = baseSnapshot + delta(now - snapshotTime)
 * with a configurable refresh frequency.
 */
export function useLiveTaskElapsed(
  taskId: string,
  options?: UseLiveTaskElapsedOptions
): UseLiveTaskElapsedResult {
  const refreshIntervalMs = Math.max(4, options?.refreshIntervalMs ?? 1000);
  const metrics = options?.metrics;
  const activeLog = options?.activeLog;

  const isRunning = Boolean(
    taskId && (
      metrics?.tasks?.[taskId]?.isRunning ??
      (activeLog ? activeLog.taskId === taskId : false)
    )
  );

  const baseElapsed = (taskId && metrics?.tasks?.[taskId]?.elapsedSeconds) ?? 0;

  const getElapsedDelta = () => {
    if (!isRunning) return 0;
    const startTickMs = metrics?.snapshotNowIso
      ? new Date(metrics.snapshotNowIso).getTime()
      : (activeLog?.startTime ? new Date(activeLog.startTime).getTime() : Date.now());
    return Math.max(0, Math.floor((Date.now() - startTickMs) / 1000));
  };

  const [liveExtraSeconds, setLiveExtraSeconds] = useState(getElapsedDelta);

  const [prevTaskId, setPrevTaskId] = useState(taskId);
  if (prevTaskId !== taskId) {
    setPrevTaskId(taskId);
    setLiveExtraSeconds(getElapsedDelta());
  }

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const startTickMs = metrics?.snapshotNowIso
      ? new Date(metrics.snapshotNowIso).getTime()
      : (activeLog?.startTime ? new Date(activeLog.startTime).getTime() : Date.now());

    const update = () => {
      const now = Date.now();
      const extra = Math.max(0, Math.floor((now - startTickMs) / 1000));
      setLiveExtraSeconds(extra);
    };

    const intervalId = setInterval(update, refreshIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning, baseElapsed, metrics?.snapshotNowIso, activeLog?.startTime, refreshIntervalMs]);

  const elapsed = isRunning ? baseElapsed + liveExtraSeconds : baseElapsed;

  return {
    elapsedSeconds: elapsed,
    formattedElapsed: formatSeconds(elapsed),
    isRunning,
  };
}

export interface UseLiveProjectElapsedOptions {
  /**
   * Frequency of timer ticks when the project is active in milliseconds.
   * Default: 1000 ms (1 Hz).
   */
  refreshIntervalMs?: number;
  metrics?: EngineComputedMetrics | null;
  activeLog?: TimeLog | null;
}

export interface UseLiveProjectElapsedResult {
  elapsedSeconds: number;
  formattedElapsed: string;
  isRunning: boolean;
}

/**
 * Single Source of Truth live elapsed timer hook for projects.
 */
export function useLiveProjectElapsed(
  projectId: string,
  options?: UseLiveProjectElapsedOptions
): UseLiveProjectElapsedResult {
  const refreshIntervalMs = Math.max(4, options?.refreshIntervalMs ?? 1000);
  const metrics = options?.metrics;
  const activeLog = options?.activeLog;

  const isRunning = Boolean(
    projectId && (
      metrics?.projects?.[projectId]?.isRunning ??
      (activeLog ? activeLog.projectId === projectId : false)
    )
  );

  const baseElapsed = (projectId && metrics?.projects?.[projectId]?.totalElapsedSeconds) ?? 0;

  const getElapsedDelta = () => {
    if (!isRunning) return 0;
    const startTickMs = metrics?.snapshotNowIso
      ? new Date(metrics.snapshotNowIso).getTime()
      : (activeLog?.startTime ? new Date(activeLog.startTime).getTime() : Date.now());
    return Math.max(0, Math.floor((Date.now() - startTickMs) / 1000));
  };

  const [liveExtraSeconds, setLiveExtraSeconds] = useState(getElapsedDelta);

  const [prevProjectId, setPrevProjectId] = useState(projectId);
  if (prevProjectId !== projectId) {
    setPrevProjectId(projectId);
    setLiveExtraSeconds(getElapsedDelta());
  }

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const startTickMs = metrics?.snapshotNowIso
      ? new Date(metrics.snapshotNowIso).getTime()
      : (activeLog?.startTime ? new Date(activeLog.startTime).getTime() : Date.now());

    const update = () => {
      const now = Date.now();
      const extra = Math.max(0, Math.floor((now - startTickMs) / 1000));
      setLiveExtraSeconds(extra);
    };

    const intervalId = setInterval(update, refreshIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning, baseElapsed, metrics?.snapshotNowIso, activeLog?.startTime, refreshIntervalMs]);

  const elapsed = isRunning ? baseElapsed + liveExtraSeconds : baseElapsed;

  return {
    elapsedSeconds: elapsed,
    formattedElapsed: formatSeconds(elapsed),
    isRunning,
  };
}
