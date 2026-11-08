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
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import auditParityCases from '@tests/shared/fixtures/audit-parity-cases.json';

describe('Integration Tests: Cross-Runtime Parity Test Suite', () => {
  beforeEach(() => {
    mockInvoke.mockClear();
  });

  describe('Contract & Method Parity across Runtimes', () => {
    it('Given EnginePlugin (Browser Runtime), Then all segregated sub-engines must implement their contract', () => {
      const plugin = new EnginePlugin();

      expect(typeof plugin.timer.startTimer).toBe('function');
      expect(typeof plugin.timer.stopTimer).toBe('function');
      expect(typeof plugin.timer.resumeTimer).toBe('function');
      expect(typeof plugin.timer.switchTimer).toBe('function');
      expect(typeof plugin.timer.getActiveLogs).toBe('function');

      expect(typeof plugin.metrics.getComputedMetrics).toBe('function');
      expect(typeof plugin.metrics.getTaskElapsed).toBe('function');
      expect(typeof plugin.metrics.getProjectElapsed).toBe('function');
      expect(typeof plugin.metrics.getElapsedRange).toBe('function');
      expect(typeof plugin.metrics.getRangeMetrics).toBe('function');
      expect(typeof plugin.metrics.getProjectStatistics).toBe('function');

      expect(typeof plugin.timeLogs.editTimeLog).toBe('function');

      expect(typeof plugin.validation.validateProjectName).toBe('function');
      expect(typeof plugin.validation.validateTaskName).toBe('function');
      expect(typeof plugin.validation.validateTaskHierarchy).toBe('function');
    });

    it('Given EngineCommands (Desktop Tauri Runtime), Then all segregated sub-engines must implement their contract', () => {
      const commands = new EngineCommands();

      expect(typeof commands.timer.startTimer).toBe('function');
      expect(typeof commands.timer.stopTimer).toBe('function');
      expect(typeof commands.timer.resumeTimer).toBe('function');
      expect(typeof commands.timer.switchTimer).toBe('function');
      expect(typeof commands.timer.getActiveLogs).toBe('function');

      expect(typeof commands.metrics.getComputedMetrics).toBe('function');
      expect(typeof commands.metrics.getTaskElapsed).toBe('function');
      expect(typeof commands.metrics.getProjectElapsed).toBe('function');
      expect(typeof commands.metrics.getElapsedRange).toBe('function');
      expect(typeof commands.metrics.getRangeMetrics).toBe('function');
      expect(typeof commands.metrics.getProjectStatistics).toBe('function');

      expect(typeof commands.timeLogs.editTimeLog).toBe('function');

      expect(typeof commands.validation.validateProjectName).toBe('function');
      expect(typeof commands.validation.validateTaskName).toBe('function');
      expect(typeof commands.validation.validateTaskHierarchy).toBe('function');
    });

    it('Given EngineCommands and EnginePlugin, When calling timer.getActiveLogs, Both must conform to the contract', async () => {
      mockInvoke.mockResolvedValue(['log-1']);
      const desktop = new EngineCommands();
      const desktopLogs = await desktop.timer.getActiveLogs();
      expect(desktopLogs).toEqual(['log-1']);

      setupLocalStorageMock();
      const persistence = new PersistencePlugin();
      PersistenceRouter.getInstance().setImplementationForTesting(persistence);

      const browser = new EnginePlugin();
      const browserLogs = await browser.timer.getActiveLogs();
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
      const elapsed = await engine.metrics.getTaskElapsed('task-1');
      expect(elapsed).toBe(5400);
    });

    it('Given identical seed state, When calculating project elapsed in Browser plugin, Then it matches expected duration', async () => {
      const engine = new EnginePlugin();
      const elapsed = await engine.metrics.getProjectElapsed('proj-1');
      expect(elapsed).toBe(5400);
    });

    it('Given filter range in Browser plugin, When calculating range elapsed, Then it matches overlap correctly', async () => {
      const engine = new EnginePlugin();
      const range = {
        from: '2026-06-15T10:30:00Z',
        to: '2026-06-15T11:15:00Z',
        projectId: 'proj-1',
      };
      const elapsed = await engine.metrics.getElapsedRange(range);
      expect(elapsed).toBe(2700);
    });
  });

  describe('Cross-Runtime Temporal Edge Cases (Leap Year & New Year Parity)', () => {
    beforeEach(async () => {
      setupLocalStorageMock();
      const persistence = new PersistencePlugin();
      PersistenceRouter.getInstance().setImplementationForTesting(persistence);
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('Given Leap Year boundary log across Feb 29, When calculating range elapsed on Feb 29, Then Browser and Desktop parity holds', async () => {
      const persistence = PersistenceRouter.getInstance();
      await persistence.core.overrideState({
        projects: [{ id: 'proj-leap', name: 'Leap Proj', color: 'blue', createdAt: '2024-02-01T00:00:00Z', archived: false }],
        tasks: [{ id: 'task-leap', projectId: 'proj-leap', name: 'Leap Task', createdAt: '2024-02-01T00:00:00Z', completed: false, status: 'Todo' }],
        logs: [
          {
            id: 'log-leap',
            projectId: 'proj-leap',
            taskId: 'task-leap',
            startTime: '2024-02-28T22:00:00Z',
            endTime: '2024-03-01T04:00:00Z',
          },
        ],
        activeLog: null,
      });

      const feb29Range = { from: '2024-02-29T00:00:00Z', to: '2024-03-01T00:00:00Z' };

      const browserEngine = new EnginePlugin();
      const browserElapsed = await browserEngine.metrics.getElapsedRange(feb29Range);

      const desktopEngine = new EngineCommands();
      mockInvoke.mockResolvedValue(86400);
      const desktopElapsed = await desktopEngine.metrics.getElapsedRange(feb29Range);

      expect(browserElapsed).toBe(86400);
      expect(desktopElapsed).toBe(86400);
      expect(browserElapsed).toBe(desktopElapsed);
      expect(mockInvoke).toHaveBeenCalledWith('get_elapsed_range', {
        range: feb29Range,
        nowIso: undefined,
      });
    });

    it('Given New Year boundary log across midnight, When calculating range elapsed on Jan 1, Then Browser and Desktop parity holds', async () => {
      const persistence = PersistenceRouter.getInstance();
      await persistence.core.overrideState({
        projects: [{ id: 'proj-ny', name: 'NY Proj', color: 'purple', createdAt: '2025-12-01T00:00:00Z', archived: false }],
        tasks: [{ id: 'task-ny', projectId: 'proj-ny', name: 'NY Task', createdAt: '2025-12-01T00:00:00Z', completed: false, status: 'Todo' }],
        logs: [
          {
            id: 'log-ny',
            projectId: 'proj-ny',
            taskId: 'task-ny',
            startTime: '2025-12-31T20:00:00Z',
            endTime: '2026-01-01T08:00:00Z',
          },
        ],
        activeLog: null,
      });

      const jan1Range = { from: '2026-01-01T00:00:00Z', to: '2026-01-02T00:00:00Z' };

      const browserEngine = new EnginePlugin();
      const browserElapsed = await browserEngine.metrics.getElapsedRange(jan1Range);

      const desktopEngine = new EngineCommands();
      mockInvoke.mockResolvedValue(28800);
      const desktopElapsed = await desktopEngine.metrics.getElapsedRange(jan1Range);

      expect(browserElapsed).toBe(28800);
      expect(desktopElapsed).toBe(28800);
      expect(browserElapsed).toBe(desktopElapsed);
      expect(mockInvoke).toHaveBeenCalledWith('get_elapsed_range', {
        range: jan1Range,
        nowIso: undefined,
      });
    });
  });

  describe('Cross-Runtime Validation Parity', () => {
    beforeEach(async () => {
      setupLocalStorageMock();
      const persistence = new PersistencePlugin();
      PersistenceRouter.getInstance().setImplementationForTesting(persistence);
      await persistence.core.reset();
      await persistence.projects.add({ name: 'Alpha', color: 'red' });
    });

    it('Given duplicate project name, When validateProjectName is called on both runtimes, Then both reject with EngineValidationError', async () => {
      const state = await PersistenceRouter.getInstance().core.load();
      const browserEngine = new EnginePlugin();
      const desktopEngine = new EngineCommands();

      await expect(
        browserEngine.validation.validateProjectName('ALPHA', state?.projects || [])
      ).rejects.toThrow(EngineValidationError);

      await expect(
        desktopEngine.validation.validateProjectName('ALPHA', state?.projects || [])
      ).rejects.toThrow(EngineValidationError);
    });

    it('Given empty task name, When validateTaskName is called on both runtimes, Then both reject with EngineValidationError', async () => {
      const browserEngine = new EnginePlugin();
      const desktopEngine = new EngineCommands();

      await expect(
        browserEngine.validation.validateTaskName('   ')
      ).rejects.toThrow('Task name cannot be empty');

      await expect(
        desktopEngine.validation.validateTaskName('   ')
      ).rejects.toThrow('Task name cannot be empty');
    });
  });

  describe('Given Cross-Runtime TimeLog Edit & Audit Parity', () => {
    beforeEach(async () => {
      setupLocalStorageMock();
      const persistence = new PersistencePlugin();
      PersistenceRouter.getInstance().setImplementationForTesting(persistence);
      await persistence.core.reset();
      await persistence.core.overrideState({
        projects: [aProject({ id: 'p1', name: 'P1', color: 'blue' })],
        tasks: [aTask({ id: 't1', projectId: 'p1', name: 'T1' })],
        logs: [
          aTimeLog({
            id: 'l1',
            projectId: 'p1',
            taskId: 't1',
            startTime: '2026-06-15T10:00:00Z',
            endTime: '2026-06-15T11:00:00Z',
            note: 'Original note',
          }),
        ],
        activeLog: null,
      });
    });

    describe('When executing manual edit without reason', () => {
      it('Then browser runtime rejects with ERR_AUDIT_REASON_REQUIRED', async () => {
        // Given
        const browserEngine = new EnginePlugin();

        // When & Then
        try {
          await browserEngine.timeLogs.editTimeLog('l1', 't1', '2026-06-15T10:00:00Z', '2026-06-15T11:30:00Z', null, null);
          expect.unreachable('Should have rejected');
        } catch (err) {
          // Then
          expect(err).toBeInstanceOf(EngineValidationError);
          expect((err as EngineValidationError).code).toBe('ERR_AUDIT_REASON_REQUIRED');
        }
      });
    });

    describe('When executing CliEdit without reason', () => {
      it('Then browser runtime rejects with ERR_AUDIT_REASON_REQUIRED', async () => {
        // Given
        const browserEngine = new EnginePlugin();

        // When & Then
        try {
          await browserEngine.timeLogs.editTimeLog(
            'l1',
            't1',
            '2026-06-15T10:00:00Z',
            '2026-06-15T11:30:00Z',
            null,
            null,
            'CliEdit'
          );
          expect.unreachable('Should have rejected');
        } catch (err) {
          // Then
          expect(err).toBeInstanceOf(EngineValidationError);
          expect((err as EngineValidationError).code).toBe('ERR_AUDIT_REASON_REQUIRED');
        }
      });
    });

    describe('When executing SystemPatch without reason', () => {
      it('Then browser runtime succeeds and persists canonical audit source', async () => {
        // Given
        const browserEngine = new EnginePlugin();

        // When
        await browserEngine.timeLogs.editTimeLog(
          'l1',
          't1',
          '2026-06-15T10:00:00Z',
          '2026-06-15T11:30:00Z',
          null,
          null,
          'SystemPatch'
        );

        // Then
        const state = await PersistenceRouter.getInstance().core.load();
        const updatedLog = state?.logs?.find((l) => l.id === 'l1');
        expect(updatedLog?.editHistory).toHaveLength(1);
        expect(updatedLog?.editHistory?.[0].auditSource).toBe('System Patch');
        expect(updatedLog?.editHistory?.[0].reason).toBeUndefined();
      });
    });

    describe('When executing with unknown audit source', () => {
      it('Then browser runtime rejects with ERR_AUDIT_SOURCE_INVALID', async () => {
        // Given
        const browserEngine = new EnginePlugin();

        // When & Then
        try {
          await browserEngine.timeLogs.editTimeLog(
            'l1',
            't1',
            '2026-06-15T10:00:00Z',
            '2026-06-15T11:30:00Z',
            null,
            'Valid reason',
            'UnknownSource'
          );
          expect.unreachable('Should have rejected');
        } catch (err) {
          // Then
          expect(err).toBeInstanceOf(EngineValidationError);
          expect((err as EngineValidationError).code).toBe('ERR_AUDIT_SOURCE_INVALID');
        }
      });
    });

    describe('When desktop commands editTimeLog is invoked', () => {
      it('Then it passes audit payload to Tauri invoke', async () => {
        // Given
        mockInvoke.mockResolvedValue(undefined);
        const desktopEngine = new EngineCommands();

        // When
        await desktopEngine.timeLogs.editTimeLog(
          'l1',
          't1',
          '2026-06-15T10:00:00Z',
          '2026-06-15T11:30:00Z',
          'Updated note',
          'Reason for edit'
        );

        // Then
        expect(mockInvoke).toHaveBeenCalledWith('edit_time_log', {
          id: 'l1',
          taskId: 't1',
          startTime: '2026-06-15T10:00:00Z',
          endTime: '2026-06-15T11:30:00Z',
          note: 'Updated note',
          reason: 'Reason for edit',
        });
      });
    });

    describe('When validating shared audit-parity-cases.json matrix in Browser Runtime', () => {
      auditParityCases.forEach((tc) => {
        it(`Then it should satisfy contract expectations for ${tc.id} (${tc.description})`, async () => {
          // Given
          const persistence = PersistenceRouter.getInstance();
          await persistence.core.overrideState({
            projects: [aProject({ id: 'p1', name: 'P1', color: 'blue' })],
            tasks: [aTask({ id: 't1', projectId: 'p1', name: 'T1' })],
            logs: [
              aTimeLog({
                id: 'l1',
                projectId: 'p1',
                taskId: 't1',
                startTime: '2026-06-15T10:00:00Z',
                endTime: '2026-06-15T11:00:00Z',
                note: 'Original note',
              }),
            ],
            activeLog: null,
          });
          const browserEngine = new EnginePlugin();

          if (tc.expectedSuccess) {
            // When
            await browserEngine.timeLogs.editTimeLog(
              'l1',
              't1',
              '2026-06-15T10:00:00Z',
              '2026-06-15T11:30:00Z',
              'Updated note',
              tc.reason,
              tc.auditSource
            );

            // Then
            const state = await persistence.core.load();
            const updated = state?.logs?.find((l) => l.id === 'l1');
            expect(updated?.editHistory).toBeDefined();
            const lastEntry = updated?.editHistory?.[updated.editHistory.length - 1];
            expect(lastEntry?.auditSource).toBe(tc.expectedAuditSource);
            if (tc.expectedReason !== null) {
              expect(lastEntry?.reason).toBe(tc.expectedReason);
            } else {
              expect(lastEntry?.reason).toBeUndefined();
            }
          } else {
            // When & Then
            try {
              await browserEngine.timeLogs.editTimeLog(
                'l1',
                't1',
                '2026-06-15T10:00:00Z',
                '2026-06-15T11:30:00Z',
                'Updated note',
                tc.reason,
                tc.auditSource
              );
              expect.unreachable(`Expected case ${tc.id} to throw but it succeeded`);
            } catch (err) {
              // Then
              expect(err).toBeInstanceOf(EngineValidationError);
              expect((err as EngineValidationError).code).toBe(tc.expectedErrorCode);
            }
          }
        });
      });
    });

    describe('When validating shared audit-parity-cases.json matrix in Desktop Tauri Runtime', () => {
      auditParityCases.forEach((tc) => {
        it(`Then it should invoke Tauri command and preserve error codes for ${tc.id}`, async () => {
          // Given
          const desktopEngine = new EngineCommands();
          mockInvoke.mockReset();

          if (tc.expectedSuccess) {
            mockInvoke.mockResolvedValueOnce(undefined);

            // When
            await desktopEngine.timeLogs.editTimeLog(
              'l1',
              't1',
              '2026-06-15T10:00:00Z',
              '2026-06-15T11:30:00Z',
              'Updated note',
              tc.reason,
              tc.auditSource
            );

            // Then
            expect(mockInvoke).toHaveBeenCalledWith('edit_time_log', {
              id: 'l1',
              taskId: 't1',
              startTime: '2026-06-15T10:00:00Z',
              endTime: '2026-06-15T11:30:00Z',
              note: 'Updated note',
              reason: tc.reason,
              ...(tc.auditSource ? { auditSource: tc.auditSource } : {}),
            });
          } else {
            mockInvoke.mockRejectedValueOnce({
              code: tc.expectedErrorCode,
              message: 'Validation failed in Rust backend',
            });

            // When & Then
            try {
              await desktopEngine.timeLogs.editTimeLog(
                'l1',
                't1',
                '2026-06-15T10:00:00Z',
                '2026-06-15T11:30:00Z',
                'Updated note',
                tc.reason,
                tc.auditSource
              );
              expect.unreachable(`Expected case ${tc.id} to throw but it succeeded`);
            } catch (err) {
              // Then
              expect((err as { code?: string })?.code).toBe(tc.expectedErrorCode);
            }
          }
        });
      });
    });
  });

});
