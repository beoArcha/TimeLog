import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTaskItem } from '@features/tasks/components/TaskItem/hooks/useTaskItem';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

describe('useTaskItem', () => {
  const rootTask: Task = { id: 't1', projectId: 'p1', name: 'Root Task', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null };
  const subTask: Task = { id: 't2', projectId: 'p1', name: 'Subtask', completed: false, createdAt: '2026-06-15T01:00:00Z', status: null, parentTaskId: 't1' };

  const projectTasks = [rootTask, subTask];
  const tasks = [rootTask, subTask];

  it('should resolve duration and identify subtasks when tasks are idle', () => {
    // Arrange
    const logs: TimeLog[] = [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', note: null, editHistory: null }
    ];

    const mockMetrics = {
      snapshotNowIso: '2026-06-15T14:00:00Z',
      tasks: {
        t1: {
          taskId: 't1',
          elapsedSeconds: 3600,
          selfElapsedSeconds: 3600,
          isRunning: false,
          hasRunningChild: false,
        },
      },
      projects: {},
    };

    // Act
    const { result } = renderHook(() => useTaskItem({
      rootTask,
      tasks,
      logs,
      nowIso: '2026-06-15T14:00:00Z',
      metrics: mockMetrics,
      projectTasks
    }));

    // Assert
    expect(result.current.subTasks).toEqual([subTask]);
    expect(result.current.rootDuration).toBe(3600);
    expect(result.current.isCurrentRunning).toBe(false);
    expect(result.current.isChildRunning).toBe(false);
  });

  it('should identify running subtasks when a child task has an open log', () => {
    // Arrange
    const logs: TimeLog[] = [
      { id: 'l1', taskId: 't2', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: null, note: null, editHistory: null }
    ];

    // Act
    const { result } = renderHook(() => useTaskItem({
      rootTask,
      tasks,
      logs,
      nowIso: '2026-06-15T14:00:00Z',
      projectTasks
    }));

    // Assert
    expect(result.current.isCurrentRunning).toBe(false);
    expect(result.current.isChildRunning).toBe(true);
    expect(result.current.runningSubtask).toEqual(subTask);
    expect(result.current.isAnyRunning).toBe(true);
  });

  it('should reflect running state when activeLog belongs to a subtask', () => {
    // Arrange
    const activeLog: TimeLog = {
      id: 'l_active',
      taskId: 't2',
      projectId: 'p1',
      startTime: '2026-06-15T12:00:00Z',
      endTime: null,
      note: null,
      editHistory: null,
    };
    const mockMetrics = {
      snapshotNowIso: '2026-06-15T12:05:00Z',
      tasks: {
        t1: {
          taskId: 't1',
          elapsedSeconds: 300,
          selfElapsedSeconds: 0,
          isRunning: false,
          hasRunningChild: true,
        },
        t2: {
          taskId: 't2',
          elapsedSeconds: 300,
          selfElapsedSeconds: 300,
          isRunning: true,
          hasRunningChild: false,
        },
      },
      projects: {},
    };

    // Act
    const { result } = renderHook(() => useTaskItem({
      rootTask,
      tasks,
      logs: [activeLog],
      activeLog,
      metrics: mockMetrics,
      projectTasks,
    }));

    // Assert
    expect(result.current.isChildRunning).toBe(true);
    expect(result.current.isAnyRunning).toBe(true);
    expect(result.current.runningSubtask?.id).toBe('t2');
    expect(result.current.rootDuration).toBeGreaterThanOrEqual(300);
  });
});
