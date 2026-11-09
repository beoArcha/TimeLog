import { describe, it, expect } from 'vitest';
import {
  groupTimeLogs,
  getLogDurationSeconds,
} from '@features/reports/utils/grouping';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';

describe('Unit Tests: Hierarchical Grouping Model (grouping.ts)', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Alpha Project',
      color: 'indigo',
      createdAt: '2026-01-01T00:00:00Z',
      tags: ['client', 'backend'],
    },
    {
      id: 'proj-2',
      name: 'Beta Project',
      color: 'emerald',
      createdAt: '2026-01-01T00:00:00Z',
      tags: ['internal'],
    },
  ];

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      projectId: 'proj-1',
      name: 'Architecture Design',
      completed: false,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'task-2',
      projectId: 'proj-1',
      name: 'Core Engine',
      completed: false,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'subtask-2-1',
      projectId: 'proj-1',
      parentTaskId: 'task-2',
      name: 'Parser Submodule',
      completed: false,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'subtask-2-2',
      projectId: 'proj-1',
      parentTaskId: 'task-2',
      name: 'AST Walker',
      completed: false,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'task-3',
      projectId: 'proj-2',
      name: 'Documentation',
      completed: false,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  describe('getLogDurationSeconds helper', () => {
    it('should return clampedDurationSeconds when available on ClampedTimeLog', () => {
      const clampedLog: ClampedTimeLog = {
        id: 'cl-1',
        projectId: 'proj-1',
        taskId: 'task-1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: '2026-06-15T11:00:00Z',
        originalDurationSeconds: 3600,
        clampedDurationSeconds: 1800,
        isMultiDaySegment: false,
        clampedStartTime: '2026-06-15T10:30:00Z',
        clampedEndTime: '2026-06-15T11:00:00Z',
      };

      expect(getLogDurationSeconds(clampedLog)).toBe(1800);
    });

    it('should calculate elapsed seconds between start and end for standard TimeLog', () => {
      const log: TimeLog = {
        id: 'l-1',
        projectId: 'proj-1',
        taskId: 'task-1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: '2026-06-15T11:15:30Z',
      };

      expect(getLogDurationSeconds(log)).toBe(4530);
    });

    it('should use nowIso fallback when endTime is undefined (active timer)', () => {
      const activeLog: TimeLog = {
        id: 'l-active',
        projectId: 'proj-1',
        taskId: 'task-1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: undefined,
      };

      const nowIso = '2026-06-15T10:20:00Z';
      expect(getLogDurationSeconds(activeLog, nowIso)).toBe(1200);
    });

    it('should return 0 when date strings are invalid', () => {
      const invalidLog: TimeLog = {
        id: 'l-err',
        projectId: 'proj-1',
        taskId: 'task-1',
        startTime: 'invalid-date',
        endTime: 'invalid-date',
      };

      expect(getLogDurationSeconds(invalidLog)).toBe(0);
    });
  });

  describe('groupTimeLogs edge cases', () => {
    it('should return empty hierarchy when logs array is empty', () => {
      const result = groupTimeLogs({
        logs: [],
        projects: mockProjects,
        tasks: mockTasks,
      });

      expect(result.projects).toHaveLength(0);
      expect(result.totalDurationSeconds).toBe(0);
      expect(result.totalLogsCount).toBe(0);
    });

    it('should correctly group a single log on a root task without subtasks', () => {
      const singleLog: TimeLog = {
        id: 'l-single',
        projectId: 'proj-1',
        taskId: 'task-1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: '2026-06-15T10:30:00Z',
      };

      const result = groupTimeLogs({
        logs: [singleLog],
        projects: mockProjects,
        tasks: mockTasks,
      });

      expect(result.projects).toHaveLength(1);
      const proj = result.projects[0];
      expect(proj.projectId).toBe('proj-1');
      expect(proj.projectName).toBe('Alpha Project');
      expect(proj.tags).toEqual(['client', 'backend']);
      expect(proj.durationSeconds).toBe(1800);
      expect(proj.tasks).toHaveLength(1);

      const task = proj.tasks[0];
      expect(task.task.id).toBe('task-1');
      expect(task.task.name).toBe('Architecture Design');
      expect(task.durationSeconds).toBe(1800);
      expect(task.directLogs).toHaveLength(1);
      expect(task.directLogs[0].id).toBe('l-single');
      expect(task.subtasks).toHaveLength(0);

      expect(result.totalDurationSeconds).toBe(1800);
      expect(result.totalLogsCount).toBe(1);
    });

    it('should correctly group a single log on a subtask under its parent task', () => {
      const subtaskLog: TimeLog = {
        id: 'l-sub',
        projectId: 'proj-1',
        taskId: 'subtask-2-1',
        startTime: '2026-06-15T11:00:00Z',
        endTime: '2026-06-15T11:45:00Z',
      };

      const result = groupTimeLogs({
        logs: [subtaskLog],
        projects: mockProjects,
        tasks: mockTasks,
      });

      expect(result.projects).toHaveLength(1);
      const proj = result.projects[0];
      expect(proj.projectId).toBe('proj-1');
      expect(proj.durationSeconds).toBe(2700);

      expect(proj.tasks).toHaveLength(1);
      const task = proj.tasks[0];
      expect(task.task.id).toBe('task-2');
      expect(task.task.name).toBe('Core Engine');
      expect(task.durationSeconds).toBe(2700);
      expect(task.directLogs).toHaveLength(0);

      expect(task.subtasks).toHaveLength(1);
      const sub = task.subtasks[0];
      expect(sub.subtask.id).toBe('subtask-2-1');
      expect(sub.subtask.name).toBe('Parser Submodule');
      expect(sub.durationSeconds).toBe(2700);
      expect(sub.logs).toHaveLength(1);
      expect(sub.logs[0].id).toBe('l-sub');

      expect(result.totalDurationSeconds).toBe(2700);
      expect(result.totalLogsCount).toBe(1);
    });

    it('should handle unknown task ID and unknown project ID without crashing', () => {
      const orphanLog: TimeLog = {
        id: 'l-orphan',
        projectId: 'proj-unknown',
        taskId: 'task-unknown',
        startTime: '2026-06-15T09:00:00Z',
        endTime: '2026-06-15T09:10:00Z',
      };

      const result = groupTimeLogs({
        logs: [orphanLog],
        projects: mockProjects,
        tasks: mockTasks,
      });

      expect(result.projects).toHaveLength(1);
      const proj = result.projects[0];
      expect(proj.projectId).toBe('proj-unknown');
      expect(proj.projectName).toBe('Unknown');
      expect(proj.tags).toEqual([]);
      expect(proj.durationSeconds).toBe(600);

      expect(proj.tasks).toHaveLength(1);
      expect(proj.tasks[0].task.id).toBe('task-unknown');
      expect(proj.tasks[0].directLogs).toHaveLength(1);
    });
  });

  describe('Full multi-tier hierarchy and duration strict sum invariant', () => {
    it('should accurately aggregate direct logs, multiple subtasks, and separate projects', () => {
      const logs: TimeLog[] = [
        // Project 1 - Task 1 (direct log 1): 1800s
        {
          id: 'l1',
          projectId: 'proj-1',
          taskId: 'task-1',
          startTime: '2026-06-15T08:00:00Z',
          endTime: '2026-06-15T08:30:00Z',
        },
        // Project 1 - Task 1 (direct log 2): 1800s -> Task 1 total = 3600s
        {
          id: 'l2',
          projectId: 'proj-1',
          taskId: 'task-1',
          startTime: '2026-06-15T08:30:00Z',
          endTime: '2026-06-15T09:00:00Z',
        },
        // Project 1 - Task 2 (direct log): 900s
        {
          id: 'l3',
          projectId: 'proj-1',
          taskId: 'task-2',
          startTime: '2026-06-15T09:00:00Z',
          endTime: '2026-06-15T09:15:00Z',
        },
        // Project 1 - Task 2 -> Subtask 2-1: 1200s
        {
          id: 'l4',
          projectId: 'proj-1',
          taskId: 'subtask-2-1',
          startTime: '2026-06-15T09:15:00Z',
          endTime: '2026-06-15T09:35:00Z',
        },
        // Project 1 - Task 2 -> Subtask 2-2: 600s -> Task 2 total = 900 + 1200 + 600 = 2700s
        {
          id: 'l5',
          projectId: 'proj-1',
          taskId: 'subtask-2-2',
          startTime: '2026-06-15T09:35:00Z',
          endTime: '2026-06-15T09:45:00Z',
        },
        // Project 2 - Task 3 (direct log): 2000s -> Project 2 total = 2000s
        {
          id: 'l6',
          projectId: 'proj-2',
          taskId: 'task-3',
          startTime: '2026-06-15T10:00:00Z',
          endTime: '2026-06-15T10:33:20Z',
        },
      ];

      const result = groupTimeLogs({
        logs,
        projects: mockProjects,
        tasks: mockTasks,
      });

      // Verification of total hierarchy metrics
      expect(result.totalLogsCount).toBe(6);
      expect(result.totalDurationSeconds).toBe(3600 + 2700 + 2000); // 8300s
      expect(result.projects).toHaveLength(2);

      // Project 1
      const p1 = result.projects.find((p) => p.projectId === 'proj-1')!;
      expect(p1.durationSeconds).toBe(6300); // 3600 + 2700
      expect(p1.tasks).toHaveLength(2);

      // Task 1 (no subtasks, only direct logs)
      const t1 = p1.tasks.find((t) => t.task.id === 'task-1')!;
      expect(t1.durationSeconds).toBe(3600);
      expect(t1.directLogs).toHaveLength(2);
      expect(t1.subtasks).toHaveLength(0);

      // Task 2 (has both direct log AND 2 subtasks)
      const t2 = p1.tasks.find((t) => t.task.id === 'task-2')!;
      expect(t2.durationSeconds).toBe(2700);
      expect(t2.directLogs).toHaveLength(1);
      expect(t2.subtasks).toHaveLength(2);

      const st21 = t2.subtasks.find((s) => s.subtask.id === 'subtask-2-1')!;
      expect(st21.durationSeconds).toBe(1200);
      expect(st21.logs).toHaveLength(1);

      const st22 = t2.subtasks.find((s) => s.subtask.id === 'subtask-2-2')!;
      expect(st22.durationSeconds).toBe(600);
      expect(st22.logs).toHaveLength(1);

      // Project 2
      const p2 = result.projects.find((p) => p.projectId === 'proj-2')!;
      expect(p2.durationSeconds).toBe(2000);
      expect(p2.tasks).toHaveLength(1);

      const t3 = p2.tasks.find((t) => t.task.id === 'task-3')!;
      expect(t3.durationSeconds).toBe(2000);
      expect(t3.directLogs).toHaveLength(1);
      expect(t3.subtasks).toHaveLength(0);

      // Strict mathematical invariants
      const calculatedP1Sum = p1.tasks.reduce((sum, t) => sum + t.durationSeconds, 0);
      expect(p1.durationSeconds).toBe(calculatedP1Sum);

      const calculatedT2Sum =
        t2.directLogs.reduce((sum, l) => sum + getLogDurationSeconds(l), 0) +
        t2.subtasks.reduce((sum, s) => sum + s.durationSeconds, 0);
      expect(t2.durationSeconds).toBe(calculatedT2Sum);

      const calculatedOverallSum = result.projects.reduce((sum, p) => sum + p.durationSeconds, 0);
      expect(result.totalDurationSeconds).toBe(calculatedOverallSum);
    });
  });
});
