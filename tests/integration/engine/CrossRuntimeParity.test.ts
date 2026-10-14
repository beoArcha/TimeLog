// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupLocalStorageMock } from '@tests/shared/mocks/browser-mocks';
import { mockInvoke } from '@tests/shared/mocks/tauri-ipc-mock';
import { EngineRouter } from '@common/engine/EngineRouter';
import { EngineCommands } from '@common/engine/EngineCommands';
import { EnginePlugin } from '@plugins/engine/EnginePlugin';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { EngineValidationError } from '@common/exceptions';
import { validateProjectName, validateTaskName } from '@plugins/engine/validation';

describe('Integration Tests: Cross-Runtime Parity Test Suite', () => {
  describe('Contract & Method Parity across Runtimes', () => {
    const requiredEngineMethods: (keyof EnginePlugin)[] = [
      'startTimer',
      'stopTimer',
      'resumeTimer',
      'getActiveLogs',
      'getComputedMetrics',
      'getTaskElapsed',
      'getProjectElapsed',
      'getElapsedRange',
      'editTimeLog',
      'getProjectStatistics',
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
        'getComputedMetrics',
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

    it('Given EngineCommands and EnginePlugin, When calling getActiveLogs, Both must conform to the contract', async () => {
      mockInvoke.mockResolvedValue(['log-1']);
      const desktop = new EngineCommands();
      const desktopLogs = await desktop.getActiveLogs();
      expect(desktopLogs).toEqual(['log-1']);

      setupLocalStorageMock();
      const persistence = new PersistencePlugin();
      PersistenceRouter.getInstance().setImplementationForTesting(persistence);

      const browser = new EnginePlugin();
      const browserLogs = await browser.getActiveLogs();
      expect(browserLogs).toEqual([]);
    });
  });

  describe('Cross-Runtime Elapsed Time Calculations', () => {
    beforeEach(async () => {
      setupLocalStorageMock();
      const persistence = new PersistencePlugin();
      PersistenceRouter.getInstance().setImplementationForTesting(persistence);
      const engine = new EnginePlugin();
      EngineRouter.getInstance().setImplementationForTesting(engine);

      await persistence.core.overrideState({
        projects: [
          {
            id: 'proj-1',
            name: 'P1',
            color: 'red',
            createdAt: '2026-06-15T00:00:00Z',
            archived: false,
          },
        ],
        tasks: [
          {
            id: 'task-1',
            projectId: 'proj-1',
            name: 'T1',
            createdAt: '2026-06-15T00:00:00Z',
            completed: false,
            status: 'Todo',
          },
          {
            id: 'task-sub',
            projectId: 'proj-1',
            parentTaskId: 'task-1',
            name: 'Sub',
            createdAt: '2026-06-15T00:00:00Z',
            completed: false,
            status: 'Todo',
          },
        ],
        logs: [
          {
            id: 'log-1',
            projectId: 'proj-1',
            taskId: 'task-1',
            startTime: '2026-06-15T10:00:00Z',
            endTime: '2026-06-15T11:00:00Z',
          },
          {
            id: 'log-2',
            projectId: 'proj-1',
            taskId: 'task-sub',
            startTime: '2026-06-15T11:00:00Z',
            endTime: '2026-06-15T11:30:00Z',
          },
        ],
        activeLog: null,
      });
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('Given identical seed state, When calculating task elapsed in Browser plugin, Then it matches expected duration', async () => {
      const engine = new EnginePlugin();
      const elapsed = await engine.getTaskElapsed('task-1');
      expect(elapsed).toBe(5400); // 3600 (self) + 1800 (subtask)
    });

    it('Given identical seed state, When calculating project elapsed in Browser plugin, Then it matches expected duration', async () => {
      const engine = new EnginePlugin();
      const elapsed = await engine.getProjectElapsed('proj-1');
      expect(elapsed).toBe(5400);
    });

    it('Given filter range in Browser plugin, When calculating range elapsed, Then it matches overlap correctly', async () => {
      const engine = new EnginePlugin();
      const range = {
        from: '2026-06-15T10:30:00Z',
        to: '2026-06-15T11:15:00Z',
        projectId: 'proj-1',
      };
      const elapsed = await engine.getElapsedRange(range);
      expect(elapsed).toBe(2700); // 1800 (from log-1) + 900 (from log-2)
    });
  });

  describe('Cross-Runtime Validation Parity', () => {
    beforeEach(async () => {
      setupLocalStorageMock();
      const persistence = new PersistencePlugin();
      PersistenceRouter.getInstance().setImplementationForTesting(persistence);
      const engine = new EnginePlugin();
      EngineRouter.getInstance().setImplementationForTesting(engine);
      await persistence.core.reset();
      await persistence.projects.add({ name: 'Alpha', color: 'red' });
    });

    it('Given duplicate project name, When validateProjectName is called, Then it should reject with EngineValidationError', async () => {
      const state = await PersistenceRouter.getInstance().core.load();
      expect(() => validateProjectName('ALPHA', state?.projects || [])).toThrow(EngineValidationError);
    });

    it('Given empty task name, When validateTaskName is called, Then it should reject with EngineValidationError', async () => {
      expect(() => validateTaskName('   ')).toThrow('Task name cannot be empty');
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
