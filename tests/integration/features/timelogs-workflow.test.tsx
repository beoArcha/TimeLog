// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TimerDisplay from '@features/timelogs/components/TimerDisplay';
import { BrowserTimeLogsEngine } from '@plugins/engine/services/BrowserTimeLogsEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import { setupLocalStorageMock } from '@tests/shared/test-helpers';
import { EngineValidationException } from '@common/exceptions/AppExceptions';

describe('Given TimeLogs and TimerDisplay integration workflow', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setupLocalStorageMock();
    PersistenceRouter.resetForTesting();
    PersistenceRouter.getInstance().setImplementationForTesting(new PersistencePlugin());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('When TimerDisplay is rendered with duration in seconds', () => {
    it('Then it formats seconds into HH:MM:SS with tabular monospace layout', () => {
      // Given
      const elapsedSeconds = 3665; // 01:01:05

      // When
      render(<TimerDisplay value={elapsedSeconds} isRunning={true} variant="pill" />);

      // Then
      expect(screen.getByText('01:01:05')).toBeDefined();
    });
  });

  describe('When a time log is edited with valid non-overlapping times', () => {
    it('Then it persists updated log and records editHistory audit entry', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const project = aProject({ id: 'p1' });
      const task = aTask({ id: 't1', projectId: 'p1' });
      const log = aTimeLog({
        id: 'l1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: '2026-06-15T11:00:00Z',
        note: 'Original note',
      });

      await router.core.overrideState({
        projects: [project],
        tasks: [task],
        logs: [log],
        activeLog: null,
      });

      const engine = new BrowserTimeLogsEngine(router);

      // When
      await engine.editTimeLog(
        'l1',
        't1',
        '2026-06-15T10:30:00Z',
        '2026-06-15T11:30:00Z',
        'Updated note content',
        'Changed meeting time'
      );

      // Then
      const updatedState = await router.core.load();
      const updatedLog = updatedState?.logs.find((l) => l.id === 'l1');

      expect(updatedLog?.startTime).toBe('2026-06-15T10:30:00Z');
      expect(updatedLog?.note).toBe('Updated note content');
      expect(updatedLog?.editHistory).toHaveLength(1);
      expect(updatedLog?.editHistory?.[0].reason).toBe('Changed meeting time');
    });
  });

  describe('When a time log edit causes an overlap with an existing log', () => {
    it('Then it should reject modification with typed EngineValidationException', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const project = aProject({ id: 'p1' });
      const task = aTask({ id: 't1', projectId: 'p1' });
      const log1 = aTimeLog({
        id: 'l1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: '2026-06-15T11:00:00Z',
      });
      const log2 = aTimeLog({
        id: 'l2',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-06-15T12:00:00Z',
        endTime: '2026-06-15T13:00:00Z',
      });

      await router.core.overrideState({
        projects: [project],
        tasks: [task],
        logs: [log1, log2],
        activeLog: null,
      });

      const engine = new BrowserTimeLogsEngine(router);

      // When & Then
      await expect(
        engine.editTimeLog(
          'l2',
          't1',
          '2026-06-15T10:30:00Z', // Overlaps with l1 (10:00 - 11:00)
          '2026-06-15T12:30:00Z',
          null,
          'Test overlap'
        )
      ).rejects.toThrow(EngineValidationException);
    });
  });
});
