import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTaskItem } from '@features/tasks/components/TaskItem/hooks/useTaskItem';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

describe('Unit Tests: useTaskItem', () => {
  const rootTask: Task = { id: 't1', projectId: 'p1', name: 'Root Task', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null };
  const subTask: Task = { id: 't2', projectId: 'p1', name: 'Subtask', completed: false, createdAt: '2026-06-15T01:00:00Z', status: null, parentTaskId: 't1' };

  const projectTasks = [rootTask, subTask];
  const tasks = [rootTask, subTask];

  it('should resolve duration and identify subtasks', () => {
    const logs: TimeLog[] = [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', note: null, editHistory: null }
    ];

    const { result } = renderHook(() => useTaskItem({
      rootTask,
      tasks,
      logs,
      nowIso: '2026-06-15T14:00:00Z',
      projectTasks
    }));

    expect(result.current.subTasks).toEqual([subTask]);
    expect(result.current.rootDuration).toBe(3600);
    expect(result.current.isCurrentRunning).toBe(false);
    expect(result.current.isChildRunning).toBe(false);
  });

  it('should identify running subtasks', () => {
    const logs: TimeLog[] = [
      { id: 'l1', taskId: 't2', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: null, note: null, editHistory: null }
    ];

    const { result } = renderHook(() => useTaskItem({
      rootTask,
      tasks,
      logs,
      nowIso: '2026-06-15T14:00:00Z',
      projectTasks
    }));

    expect(result.current.isCurrentRunning).toBe(false);
    expect(result.current.isChildRunning).toBe(true);
    expect(result.current.runningSubtask).toEqual(subTask);
    expect(result.current.isAnyRunning).toBe(true);
  });
});
