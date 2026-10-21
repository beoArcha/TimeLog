import { describe, it, expect } from 'vitest';
import { calculateTaskElapsed, calculateProjectElapsed, calculateElapsedRange, computeAllMetrics } from '@plugins/engine/elapsed';
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

  it('should compute all task and project metrics in a single O(N) pass', () => {
    const sampleProjects = [
      { id: 'p1', name: 'Project 1', color: 'orange', description: null, icon: null, tags: null, createdAt: '2026-06-15T00:00:00Z', archived: false },
      { id: 'p2', name: 'Project 2', color: 'blue', description: null, icon: null, tags: null, createdAt: '2026-06-15T00:00:00Z', archived: false },
    ];

    const metrics = computeAllMetrics(sampleTasks, sampleLogs, sampleProjects, '2026-06-15T14:00:00Z');

    expect(metrics.snapshotNowIso).toBe('2026-06-15T14:00:00.000Z');
    expect(metrics.tasks['t1']).toEqual({
      taskId: 't1',
      elapsedSeconds: 5400,
      selfElapsedSeconds: 1800,
      isRunning: false,
      hasRunningChild: true,
    });
    expect(metrics.tasks['t2']).toEqual({
      taskId: 't2',
      elapsedSeconds: 3600,
      selfElapsedSeconds: 3600,
      isRunning: true,
      hasRunningChild: false,
    });
    expect(metrics.projects['p1']).toEqual({
      projectId: 'p1',
      totalElapsedSeconds: 5400,
      todayElapsedSeconds: 5400,
      thisWeekElapsedSeconds: 5400,
      activeTaskCount: 2,
      completedTaskCount: 0,
      isRunning: true,
    });
  });

  it('should calculate accurate multi-day elapsed and isolate today slice when log spans 72 hours across days', () => {
    // Arrange: 72 hours from Wednesday 2026-06-10T10:00:00Z to Saturday 2026-06-13T10:00:00Z
    const multiDayTask: Task = {
      id: 't-multi',
      projectId: 'p-multi',
      name: 'Long Task',
      completed: false,
      createdAt: '2026-06-10T00:00:00Z',
      status: null,
      parentTaskId: null,
    };
    const multiDayProject = {
      id: 'p-multi',
      name: 'Long Project',
      color: 'teal',
      description: null,
      icon: null,
      tags: null,
      createdAt: '2026-06-10T00:00:00Z',
      archived: false,
    };
    const multiDayLog: TimeLog = {
      id: 'l-multi',
      taskId: 't-multi',
      projectId: 'p-multi',
      startTime: '2026-06-10T10:00:00Z',
      endTime: '2026-06-13T10:00:00Z',
      note: null,
      editHistory: null,
    };
    const nowIso = '2026-06-13T12:00:00Z'; // Saturday

    // Act
    const metrics = computeAllMetrics([multiDayTask], [multiDayLog], [multiDayProject], nowIso);

    // Assert
    // Total 72 hours = 259,200s
    expect(metrics.tasks['t-multi'].elapsedSeconds).toBe(259200);
    expect(metrics.projects['p-multi'].totalElapsedSeconds).toBe(259200);
    // Saturday slice: 2026-06-13 00:00:00 to 10:00:00 = 10 hours = 36,000s
    expect(metrics.projects['p-multi'].todayElapsedSeconds).toBe(36000);
    // Monday 2026-06-08 was the start of the week, so entire 72h falls within this week
    expect(metrics.projects['p-multi'].thisWeekElapsedSeconds).toBe(259200);
  });

  it('should calculate accurate ongoing duration and today overlap when active log runs for 48 hours', () => {
    // Arrange: Started Thursday 2026-06-11T10:00:00Z, active at Saturday 2026-06-13T10:00:00Z
    const activeTask: Task = {
      id: 't-act',
      projectId: 'p-act',
      name: 'Active Long Task',
      completed: false,
      createdAt: '2026-06-11T00:00:00Z',
      status: null,
      parentTaskId: null,
    };
    const activeProject = {
      id: 'p-act',
      name: 'Active Project',
      color: 'indigo',
      description: null,
      icon: null,
      tags: null,
      createdAt: '2026-06-11T00:00:00Z',
      archived: false,
    };
    const activeLog: TimeLog = {
      id: 'l-act',
      taskId: 't-act',
      projectId: 'p-act',
      startTime: '2026-06-11T10:00:00Z',
      endTime: null,
      note: null,
      editHistory: null,
    };
    const nowIso = '2026-06-13T10:00:00Z'; // Saturday

    // Act
    const metrics = computeAllMetrics([activeTask], [activeLog], [activeProject], nowIso);

    // Assert
    // 48 hours = 172,800s
    expect(metrics.tasks['t-act'].elapsedSeconds).toBe(172800);
    expect(metrics.tasks['t-act'].isRunning).toBe(true);
    expect(metrics.projects['p-act'].totalElapsedSeconds).toBe(172800);
    expect(metrics.projects['p-act'].isRunning).toBe(true);
    // Saturday 00:00 to 10:00 = 10 hours = 36,000s
    expect(metrics.projects['p-act'].todayElapsedSeconds).toBe(36000);
    expect(metrics.projects['p-act'].thisWeekElapsedSeconds).toBe(172800);
  });

  it('should calculate full 30 hours and cover 24 hours of leap day when log crosses February 29 leap boundary', () => {
    // Arrange: 2024-02-28T22:00:00Z to 2024-03-01T04:00:00Z (2h + 24h + 4h = 30h)
    const leapTask: Task = {
      id: 't-leap',
      projectId: 'p-leap',
      name: 'Leap Task',
      completed: false,
      createdAt: '2024-02-28T00:00:00Z',
      status: null,
      parentTaskId: null,
    };
    const leapLog: TimeLog = {
      id: 'l-leap',
      taskId: 't-leap',
      projectId: 'p-leap',
      startTime: '2024-02-28T22:00:00Z',
      endTime: '2024-03-01T04:00:00Z',
      note: null,
      editHistory: null,
    };
    const evalNow = '2024-03-01T12:00:00Z';

    // Act - total elapsed
    const elapsed = calculateTaskElapsed('t-leap', [leapTask], [leapLog], evalNow);
    // Act - range for entire Leap Day: 2024-02-29T00:00:00Z to 2024-03-01T00:00:00Z
    const leapDayRange = calculateElapsedRange(
      { from: '2024-02-29T00:00:00Z', to: '2024-03-01T00:00:00Z' },
      [leapTask],
      [leapLog],
      evalNow
    );

    // Assert: 30 hours = 108,000s; full 24 hours on 2024-02-29 = 86,400s
    expect(elapsed).toBe(108000);
    expect(leapDayRange).toBe(86400);
  });

  it('should isolate 8 hours today and track full week spanning December 2025 into January 2026 when crossing new year boundary', () => {
    // Arrange: 2025-12-31T20:00:00Z (Wednesday) to 2026-01-01T08:00:00Z (Thursday) = 12h = 43,200s
    const newYearTask: Task = {
      id: 't-ny',
      projectId: 'p-ny',
      name: 'New Year Task',
      completed: false,
      createdAt: '2025-12-31T00:00:00Z',
      status: null,
      parentTaskId: null,
    };
    const newYearProject = {
      id: 'p-ny',
      name: 'New Year Project',
      color: 'amber',
      description: null,
      icon: null,
      tags: null,
      createdAt: '2025-12-31T00:00:00Z',
      archived: false,
    };
    const newYearLog: TimeLog = {
      id: 'l-ny',
      taskId: 't-ny',
      projectId: 'p-ny',
      startTime: '2025-12-31T20:00:00Z',
      endTime: '2026-01-01T08:00:00Z',
      note: null,
      editHistory: null,
    };
    const nowIso = '2026-01-01T12:00:00Z'; // Thursday

    // Act
    const metrics = computeAllMetrics([newYearTask], [newYearLog], [newYearProject], nowIso);

    // Assert
    // Total: 12h = 43,200s
    expect(metrics.projects['p-ny'].totalElapsedSeconds).toBe(43200);
    // Today (2026-01-01 00:00 to 08:00): 8h = 28,800s
    expect(metrics.projects['p-ny'].todayElapsedSeconds).toBe(28800);
    // Week started Monday 2025-12-29, so all 43,200s is within this week
    expect(metrics.projects['p-ny'].thisWeekElapsedSeconds).toBe(43200);
  });

  it('should return 0 when no logs exist for task or project', () => {
    expect(calculateTaskElapsed('nonexistent', sampleTasks, sampleLogs)).toBe(0);
    expect(calculateProjectElapsed('nonexistent', sampleTasks, sampleLogs)).toBe(0);
  });
});
