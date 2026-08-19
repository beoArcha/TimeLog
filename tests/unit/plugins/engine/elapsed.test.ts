import { describe, it, expect } from 'vitest';
import { calculateTaskElapsed, calculateProjectElapsed, calculateElapsedRange } from '@plugins/engine/elapsed';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

describe('Unit Tests: Browser Engine Pure Elapsed Module (plugins/engine/elapsed)', () => {
  const sampleTasks: Task[] = [
    { id: 't1', projectId: 'p1', name: 'Root Task 1', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null },
    { id: 't2', projectId: 'p1', name: 'Sub Task 1.1', completed: false, createdAt: '2026-06-15T01:00:00Z', status: null, parentTaskId: 't1' },
    { id: 't3', projectId: 'p2', name: 'Root Task 2', completed: false, createdAt: '2026-06-15T02:00:00Z', status: null, parentTaskId: null },
  ];

  const sampleLogs: TimeLog[] = [
    { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T12:30:00Z', note: null, editHistory: null }, // 30m = 1800s
    { id: 'l2', taskId: 't2', projectId: 'p1', startTime: '2026-06-15T13:00:00Z', endTime: null, note: null, editHistory: null }, // running, against 14:00 = 3600s
    { id: 'l3', taskId: 't3', projectId: 'p2', startTime: '2026-06-15T10:00:00Z', endTime: '2026-06-15T11:00:00Z', note: null, editHistory: null }, // 60m = 3600s
  ];

  it('should calculate task elapsed recursively including subtasks', () => {
    const elapsed = calculateTaskElapsed('t1', sampleTasks, sampleLogs, '2026-06-15T14:00:00Z');
    expect(elapsed).toBe(1800 + 3600); // 5400s
  });

  it('should calculate leaf task elapsed alone', () => {
    const elapsed = calculateTaskElapsed('t2', sampleTasks, sampleLogs, '2026-06-15T14:00:00Z');
    expect(elapsed).toBe(3600);
  });

  it('should calculate project elapsed for all tasks in project', () => {
    const elapsedP1 = calculateProjectElapsed('p1', sampleTasks, sampleLogs, '2026-06-15T14:00:00Z');
    expect(elapsedP1).toBe(5400);

    const elapsedP2 = calculateProjectElapsed('p2', sampleTasks, sampleLogs, '2026-06-15T14:00:00Z');
    expect(elapsedP2).toBe(3600);
  });

  it('should calculate elapsed range bounded by from and to timestamps', () => {
    // Range 12:15 to 13:30
    // l1 (12:00-12:30): overlap is 12:15 to 12:30 = 15m = 900s
    // l2 (13:00-14:00): overlap is 13:00 to 13:30 = 30m = 1800s
    const totalInRange = calculateElapsedRange(
      { from: '2026-06-15T12:15:00Z', to: '2026-06-15T13:30:00Z' },
      sampleTasks,
      sampleLogs,
      '2026-06-15T14:00:00Z'
    );
    expect(totalInRange).toBe(900 + 1800); // 2700s
  });

  it('should calculate elapsed range filtered by task and subtasks', () => {
    const taskRange = calculateElapsedRange(
      { from: '2026-06-15T00:00:00Z', to: '2026-06-15T23:59:59Z', taskId: 't1' },
      sampleTasks,
      sampleLogs,
      '2026-06-15T14:00:00Z'
    );
    expect(taskRange).toBe(5400);
  });

  it('should return 0 when no logs exist for task or project', () => {
    expect(calculateTaskElapsed('nonexistent', sampleTasks, sampleLogs)).toBe(0);
    expect(calculateProjectElapsed('nonexistent', sampleTasks, sampleLogs)).toBe(0);
  });
});
