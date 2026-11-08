import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserTimeLogsEngine } from '@plugins/engine/services/BrowserTimeLogsEngine';
import { TauriTimeLogsEngine } from '@common/engine/commands/TauriTimeLogsEngine';
import { validateTimeLog } from '@plugins/engine/validation';
import { ENGINE_ERROR_CODES, isEngineErrorCode } from '@common/engine/errorCodes';
import { EngineValidationError } from '@common/exceptions';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { invoke } from '@tauri-apps/api/core';
import { aTask, aTimeLog } from '../../shared/builders/entity-builders';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('Engine Error Codes Parity (Browser & Tauri/Rust Engines)', () => {
  let routerMock: PersistenceRouter;
  let browserEngine: BrowserTimeLogsEngine;
  let tauriEngine: TauriTimeLogsEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    routerMock = {
      core: {
        load: vi.fn(),
        overrideState: vi.fn().mockResolvedValue({}),
      },
    } as unknown as PersistenceRouter;
    browserEngine = new BrowserTimeLogsEngine(routerMock);
    tauriEngine = new TauriTimeLogsEngine();
  });

  describe('ENGINE_ERROR_CODES constants and typeguard', () => {
    it('should expose consistent canonical error code strings', () => {
      expect(ENGINE_ERROR_CODES.AUDIT_REASON_REQUIRED).toBe('ERR_AUDIT_REASON_REQUIRED');
      expect(ENGINE_ERROR_CODES.AUDIT_SOURCE_INVALID).toBe('ERR_AUDIT_SOURCE_INVALID');
      expect(ENGINE_ERROR_CODES.TIMELOG_INVALID_RANGE).toBe('ERR_TIMELOG_INVALID_RANGE');
    });

    it('should validate codes using isEngineErrorCode', () => {
      expect(isEngineErrorCode('ERR_AUDIT_REASON_REQUIRED')).toBe(true);
      expect(isEngineErrorCode('ERR_AUDIT_SOURCE_INVALID')).toBe(true);
      expect(isEngineErrorCode('ERR_TIMELOG_INVALID_RANGE')).toBe(true);
      expect(isEngineErrorCode('ERR_SOME_OTHER_ERROR')).toBe(false);
      expect(isEngineErrorCode(undefined)).toBe(false);
      expect(isEngineErrorCode(123)).toBe(false);
    });
  });

  describe('BrowserTimeLogsEngine parity with Rust error codes', () => {
    const originalLog = aTimeLog({
      id: 'log-1',
      taskId: 'task-1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
      note: 'Note',
      editHistory: null,
    });

    it('should emit ERR_AUDIT_REASON_REQUIRED when reason is missing', async () => {
      vi.mocked(routerMock.core.load).mockResolvedValueOnce({
        projects: [],
        tasks: [aTask({ id: 'task-1' })],
        logs: [originalLog],
        activeLog: null,
      });

      try {
        await browserEngine.editTimeLog('log-1', 'task-1', '2026-06-15T10:00:00Z', '2026-06-15T11:00:00Z', null, null);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(EngineValidationError);
        expect((err as EngineValidationError).code).toBe('ERR_AUDIT_REASON_REQUIRED');
      }
    });

    it('should emit ERR_AUDIT_REASON_REQUIRED when reason is whitespace-only', async () => {
      vi.mocked(routerMock.core.load).mockResolvedValueOnce({
        projects: [],
        tasks: [aTask({ id: 'task-1' })],
        logs: [originalLog],
        activeLog: null,
      });

      try {
        await browserEngine.editTimeLog('log-1', 'task-1', '2026-06-15T10:00:00Z', '2026-06-15T11:00:00Z', null, '   ');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(EngineValidationError);
        expect((err as EngineValidationError).code).toBe('ERR_AUDIT_REASON_REQUIRED');
      }
    });

    it('should emit ERR_AUDIT_SOURCE_INVALID when audit source is unknown', async () => {
      vi.mocked(routerMock.core.load).mockResolvedValueOnce({
        projects: [],
        tasks: [aTask({ id: 'task-1' })],
        logs: [originalLog],
        activeLog: null,
      });

      try {
        await browserEngine.editTimeLog(
          'log-1',
          'task-1',
          '2026-06-15T10:00:00Z',
          '2026-06-15T11:00:00Z',
          null,
          'Valid reason',
          'UnknownSource'
        );
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(EngineValidationError);
        expect((err as EngineValidationError).code).toBe('ERR_AUDIT_SOURCE_INVALID');
      }
    });

    it('should emit ERR_TIMELOG_INVALID_RANGE when end is before start in editTimeLog', async () => {
      vi.mocked(routerMock.core.load).mockResolvedValueOnce({
        projects: [],
        tasks: [aTask({ id: 'task-1' })],
        logs: [originalLog],
        activeLog: null,
      });

      try {
        await browserEngine.editTimeLog(
          'log-1',
          'task-1',
          '2026-06-15T12:00:00Z',
          '2026-06-15T10:00:00Z',
          null,
          'Valid reason'
        );
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(EngineValidationError);
        expect((err as EngineValidationError).code).toBe('ERR_TIMELOG_INVALID_RANGE');
      }
    });

    it('should emit ERR_TIMELOG_INVALID_RANGE directly from validateTimeLog', () => {
      try {
        validateTimeLog('log-1', '2026-06-15T12:00:00Z', '2026-06-15T10:00:00Z', []);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(EngineValidationError);
        expect((err as EngineValidationError).code).toBe('ERR_TIMELOG_INVALID_RANGE');
      }
    });
  });

  describe('TauriTimeLogsEngine parity with Rust IPC payload error codes', () => {
    it('should preserve ERR_AUDIT_REASON_REQUIRED from Rust IPC', async () => {
      vi.mocked(invoke).mockRejectedValueOnce({
        code: 'ERR_AUDIT_REASON_REQUIRED',
        message: 'Audit reason is required for manual edits',
      });

      try {
        await tauriEngine.editTimeLog('log-1', 'task-1', '2026-06-15T10:00:00Z', null, null, null);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as { code: string }).code).toBe('ERR_AUDIT_REASON_REQUIRED');
      }
    });

    it('should preserve ERR_AUDIT_SOURCE_INVALID from Rust IPC', async () => {
      vi.mocked(invoke).mockRejectedValueOnce({
        code: 'ERR_AUDIT_SOURCE_INVALID',
        message: "Invalid audit source: 'BadSource'",
        details: 'BadSource',
      });

      try {
        await tauriEngine.editTimeLog('log-1', 'task-1', '2026-06-15T10:00:00Z', null, null, 'Reason', 'BadSource');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as { code: string }).code).toBe('ERR_AUDIT_SOURCE_INVALID');
      }
    });

    it('should preserve ERR_TIMELOG_INVALID_RANGE from Rust IPC', async () => {
      vi.mocked(invoke).mockRejectedValueOnce({
        code: 'ERR_TIMELOG_INVALID_RANGE',
        message: 'End time cannot be before start time',
      });

      try {
        await tauriEngine.editTimeLog('log-1', 'task-1', '2026-06-15T12:00:00Z', '2026-06-15T10:00:00Z', null, 'Reason');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect((err as { code: string }).code).toBe('ERR_TIMELOG_INVALID_RANGE');
      }
    });
  });
});
