// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupLocalStorageMock } from '@tests/shared/mocks/browser-mocks';
import { mockInvoke } from '@tests/shared/mocks/tauri-ipc-mock';
import { EngineRouter } from '@common/engine/EngineRouter';
import { EngineCommands } from '@common/engine/EngineCommands';
import { EnginePlugin } from '@plugins/engine/EnginePlugin';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';

describe('Integration Tests: EngineRouter with EngineCommands and EnginePlugin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('EngineCommands Delegation (Tauri Runtime)', () => {
    beforeEach(() => {
      EngineRouter.getInstance().setImplementationForTesting(new EngineCommands());
    });

    it('Given EngineRouter with EngineCommands, When startTimer is called, Then it should invoke start_timer command', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await EngineRouter.getInstance().startTimer('task-1');
      expect(mockInvoke).toHaveBeenCalledWith('start_timer', { taskId: 'task-1' });
    });

    it('Given EngineRouter with EngineCommands, When stopTimer is called, Then it should invoke stop_timer command', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await EngineRouter.getInstance().stopTimer('proj-1');
      expect(mockInvoke).toHaveBeenCalledWith('stop_timer', { projectId: 'proj-1' });
    });

    it('Given EngineRouter with EngineCommands, When editTimeLog is called, Then it should invoke edit_time_log command', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await EngineRouter.getInstance().editTimeLog('log-1', 'task-1', '2026-06-15T12:00:00Z', '2026-06-15T13:00:00Z', 'Note', 'Reason');
      expect(mockInvoke).toHaveBeenCalledWith('edit_time_log', {
        id: 'log-1',
        taskId: 'task-1',
        startTime: '2026-06-15T12:00:00Z',
        endTime: '2026-06-15T13:00:00Z',
        note: 'Note',
        reason: 'Reason',
      });
    });

    it('Given EngineRouter with EngineCommands, When getProjectStatistics is called, Then it should invoke get_project_statistics command', async () => {
      const stats = { totalDurationSec: BigInt(3600), totalTasks: 5, completedTasks: 2 };
      mockInvoke.mockResolvedValue(stats);

      const result = await EngineRouter.getInstance().getProjectStatistics('proj-1');
      expect(mockInvoke).toHaveBeenCalledWith('get_project_statistics', { projectId: 'proj-1' });
      expect(result).toEqual(stats);
    });
  });

  describe('EnginePlugin Delegation (Browser Runtime)', () => {
    beforeEach(() => {
      setupLocalStorageMock();
      PersistenceRouter.getInstance().setImplementationForTesting(new PersistencePlugin());
      EngineRouter.getInstance().setImplementationForTesting(new EnginePlugin());
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('Given initialized project and tasks, When startTimer is called, Then it should start the active timer log', async () => {
      const persistence = PersistenceRouter.getInstance();
      const engine = EngineRouter.getInstance();

      await persistence.projects.add({ name: 'Web Dev', color: 'blue' });
      const state = await persistence.core.load();
      const projId = state.projects[0].id;

      await persistence.tasks.add({ projectId: projId, name: 'Setup Tests', parentTaskId: null });
      const state2 = await persistence.core.load();
      const taskId = state2.tasks[0].id;

      await engine.startTimer(taskId);

      const activeLogs = await persistence.timeLogs.queryActive();
      expect(activeLogs).toEqual([taskId]);
    });

    it('Given running timer, When stopTimer is called, Then it should stop the active timer log', async () => {
      const persistence = PersistenceRouter.getInstance();
      const engine = EngineRouter.getInstance();

      await persistence.projects.add({ name: 'Web Dev', color: 'blue' });
      const state = await persistence.core.load();
      const projId = state.projects[0].id;
      await persistence.tasks.add({ projectId: projId, name: 'Setup Tests', parentTaskId: null });
      const state2 = await persistence.core.load();
      const taskId = state2.tasks[0].id;

      await engine.startTimer(taskId);
      expect(await persistence.timeLogs.queryActive()).toHaveLength(1);

      await engine.stopTimer();
      expect(await persistence.timeLogs.queryActive()).toHaveLength(0);
    });

    it('Given existing logs, When editTimeLog is called with valid data, Then it should update the log and editHistory', async () => {
      const persistence = PersistenceRouter.getInstance();
      const engine = EngineRouter.getInstance();

      await persistence.projects.add({ name: 'Proj', color: 'red' });
      const state = await persistence.core.load();
      const projId = state.projects[0].id;

      await persistence.tasks.add({ projectId: projId, name: 'Task', parentTaskId: null });
      const state2 = await persistence.core.load();
      const taskId = state2.tasks[0].id;

      await persistence.timeLogs.insert('log-10', taskId, '2026-06-15T12:00:00Z');

      await engine.editTimeLog('log-10', taskId, '2026-06-15T12:30:00Z', '2026-06-15T13:30:00Z', 'Task Note', 'Needed correction');

      const logs = await persistence.timeLogs.getAll();
      const editedLog = logs.find(l => l.id === 'log-10');
      expect(editedLog).toBeDefined();
      expect(editedLog?.startTime).toBe('2026-06-15T12:30:00Z');
      expect(editedLog?.endTime).toBe('2026-06-15T13:30:00Z');
      expect(editedLog?.note).toBe('Task Note');
      expect(editedLog?.editHistory).toHaveLength(1);
      expect(editedLog?.editHistory?.[0].reason).toBe('Needed correction');
    });

    it('Given overlapping log times, When editTimeLog is called, Then it should throw overlaps error', async () => {
      const persistence = PersistenceRouter.getInstance();
      const engine = EngineRouter.getInstance();

      await persistence.projects.add({ name: 'Proj', color: 'red' });
      const state = await persistence.core.load();
      const projId = state.projects[0].id;

      await persistence.tasks.add({ projectId: projId, name: 'Task', parentTaskId: null });
      const state2 = await persistence.core.load();
      const taskId = state2.tasks[0].id;

      await persistence.timeLogs.insert('log-first', taskId, '2026-06-15T12:00:00Z');
      await persistence.timeLogs.closeAllActive('2026-06-15T13:00:00Z');

      await persistence.timeLogs.insert('log-second', taskId, '2026-06-15T14:00:00Z');
      await persistence.timeLogs.closeAllActive('2026-06-15T15:00:00Z');

      await expect(
        engine.editTimeLog('log-second', taskId, '2026-06-15T12:30:00Z', '2026-06-15T14:30:00Z', null, null)
      ).rejects.toThrow(/overlaps with an existing log/);
    });

    it('Given logs with valid intervals, When getProjectStatistics is called, Then it should aggregate task stats correctly', async () => {
      const persistence = PersistenceRouter.getInstance();
      const engine = EngineRouter.getInstance();

      await persistence.projects.add({ name: 'Stats Proj', color: 'green' });
      const state = await persistence.core.load();
      const projId = state.projects[0].id;

      await persistence.tasks.add({ projectId: projId, name: 'T1', parentTaskId: null });
      await persistence.tasks.add({ projectId: projId, name: 'T2', parentTaskId: null });
      const state2 = await persistence.core.load();
      const t1Id = state2.tasks[0].id;
      const t2Id = state2.tasks[1].id;

      await persistence.tasks.toggleComplete(t1Id);

      await persistence.timeLogs.insert('log-s1', t1Id, '2026-06-15T12:00:00Z');
      await persistence.timeLogs.closeAllActive('2026-06-15T12:30:00Z');

      await persistence.timeLogs.insert('log-s2', t2Id, '2026-06-15T13:00:00Z');
      await persistence.timeLogs.closeAllActive('2026-06-15T13:45:00Z');

      const stats = await engine.getProjectStatistics(projId);
      expect(stats.totalTasks).toBe(2);
      expect(stats.completedTasks).toBe(1);
      expect(stats.totalDurationSec).toBe(BigInt(4500));
    });
  });
});
