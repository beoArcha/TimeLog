import { useState, useEffect, useCallback, useRef } from 'react';
import { ErrorHandler, PersistenceException } from '@common/exceptions';

export interface ProjectBreakState {
  projectId: string;
  taskId: string;
  totalSeconds: number;
  breakEndTimeMs: number;
}

export const BREAK_PRESETS_MINUTES = [1, 2, 5, 10, 15] as const;

const STORAGE_KEY = 'oxy_active_break_timer';

const readPersistedBreak = (): ProjectBreakState | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProjectBreakState;
    if (parsed.breakEndTimeMs && parsed.breakEndTimeMs > Date.now()) {
      return parsed;
    }
    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch (err) {
    ErrorHandler.handle(
      new PersistenceException('Failed reading break timer from localStorage', err, 'WARN_BREAK_TIMER_READ', 'WARN')
    );
    return null;
  }
};

const savePersistedBreak = (state: ProjectBreakState | null): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    ErrorHandler.handle(
      new PersistenceException('Failed saving break timer to localStorage', err, 'ERR_BREAK_TIMER_SAVE')
    );
  }
};

export interface UseProjectBreakTimerOptions {
  onStartTimer: (taskId: string) => Promise<unknown> | void;
  onStopTimer: (projectId?: string) => Promise<unknown> | void;
}

export function useProjectBreakTimer({ onStartTimer, onStopTimer }: UseProjectBreakTimerOptions) {
  const [breakState, setBreakState] = useState<ProjectBreakState | null>(() => readPersistedBreak());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const initial = readPersistedBreak();
    if (!initial) return 0;
    return Math.max(0, Math.ceil((initial.breakEndTimeMs - Date.now()) / 1000));
  });

  const onStartTimerRef = useRef(onStartTimer);
  const onStopTimerRef = useRef(onStopTimer);

  useEffect(() => {
    onStartTimerRef.current = onStartTimer;
  }, [onStartTimer]);

  useEffect(() => {
    onStopTimerRef.current = onStopTimer;
  }, [onStopTimer]);

  const clearBreak = useCallback(() => {
    savePersistedBreak(null);
    setBreakState(null);
    setRemainingSeconds(0);
  }, []);

  const startBreak = useCallback((projectId: string, taskId: string, durationMinutes: number) => {
    const totalSeconds = Math.max(1, Math.round(durationMinutes * 60));
    const breakEndTimeMs = Date.now() + totalSeconds * 1000;
    const nextState: ProjectBreakState = {
      projectId,
      taskId,
      totalSeconds,
      breakEndTimeMs,
    };

    savePersistedBreak(nextState);
    setBreakState(nextState);
    setRemainingSeconds(totalSeconds);

    onStopTimerRef.current(projectId);
  }, []);

  const resumeWorkNow = useCallback(() => {
    if (!breakState) return;
    const taskIdToResume = breakState.taskId;
    clearBreak();
    onStartTimerRef.current(taskIdToResume);
  }, [breakState, clearBreak]);

  const cancelBreak = useCallback(() => {
    clearBreak();
  }, [clearBreak]);

  useEffect(() => {
    if (!breakState) return;

    const tick = () => {
      const diffMs = breakState.breakEndTimeMs - Date.now();
      const nextRemaining = Math.max(0, Math.ceil(diffMs / 1000));

      if (nextRemaining <= 0) {
        const taskIdToResume = breakState.taskId;
        clearBreak();
        onStartTimerRef.current(taskIdToResume);
        return;
      }

      setRemainingSeconds(nextRemaining);
    };

    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, [breakState, clearBreak]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedRemaining = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const total = breakState?.totalSeconds ?? 1;
  const progressPercent = Math.min(100, Math.max(0, Math.round(((total - remainingSeconds) / total) * 100)));

  return {
    isBreakActive: Boolean(breakState),
    breakState,
    remainingSeconds,
    formattedRemaining,
    progressPercent,
    startBreak,
    resumeWorkNow,
    cancelBreak,
  };
}
