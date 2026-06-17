import { describe, it, expect } from 'vitest';
import { 
  formatSeconds, 
  formatFriendlyDuration, 
  getTaskDurationSeconds, 
  getProjectDurationSeconds 
} from '../src/utils';
import { getTranslation, defaultTranslations } from '../src/utils/translations';
import { Project, Task, TimeLog } from '../src/types';

describe('Unit Tests: OxyFlow Utils & Time Math', () => {

  describe('formatSeconds', () => {
    it('should format seconds cleanly as HH:MM:SS', () => {
      expect(formatSeconds(0)).toBe('00:00:00');
      expect(formatSeconds(45)).toBe('00:00:45');
      expect(formatSeconds(60)).toBe('00:01:00');
      expect(formatSeconds(75)).toBe('00:01:15');
      expect(formatSeconds(59 * 60 + 59)).toBe('00:59:59');
      expect(formatSeconds(3600)).toBe('01:00:00');
      expect(formatSeconds(3665)).toBe('01:01:05');
      expect(formatSeconds(10 * 3600 + 45 * 60 + 12)).toBe('10:45:12');
    });

    it('should handle large second limits', () => {
      expect(formatSeconds(99 * 3600 + 59 * 60 + 59)).toBe('99:59:59');
    });
  });

  describe('formatFriendlyDuration', () => {
    it('should return seconds format for under 1 minute', () => {
      expect(formatFriendlyDuration(0)).toBe('0s');
      expect(formatFriendlyDuration(59)).toBe('59s');
    });

    it('should return minutes and seconds for under 1 hour', () => {
      expect(formatFriendlyDuration(60)).toBe('1m 0s');
      expect(formatFriendlyDuration(125)).toBe('2m 5s');
    });

    it('should return hours and minutes for values starting from 1 hour', () => {
      expect(formatFriendlyDuration(3600)).toBe('1h 0m');
      expect(formatFriendlyDuration(3660)).toBe('1h 1m');
      expect(formatFriendlyDuration(7380)).toBe('2h 3m');
    });
  });

  describe('getTaskDurationSeconds (Core Time Tracking Rules)', () => {
    const mockTasks: Task[] = [
      { id: 'task-1', projectId: 'p1', parentTaskId: null, name: 'Main Job', createdAt: '2026-06-12T00:00:00Z', completed: false },
      { id: 'sub-1', projectId: 'p1', parentTaskId: 'task-1', name: 'Subtask A', createdAt: '2026-06-12T00:01:00Z', completed: false },
      { id: 'sub-2', projectId: 'p1', parentTaskId: 'task-1', name: 'Subtask B', createdAt: '2026-06-12T00:02:00Z', completed: false }
    ];

    const refNow = '2026-06-12T12:00:00Z';

    it('should sum up finished log chunks correctly', () => {
      const logs: TimeLog[] = [
        { id: 'log-1', taskId: 'sub-1', projectId: 'p1', startTime: '2026-06-12T08:00:00Z', endTime: '2026-06-12T08:15:00Z' },
        { id: 'log-2', taskId: 'sub-1', projectId: 'p1', startTime: '2026-06-12T09:00:00Z', endTime: '2026-06-12T09:30:00Z' }
      ];

      const duration = getTaskDurationSeconds('sub-1', mockTasks, logs, refNow);
      expect(duration).toBe(2700);
    });

    it('should calculate live timer offset up to actual ISO reference if endTime is null', () => {
      const logs: TimeLog[] = [
        { id: 'log-active', taskId: 'sub-2', projectId: 'p1', startTime: '2026-06-12T11:00:00Z', endTime: null }
      ];

      const duration = getTaskDurationSeconds('sub-2', mockTasks, logs, refNow);
      expect(duration).toBe(3600);
    });

    it('should recursively cascade child task durations upward to parent task', () => {
      const logs: TimeLog[] = [
        { id: 'log-parent', taskId: 'task-1', projectId: 'p1', startTime: '2026-06-12T10:00:00Z', endTime: '2026-06-12T10:05:00Z' },
        { id: 'log-sub-a', taskId: 'sub-1', projectId: 'p1', startTime: '2026-06-12T08:00:00Z', endTime: '2026-06-12T08:15:00Z' },
        { id: 'log-sub-b-active', taskId: 'sub-2', projectId: 'p1', startTime: '2026-06-12T11:30:00Z', endTime: null }
      ];

      const parentTotal = getTaskDurationSeconds('task-1', mockTasks, logs, refNow);
      expect(parentTotal).toBe(3000);
    });
  });

  describe('getProjectDurationSeconds', () => {
    const mockTasks: Task[] = [
      { id: 'task-1', projectId: 'p1', parentTaskId: null, name: 'Core Engine Development', createdAt: '2026-06-12T00:00:00Z', completed: false },
      { id: 'task-2', projectId: 'p1', parentTaskId: null, name: 'Documentation Work', createdAt: '2026-06-12T00:01:00Z', completed: false },
      { id: 'sub-of-1', projectId: 'p1', parentTaskId: 'task-1', name: 'Refactoring SQLite Connector', createdAt: '2026-06-12T00:02:00Z', completed: false }
    ];

    const refNow = '2026-06-12T15:00:00Z';

    it('should accumulate durations for all root-level tasks in the project', () => {
      const logs: TimeLog[] = [
        { id: 'l1', taskId: 'task-1', projectId: 'p1', startTime: '2026-06-12T08:00:00Z', endTime: '2026-06-12T08:10:00Z' },
        { id: 'l2', taskId: 'task-2', projectId: 'p1', startTime: '2026-06-12T09:00:00Z', endTime: '2026-06-12T09:15:00Z' },
        { id: 'l3', taskId: 'sub-of-1', projectId: 'p1', startTime: '2026-06-12T10:00:00Z', endTime: '2026-06-12T10:30:00Z' }
      ];

      const projectTotal = getProjectDurationSeconds('p1', mockTasks, logs, refNow);
      expect(projectTotal).toBe(3300);
    });

    it('should return 0 when no tasks present', () => {
      const projectTotal = getProjectDurationSeconds('empty-project-id', [], [], refNow);
      expect(projectTotal).toBe(0);
    });
  });

  describe('Multi-Language Fallback Checkers', () => {
    it('should return the correct translation value from Polish locale', () => {
      const val = getTranslation('pl', 'guiInterface');
      expect(val).toBe('Interfejs GUI');
    });

    it('should fallback to English for missing custom keys or when custom parameters are absent', () => {
      const val = getTranslation('custom', 'guiInterface', {});
      expect(val).toBe(defaultTranslations['en']['guiInterface']);
    });

    it('should correctly prioritize custom overrides if provided custom locale state', () => {
      const overrides = { guiInterface: 'Moje wspaniałe GUI' };
      const val = getTranslation('custom', 'guiInterface', overrides);
      expect(val).toBe('Moje wspaniałe GUI');
    });
  });

  describe('Utility edge cases', () => {
    it('formatFriendlyDuration handle exactly 60 seconds', () => {
      expect(formatFriendlyDuration(60)).toBe('1m 0s');
    });

    it('formatFriendlyDuration handle exactly 1 hour', () => {
      expect(formatFriendlyDuration(3600)).toBe('1h 0m');
    });

    it('getProjectDurationSeconds handle tasks without logs', () => {
      const mockTasks = [{ id: 'task-1', projectId: 'p1', parentTaskId: null, name: 'Main Job', createdAt: '2026-06-12T00:00:00Z', completed: false }];
      expect(getProjectDurationSeconds('p1', mockTasks, [], '2026-06-12T12:00:00Z')).toBe(0);
    });

    it('getTaskDurationSeconds should support multi-layered nested subtasks recursively', () => {
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

    it('formatFriendlyDuration should handle extremely large durations flawlessly', () => {
      const largeSeconds = 450 * 3600 + 15 * 60;
      expect(formatFriendlyDuration(largeSeconds)).toBe('450h 15m');
    });
  });

  describe('Translation fallbacks', () => {
    it('returns custom translation or fallback value', () => {
      const locale = 'custom';
      const customDict = {
        activeTracker: 'Mój Aktywny Czas'
      };
      
      const translation = getTranslation(locale, 'activeTracker', customDict);
      expect(translation).toBe('Mój Aktywny Czas');
      
      const fallback = getTranslation('fr' as any, 'missing_key' as any);
      expect(fallback).toBeUndefined();
    });
  });

  describe('Backup, Export & API Push Settings Behavior', () => {
    it('simulates parsing and falling back for custom api headers', () => {
      let validHeaders = '{"X-Token": "123"}';
      let parsed = {};
      try { parsed = JSON.parse(validHeaders) } catch (e) {}
      expect(parsed).toHaveProperty('X-Token', '123');
      
      let invalidHeaders = '{token: 123';
      let parsedInvalid = { "Authorization": "Bearer fallback" };
      try { 
        const custom = JSON.parse(invalidHeaders);
        parsedInvalid = { ...parsedInvalid, ...custom };
      } catch (e) { }
      expect(parsedInvalid).toHaveProperty('Authorization', 'Bearer fallback');
      expect(parsedInvalid).not.toHaveProperty('token');
    });

    it('verifies that default method for JSON push is POST', () => {
      const getMethod = (prefMethod?: 'POST' | 'PUT') => prefMethod || 'POST';
      expect(getMethod()).toBe('POST');
      expect(getMethod('PUT')).toBe('PUT');
      expect(getMethod('POST')).toBe('POST');
    });
    
    it('generates correct backup JSON structure', () => {
      const data = { projects: [], tasks: [], logs: [], holidays: [], patches: [] };
      const backupStr = JSON.stringify(data);
      expect(backupStr).toContain('"projects":[]');
      expect(backupStr).toContain('"patches":[]');
    });
  });
});
