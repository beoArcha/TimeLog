import { describe, it, expect } from 'vitest';
import {
  getTaskDurationSeconds,
  getProjectDurationSeconds,
  formatSeconds,
  formatFriendlyDuration
} from '@features/timelogs/utils/TimelogUtils';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

describe('Unit Tests: TimelogUtils', () => {
  const tasks: Task[] = [
    { id: 't1', projectId: 'p1', name: 'Root Task', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null },
    { id: 't2', projectId: 'p1', name: 'Sub Task', completed: false, createdAt: '2026-06-15T01:00:00Z', status: null, parentTaskId: 't1' }
  ];

  const logs: TimeLog[] = [
    { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T12:30:00Z', note: null, editHistory: null }, // 30 mins = 1800s
    { id: 'l2', taskId: 't2', projectId: 'p1', startTime: '2026-06-15T13:00:00Z', endTime: null, note: null, editHistory: null } // running, diff against now (14:00) is 1h = 3600s
  ];

  it('getTaskDurationSeconds should calculate duration recursively', () => {
    const dur = getTaskDurationSeconds('t1', tasks, logs, '2026-06-15T14:00:00Z');
    expect(dur).toBe(5400);
  });

  it('getProjectDurationSeconds should calculate project duration', () => {
    const dur = getProjectDurationSeconds('p1', tasks, logs, '2026-06-15T14:00:00Z');
    expect(dur).toBe(5400);
  });

  it('formatSeconds should format duration as HH:MM:SS', () => {
    expect(formatSeconds(0)).toBe('00:00:00');
    expect(formatSeconds(3665)).toBe('01:01:05');
  });

  it('formatFriendlyDuration should format duration to friendly string', () => {
    expect(formatFriendlyDuration(45)).toBe('45s');
    expect(formatFriendlyDuration(125)).toBe('2m 5s');
    expect(formatFriendlyDuration(3665)).toBe('1h 1m');
  });
});
