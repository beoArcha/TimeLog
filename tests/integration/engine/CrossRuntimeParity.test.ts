// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupLocalStorageMock } from '@tests/shared/mocks/browser-mocks';
import { mockInvoke } from '@tests/shared/mocks/tauri-ipc-mock';
import { EngineRouter } from '@common/engine/EngineRouter';
import { EngineCommands } from '@common/engine/EngineCommands';
import { EnginePlugin } from '@plugins/engine/EnginePlugin';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { EngineValidationError, EngineError } from '@common/exceptions';

describe('Integration Tests: Cross-Runtime Parity Test Suite', () => {
  describe('Contract & Method Parity across Runtimes', () => {
    const requiredEngineMethods: (keyof EnginePlugin)[] = [
      'startTimer',
      'stopTimer',
      'resumeTimer',
      'getActiveLogs',
      'getTaskElapsed',
      'getProjectElapsed',
      'getElapsedRange',
      'editTimeLog',
      'getProjectStatistics',
      'addProject',
      'updateProject',
      'renameProject',
      'toggleProjectArchive',
      'addTask',
      'updateTask',
      'renameTask',
      'deleteTask',
      'toggleTaskComplete',
      'getSettings',
      'saveSettings',
      'getRuntimeConfigs',
      'saveRuntimeConfig',
      'getState',
      'resetState',
    ];

    it('Given EnginePlugin (Browser Runtime), Then all required IEngine methods must be implemented', () => {
      const plugin = new EnginePlugin();
      for (const method of requiredEngineMethods) {
        expect(typeof plugin[method]).toBe('function');
      }
    });

    it('Given EngineCommands (Desktop Tauri Runtime), Then core IEngine methods must be implemented', () => {
      const commands = new EngineCommands();
      const coreMethods: (keyof EngineCommands)[] = [
        'startTimer',
        'stopTimer',
        'resumeTimer',
        'getActiveLogs',
        'getTaskElapsed',
        'getProjectElapsed',
        'getElapsedRange',
        'editTimeLog',
        'getProjectStatistics',
      ];
      for (const method of coreMethods) {
        expect(typeof commands[method]).toBe('function');
      }
    });
  });

  describe('Calculation & Elapsed Parity (Matching Rust Algorithm)', () => {
    let engine: EnginePlugin;
    let persistence: PersistencePlugin;

    beforeEach(async () => {
      vi.restoreAllMocks();
      setupLocalStorageMock();
      persistence = new PersistencePlugin();
      PersistenceRouter.getInstance().setImplementationForTesting(persistence);
      engine = new EnginePlugin();
      EngineRouter.getInstance().setImplementationForTesting(engine);

      await persistence.core.overrideState({
        projects: [
          { id: 'p1', name: 'Project Alpha', color: 'blue', createdAt: '2026-06-15T00:00:00Z', archived: false }
        ],
        tasks: [
          { id: 't1', projectId: 'p1', parentTaskId: null, name: 'Parent Task', createdAt: '2026-06-15T00:00:00Z', completed: false, status: 'InProgress' },
          { id: 't2', projectId: 'p1', parentTaskId: 't1', name: 'Child Task', createdAt: '2026-06-15T00:00:00Z', completed: false, status: 'Todo' }
        ],
        logs: [
          { id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-06-15T10:00:00Z', endTime: '2026-06-15T11:00:00Z' }, // 3600s
          { id: 'l2', projectId: 'p1', taskId: 't2', startTime: '2026-06-15T11:30:00Z', endTime: '2026-06-15T12:00:00Z' }, // 1800s
          { id: 'l3', projectId: 'p1', taskId: 't1', startTime: '2026-06-15T13:00:00Z', endTime: null } // ongoing
        ],
        activeLog: { id: 'l3', projectId: 'p1', taskId: 't1', startTime: '2026-06-15T13:00:00Z' }
      });
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('Given subtask logs, Then calculateTaskElapsed must include direct logs + subtask logs recursively', async () => {
      const fixedNow = '2026-06-15T13:30:00Z'; // +1800s for active log l3
      // Direct t1: 3600 (l1) + 1800 (l3) = 5400s
      // Child t2: 1800 (l2)
      // Total t1 elapsed = 5400 + 1800 = 7200s (2 hours)
      const elapsed = await engine.getTaskElapsed('t1', fixedNow);
      expect(elapsed).toBe(7200);

      // Child t2 direct elapsed = 1800s
      const childElapsed = await engine.getTaskElapsed('t2', fixedNow);
      expect(childElapsed).toBe(1800);
    });

    it('Given project with tasks and subtasks, Then calculateProjectElapsed must match sum of all tasks', async () => {
      const fixedNow = '2026-06-15T13:30:00Z';
      const projectElapsed = await engine.getProjectElapsed('p1', fixedNow);
      expect(projectElapsed).toBe(7200);
    });

    it('Given date range filter, Then calculateElapsedRange must clamp and sum only within boundary', async () => {
      const fixedNow = '2026-06-15T13:30:00Z';
      // Filter from 10:30 to 11:45
      // l1 (10:00 - 11:00) clamped to 10:30 - 11:00 = 1800s
      // l2 (11:30 - 12:00) clamped to 11:30 - 11:45 = 900s
      // Total = 2700s
      const rangeElapsed = await engine.getElapsedRange(
        { from: '2026-06-15T10:30:00Z', to: '2026-06-15T11:45:00Z' },
        fixedNow
      );
      expect(rangeElapsed).toBe(2700);
    });
  });

  describe('Validation & Error Parity', () => {
    let engine: EnginePlugin;

    beforeEach(async () => {
      setupLocalStorageMock();
      const persistence = new PersistencePlugin();
      PersistenceRouter.getInstance().setImplementationForTesting(persistence);
      engine = new EnginePlugin();
      EngineRouter.getInstance().setImplementationForTesting(engine);
      await engine.resetState();
      await engine.addProject({ name: 'Alpha', color: 'red' });
    });

    it('Given duplicate project name, When addProject is called, Then it should reject with EngineValidationError', async () => {
      let caughtError: unknown;
      try {
        await engine.addProject({ name: 'ALPHA', color: 'blue' });
      } catch (err) {
        caughtError = err;
      }
      expect(caughtError).toBeInstanceOf(EngineValidationError);
      expect(caughtError).toBeInstanceOf(EngineError);
      expect((caughtError as EngineValidationError).code).toBe('ERR_ENGINE_DUPLICATE_NAME');
    });

    it('Given empty task name, When addTask is called, Then it should reject with EngineValidationError', async () => {
      const state = await engine.getState();
      const projId = state.projects[0].id;

      await expect(engine.addTask({ projectId: projId, name: '   ', parentTaskId: null })).rejects.toThrow(
        'Task name cannot be empty'
      );
    });
  });

  describe('Desktop Tauri Commands Parity Invocation', () => {
    it('Given Desktop Tauri Engine, When getElapsedRange is called, Then it should invoke get_elapsed_range with range payload', async () => {
      const commands = new EngineCommands();
      mockInvoke.mockResolvedValue(2700);

      const filter = { from: '2026-06-15T10:30:00Z', to: '2026-06-15T11:45:00Z' };
      const res = await commands.getElapsedRange(filter);

      expect(mockInvoke).toHaveBeenCalledWith('get_elapsed_range', {
        range: filter,
        nowIso: undefined,
      });
      expect(res).toBe(2700);
    });
  });
});
