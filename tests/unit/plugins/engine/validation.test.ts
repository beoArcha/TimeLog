import { describe, it, expect } from 'vitest';
import {
  validateProjectName,
  validateTaskName,
  validateTaskHierarchy,
  validateTimeLog,
} from '@plugins/engine/validation';
import { EngineValidationError, EngineError } from '@common/exceptions';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';


describe('Unit Tests: Engine Validation (Browser Internal)', () => {
  const mockProjects: Project[] = [
    { id: 'p1', name: 'Project Alpha', color: 'rose', createdAt: '2026-06-12T00:00:00Z' },
    { id: 'p2', name: 'Project Beta', color: 'indigo', createdAt: '2026-06-12T00:00:00Z' },
  ];

  const mockTasks: Task[] = [
    { id: 't1', projectId: 'p1', parentTaskId: null, name: 'Root Task 1', createdAt: '2026-06-12T00:00:00Z', completed: false },
    { id: 't2', projectId: 'p1', parentTaskId: 't1', name: 'Subtask 1.1', createdAt: '2026-06-12T00:00:00Z', completed: false },
    { id: 't3', projectId: 'p1', parentTaskId: null, name: 'Root Task 2', createdAt: '2026-06-12T00:00:00Z', completed: false },
  ];

  const mockLogs: TimeLog[] = [
    { id: 'log1', projectId: 'p1', taskId: 't1', startTime: '2026-06-15T10:00:00Z', endTime: '2026-06-15T11:00:00Z' },
    { id: 'log2', projectId: 'p1', taskId: 't2', startTime: '2026-06-15T13:00:00Z', endTime: '2026-06-15T14:00:00Z' },
  ];


  describe('validateProjectName', () => {
    it('Given empty name, Then it should throw EngineValidationError (inheriting from EngineError)', () => {
      let caughtError: unknown;
      try {
        validateProjectName('', mockProjects);
      } catch (e) {
        caughtError = e;
      }
      expect(caughtError).toBeInstanceOf(EngineValidationError);
      expect(caughtError).toBeInstanceOf(EngineError);
      expect(() => validateProjectName('', mockProjects)).toThrow('Project name cannot be empty');
      expect(() => validateProjectName('   ', mockProjects)).toThrow('Project name cannot be empty');
    });

    it('Given duplicate project name (case-insensitive), Then it should throw ERR_ENGINE_DUPLICATE_NAME', () => {
      expect(() => validateProjectName('project alpha', mockProjects)).toThrow(
        'Project with name "project alpha" already exists'
      );
    });


    it('Given duplicate name for same project (excludeProjectId), Then it should pass', () => {
      expect(() => validateProjectName('Project Alpha', mockProjects, 'p1')).not.toThrow();
    });

    it('Given unique valid project name, Then it should pass', () => {
      expect(() => validateProjectName('Project Gamma', mockProjects)).not.toThrow();
    });
  });

  describe('validateTaskName', () => {
    it('Given empty task name, Then it should throw ERR_ENGINE_VALIDATION', () => {
      expect(() => validateTaskName('')).toThrow('Task name cannot be empty');
      expect(() => validateTaskName('   ')).toThrow('Task name cannot be empty');
    });

    it('Given valid task name, Then it should pass', () => {
      expect(() => validateTaskName('Valid Task')).not.toThrow();
    });
  });

  describe('validateTaskHierarchy', () => {
    it('Given no parentTaskId, Then it should pass', () => {
      expect(() => validateTaskHierarchy('t1', null, mockTasks)).not.toThrow();
      expect(() => validateTaskHierarchy('t1', undefined, mockTasks)).not.toThrow();
    });

    it('Given task is its own parent, Then it should throw ERR_ENGINE_CIRCULAR_HIERARCHY', () => {
      expect(() => validateTaskHierarchy('t1', 't1', mockTasks)).toThrow('Task cannot be its own parent');
    });

    it('Given parent task is already a subtask, Then it should throw max depth error', () => {
      expect(() => validateTaskHierarchy('t3', 't2', mockTasks)).toThrow(
        'Cannot nest tasks more than one level deep'
      );
    });

    it('Given task already has subtasks and trying to set parent, Then it should throw error', () => {
      expect(() => validateTaskHierarchy('t1', 't3', mockTasks)).toThrow(
        'Cannot set a parent for a task that already has subtasks'
      );
    });

    it('Given valid root task as parent for task without subtasks, Then it should pass', () => {
      expect(() => validateTaskHierarchy('t3', 't1', mockTasks)).not.toThrow();
    });
  });

  describe('validateTimeLog', () => {
    const fixedNow = new Date('2026-06-15T18:00:00Z').getTime();

    it('Given invalid startTime, Then it should throw ERR_ENGINE_PARSE_TIME', () => {
      expect(() => validateTimeLog('new_log', 'invalid-date', '2026-06-15T12:00:00Z', mockLogs, fixedNow)).toThrow(
        'Parse time error: start_time is invalid'
      );
    });

    it('Given invalid endTime, Then it should throw ERR_ENGINE_PARSE_TIME', () => {
      expect(() => validateTimeLog('new_log', '2026-06-15T12:00:00Z', 'invalid-date', mockLogs, fixedNow)).toThrow(
        'Parse time error: end_time is invalid'
      );
    });

    it('Given endTime before startTime, Then it should throw ERR_ENGINE_VALIDATION', () => {
      expect(() =>
        validateTimeLog('new_log', '2026-06-15T12:00:00Z', '2026-06-15T11:00:00Z', mockLogs, fixedNow)
      ).toThrow('End time cannot be before start time');
    });

    it('Given startTime in the future, Then it should throw ERR_ENGINE_VALIDATION', () => {
      expect(() =>
        validateTimeLog('new_log', '2026-06-15T19:00:00Z', '2026-06-15T20:00:00Z', mockLogs, fixedNow)
      ).toThrow('Start time cannot be in the future');
    });

    it('Given overlapping time interval, Then it should throw ERR_ENGINE_OVERLAP', () => {
      expect(() =>
        validateTimeLog('new_log', '2026-06-15T10:30:00Z', '2026-06-15T11:30:00Z', mockLogs, fixedNow)
      ).toThrow('Time log overlaps with an existing log (ID: log1)');
    });

    it('Given overlapping time interval with self (same logId), Then it should pass', () => {
      expect(() =>
        validateTimeLog('log1', '2026-06-15T10:00:00Z', '2026-06-15T11:00:00Z', mockLogs, fixedNow)
      ).not.toThrow();
    });

    it('Given non-overlapping valid interval, Then it should pass', () => {
      expect(() =>
        validateTimeLog('new_log', '2026-06-15T11:00:00Z', '2026-06-15T12:00:00Z', mockLogs, fixedNow)
      ).not.toThrow();
    });
  });
});

