import { describe, it, expect } from 'vitest';
import { 
  formatSeconds, 
  formatFriendlyDuration, 
  getTaskDurationSeconds, 
  getProjectDurationSeconds 
} from '../../../src/utils';
import { Task, TimeLog } from '../../../src/types';

describe('Unit Tests: Time Calculations', () => {
  describe('formatSeconds', () => {
    it('should_format_seconds_cleanly_as_HH_MM_SS_when_various_durations_are_provided', () => {
      expect(formatSeconds(0)).toBe('00:00:00');
      expect(formatSeconds(45)).toBe('00:00:45');
      expect(formatSeconds(60)).toBe('00:01:00');
      expect(formatSeconds(75)).toBe('00:01:15');
      expect(formatSeconds(59 * 60 + 59)).toBe('00:59:59');
      expect(formatSeconds(3600)).toBe('01:00:00');
      expect(formatSeconds(3665)).toBe('01:01:05');
      expect(formatSeconds(10 * 3600 + 45 * 60 + 12)).toBe('10:45:12');
    });

    it('should_handle_large_second_limits_when_formatting_seconds', () => {
      expect(formatSeconds(99 * 3600 + 59 * 60 + 59)).toBe('99:59:59');
    });
  });

  describe('formatFriendlyDuration', () => {
    it('should_return_seconds_format_when_under_one_minute', () => {
      expect(formatFriendlyDuration(0)).toBe('0s');
      expect(formatFriendlyDuration(59)).toBe('59s');
    });

    it('should_return_minutes_and_seconds_when_under_one_hour', () => {
      expect(formatFriendlyDuration(60)).toBe('1m 0s');
      expect(formatFriendlyDuration(125)).toBe('2m 5s');
    });

    it('should_return_hours_and_minutes_when_starting_from_one_hour', () => {
      expect(formatFriendlyDuration(3600)).toBe('1h 0m');
      expect(formatFriendlyDuration(3660)).toBe('1h 1m');
      expect(formatFriendlyDuration(7380)).toBe('2h 3m');
    });

    it('should_handle_exactly_sixty_seconds_when_formatting_friendly_duration', () => {
      expect(formatFriendlyDuration(60)).toBe('1m 0s');
    });

    it('should_handle_exactly_one_hour_when_formatting_friendly_duration', () => {
      expect(formatFriendlyDuration(3600)).toBe('1h 0m');
    });

    it('should_handle_extremely_large_durations_flawlessly_when_formatting_friendly_duration', () => {
      const largeSeconds = 450 * 3600 + 15 * 60;
      expect(formatFriendlyDuration(largeSeconds)).toBe('450h 15m');
    });
  });

  describe('getTaskDurationSeconds', () => {
    const mockTasks: Task[] = [
      { id: 'task-1', projectId: 'p1', parentTaskId: null, name: 'Main Job', createdAt: '2026-06-12T00:00:00Z', completed: false },
      { id: 'sub-1', projectId: 'p1', parentTaskId: 'task-1', name: 'Subtask A', createdAt: '2026-06-12T00:01:00Z', completed: false },
      { id: 'sub-2', projectId: 'p1', parentTaskId: 'task-1', name: 'Subtask B', createdAt: '2026-06-12T00:02:00Z', completed: false }
    ];

    const refNow = '2026-06-12T12:00:00Z';

    it('should_sum_up_finished_log_chunks_correctly_when_calculating_task_duration', () => {
      const logs: TimeLog[] = [
        { id: 'log-1', taskId: 'sub-1', projectId: 'p1', startTime: '2026-06-12T08:00:00Z', endTime: '2026-06-12T08:15:00Z' },
        { id: 'log-2', taskId: 'sub-1', projectId: 'p1', startTime: '2026-06-12T09:00:00Z', endTime: '2026-06-12T09:30:00Z' }
      ];

      const duration = getTaskDurationSeconds('sub-1', mockTasks, logs, refNow);
      expect(duration).toBe(2700);
    });

    it('should_calculate_live_timer_offset_up_to_actual_ISO_reference_when_endTime_is_null', () => {
      const logs: TimeLog[] = [
        { id: 'log-active', taskId: 'sub-2', projectId: 'p1', startTime: '2026-06-12T11:00:00Z', endTime: null }
      ];

      const duration = getTaskDurationSeconds('sub-2', mockTasks, logs, refNow);
      expect(duration).toBe(3600);
    });

    it('should_recursively_cascade_child_task_durations_upward_when_calculating_parent_task_duration', () => {
      const logs: TimeLog[] = [
        { id: 'log-parent', taskId: 'task-1', projectId: 'p1', startTime: '2026-06-12T10:00:00Z', endTime: '2026-06-12T10:05:00Z' },
        { id: 'log-sub-a', taskId: 'sub-1', projectId: 'p1', startTime: '2026-06-12T08:00:00Z', endTime: '2026-06-12T08:15:00Z' },
        { id: 'log-sub-b-active', taskId: 'sub-2', projectId: 'p1', startTime: '2026-06-12T11:30:00Z', endTime: null }
      ];

      const parentTotal = getTaskDurationSeconds('task-1', mockTasks, logs, refNow);
      expect(parentTotal).toBe(3000);
    });

    it('should_support_multi_layered_nested_subtasks_recursively_when_calculating_task_duration', () => {
      const mockTasks: Task[] = [
        { id: 'parent-1', projectId: 'p1', parentTaskId: null, name: 'Root Project Task', createdAt: '2026-06-12T00:00:00Z', completed: false },
        { id: 'child-1', projectId: 'p1', parentTaskId: 'parent-1', name: 'Child Task level 1', createdAt: '2026-06-12T00:01:00Z', completed: false },
        { id: 'subchild-1', projectId: 'p1', parentTaskId: 'child-1', name: 'Subtask level 2', createdAt: '2026-06-12T00:02:00Z', completed: false }
      ];
      const logs: TimeLog[] = [
        { id: 'log-direct-parent', taskId: 'parent-1', projectId: 'p1', startTime: '2026-06-12T08:00:00Z', endTime: '2026-06-12T08:10:00Z' },
        { id: 'log-child-1', taskId: 'child-1', projectId: 'p1', startTime: '2026-06-12T09:00:00Z', endTime: '2026-06-12T09:15:00Z' },
        { id: 'log-sub-level-2', taskId: 'subchild-1', projectId: 'p1', startTime: '2026-06-12T10:00:00Z', endTime: '2026-06-12T10:05:00Z' }
      ];
      const duration = getTaskDurationSeconds('parent-1', mockTasks, logs, '2026-06-12T12:00:00Z');
      expect(duration).toBe(1800);
    });
  });

  describe('getProjectDurationSeconds', () => {
    const mockTasks: Task[] = [
      { id: 'task-1', projectId: 'p1', parentTaskId: null, name: 'Core Engine Development', createdAt: '2026-06-12T00:00:00Z', completed: false },
      { id: 'task-2', projectId: 'p1', parentTaskId: null, name: 'Documentation Work', createdAt: '2026-06-12T00:01:00Z', completed: false },
      { id: 'sub-of-1', projectId: 'p1', parentTaskId: 'task-1', name: 'Refactoring SQLite Connector', createdAt: '2026-06-12T00:02:00Z', completed: false }
    ];

    const refNow = '2026-06-12T15:00:00Z';

    it('should_accumulate_durations_for_all_root_level_tasks_when_calculating_project_duration', () => {
      const logs: TimeLog[] = [
        { id: 'l1', taskId: 'task-1', projectId: 'p1', startTime: '2026-06-12T08:00:00Z', endTime: '2026-06-12T08:10:00Z' },
        { id: 'l2', taskId: 'task-2', projectId: 'p1', startTime: '2026-06-12T09:00:00Z', endTime: '2026-06-12T09:15:00Z' },
        { id: 'l3', taskId: 'sub-of-1', projectId: 'p1', startTime: '2026-06-12T10:00:00Z', endTime: '2026-06-12T10:30:00Z' }
      ];

      const projectTotal = getProjectDurationSeconds('p1', mockTasks, logs, refNow);
      expect(projectTotal).toBe(3300);
    });

    it('should_return_zero_when_no_tasks_present', () => {
      const projectTotal = getProjectDurationSeconds('empty-project-id', [], [], refNow);
      expect(projectTotal).toBe(0);
    });

    it('should_return_zero_when_tasks_have_no_logs', () => {
      const mockTasks = [{ id: 'task-1', projectId: 'p1', parentTaskId: null, name: 'Main Job', createdAt: '2026-06-12T00:00:00Z', completed: false }];
      expect(getProjectDurationSeconds('p1', mockTasks, [], '2026-06-12T12:00:00Z')).toBe(0);
    });
  });
});
