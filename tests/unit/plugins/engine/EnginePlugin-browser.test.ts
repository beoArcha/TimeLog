import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnginePlugin } from '@plugins/engine/EnginePlugin';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { IPersistence } from '@common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { Settings } from '@bindings/Settings';
import { TimeLog } from '@bindings/TimeLog';

describe('Unit Tests: EnginePlugin (Browser/Local)', () => {
  let plugin: EnginePlugin;
  let mockState: TimerRepositoryState;
  let mockImplementation: IPersistence;

  const buildMockImplementation = (state: TimerRepositoryState): IPersistence => {
    const mockSettings: Settings = {
      autoStart: false,
      autoPauseOnSleep: true,
      includePatchesInReports: false,
      activeSinks: [],
    };

    return {
      core: {
        load: vi.fn().mockResolvedValue(state),
        overrideState: vi.fn().mockResolvedValue(state),
        reset: vi.fn().mockResolvedValue(state),
      },
      projects: {
        add: vi.fn().mockResolvedValue(state),
        toggleArchive: vi.fn().mockResolvedValue(state),
        update: vi.fn().mockResolvedValue(state),
        rename: vi.fn().mockResolvedValue(state),
      },
      tasks: {
        add: vi.fn().mockResolvedValue(state),
        update: vi.fn().mockResolvedValue(state),
        rename: vi.fn().mockResolvedValue(state),
        delete: vi.fn().mockResolvedValue(state),
        toggleComplete: vi.fn().mockResolvedValue(state),
        getProjectId: vi.fn().mockResolvedValue('p1'),
        getSubtasks: vi.fn().mockResolvedValue([]),
      },
      settings: {
        get: vi.fn().mockResolvedValue(mockSettings),
        save: vi.fn().mockResolvedValue(undefined),
      },
      runtimeConfigs: {
        save: vi.fn().mockResolvedValue(undefined),
        getAll: vi.fn().mockResolvedValue([]),
      },
      timeLogs: {
        getForTask: vi.fn().mockResolvedValue([]),
        closeActiveByProject: vi.fn().mockResolvedValue(undefined),
        closeAllActive: vi.fn().mockResolvedValue(undefined),
        insert: vi.fn().mockResolvedValue(undefined),
        queryActive: vi.fn().mockResolvedValue([]),
        getAll: vi.fn().mockResolvedValue([]),
      },
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockState = {
      projects: [{ id: 'p1', name: 'Project 1', color: 'rose', createdAt: '2026-06-12T00:00:00Z' }],
      tasks: [{ id: 't1', projectId: 'p1', parentTaskId: null, name: 'Task 1', createdAt: '2026-06-12T00:00:00Z', completed: false }],
      logs: [],
      activeLog: null,
    };

    mockImplementation = buildMockImplementation(mockState);
    PersistenceRouter.getInstance().setImplementationForTesting(mockImplementation);
    plugin = new EnginePlugin();
  });

  describe('startTimer', () => {
    it('should close active project logs and insert new log', async () => {
      await plugin.startTimer('t1');
      expect(mockImplementation.tasks.getProjectId).toHaveBeenCalledWith('t1');
      expect(mockImplementation.timeLogs.closeActiveByProject).toHaveBeenCalled();
      expect(mockImplementation.timeLogs.insert).toHaveBeenCalled();
    });
  });

  describe('stopTimer', () => {
    it('should close logs for specific project when projectId provided', async () => {
      await plugin.stopTimer('p1');
      expect(mockImplementation.timeLogs.closeActiveByProject).toHaveBeenCalled();
      expect(mockImplementation.timeLogs.closeAllActive).not.toHaveBeenCalled();
    });

    it('should close all active logs when no projectId provided', async () => {
      await plugin.stopTimer();
      expect(mockImplementation.timeLogs.closeAllActive).toHaveBeenCalled();
    });
  });

  describe('getProjectStatistics', () => {
    it('Given null state, Then it should return zero statistics', async () => {
      vi.mocked(mockImplementation.core.load).mockResolvedValue(null);

      const stats = await plugin.getProjectStatistics('p1');
      expect(stats.totalTasks).toBe(0);
      expect(stats.completedTasks).toBe(0);
      expect(stats.totalDurationSec).toBe(BigInt(0));
    });

    it('Given project with tasks and logs, Then it should compute statistics correctly', async () => {
      mockState.logs = [
        { id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-07-12T10:00:00Z', endTime: '2026-07-12T10:30:00Z', note: 'test', editHistory: undefined },
      ];

      const stats = await plugin.getProjectStatistics('p1');
      expect(stats.totalTasks).toBe(1);
      expect(stats.completedTasks).toBe(0);
      expect(stats.totalDurationSec).toBe(BigInt(1800));
    });

    it('Given project with completed tasks, Then it should count them correctly', async () => {
      mockState.tasks.push({ id: 't2', projectId: 'p1', parentTaskId: null, name: 'Task 2', createdAt: '2026-06-12T00:00:00Z', completed: true });
      mockState.logs = [];

      const stats = await plugin.getProjectStatistics('p1');
      expect(stats.totalTasks).toBe(2);
      expect(stats.completedTasks).toBe(1);
    });

    it('Given project with no tasks, Then it should return zero statistics', async () => {
      const stats = await plugin.getProjectStatistics('p-nonexistent');
      expect(stats.totalTasks).toBe(0);
      expect(stats.completedTasks).toBe(0);
      expect(stats.totalDurationSec).toBe(BigInt(0));
    });

    it('Given active log without endTime, Then it should use current time for duration', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T10:01:00Z'));

      mockState.logs = [
        { id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-07-12T10:00:00Z', endTime: undefined, note: undefined, editHistory: undefined },
      ];

      const stats = await plugin.getProjectStatistics('p1');
      expect(stats.totalDurationSec).toBe(BigInt(60));

      vi.useRealTimers();
    });
  });

  describe('editTimeLog', () => {
    it('Given state is null, Then it should throw Error', async () => {
      vi.mocked(mockImplementation.core.load).mockResolvedValue(null);

      await expect(plugin.editTimeLog('l1', 't1', '2026-07-12T10:00:00Z', '2026-07-12T10:30:00Z', null, null))
        .rejects.toThrow('Database state not initialized');
    });

    it('Given log id not found, Then it should throw EntityNotFoundException', async () => {
      mockState.logs = [];

      await expect(plugin.editTimeLog('non-existing', 't1', '2026-07-12T10:00:00Z', '2026-07-12T10:30:00Z', null, null))
        .rejects.toThrow('Time log non-existing not found');
    });

    it('Given invalid startTime format, Then it should throw parse error', async () => {
      mockState.logs = [
        { id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-07-12T10:00:00Z', endTime: '2026-07-12T10:30:00Z', note: undefined, editHistory: undefined },
      ];

      await expect(plugin.editTimeLog('l1', 't1', 'not-a-date', '2026-07-12T10:30:00Z', null, null))
        .rejects.toThrow('Parse time error: start_time is invalid');
    });

    it('Given invalid endTime format, Then it should throw parse error', async () => {
      mockState.logs = [
        { id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-07-12T10:00:00Z', endTime: '2026-07-12T10:30:00Z', note: undefined, editHistory: undefined },
      ];

      await expect(plugin.editTimeLog('l1', 't1', '2026-07-12T10:00:00Z', 'bad-date', null, null))
        .rejects.toThrow('Parse time error: end_time is invalid');
    });

    it('Given endTime before startTime, Then it should throw', async () => {
      mockState.logs = [
        { id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-07-12T10:00:00Z', endTime: '2026-07-12T10:30:00Z', note: undefined, editHistory: undefined },
      ];

      await expect(plugin.editTimeLog('l1', 't1', '2026-07-12T10:30:00Z', '2026-07-12T10:00:00Z', null, null))
        .rejects.toThrow('End time cannot be before start time');
    });

    it('Given startTime in the future, Then it should throw', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T09:00:00Z'));

      mockState.logs = [
        { id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-07-12T10:00:00Z', endTime: '2026-07-12T10:30:00Z', note: undefined, editHistory: undefined },
      ];

      await expect(plugin.editTimeLog('l1', 't1', '2026-07-12T10:00:00Z', '2026-07-12T10:30:00Z', null, null))
        .rejects.toThrow('Start time cannot be in the future');

      vi.useRealTimers();
    });

    it('Given overlapping time with another log, Then it should throw overlap error', async () => {
      const existingLog: TimeLog = {
        id: 'l2',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-12T10:15:00Z',
        endTime: '2026-07-12T10:45:00Z',
        note: undefined,
        editHistory: undefined,
      };
      mockState.logs = [
        { id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-07-12T09:00:00Z', endTime: '2026-07-12T09:30:00Z', note: undefined, editHistory: undefined },
        existingLog,
      ];

      await expect(plugin.editTimeLog('l1', 't1', '2026-07-12T10:00:00Z', '2026-07-12T10:30:00Z', null, null))
        .rejects.toThrow('Time log overlaps with an existing log');
    });

    it('Given valid edit, Then it should call overrideState and preserve editHistory', async () => {
      mockState.logs = [
        { id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-07-12T10:00:00Z', endTime: '2026-07-12T10:30:00Z', note: 'original note', editHistory: undefined },
      ];

      await plugin.editTimeLog('l1', 't1', '2026-07-12T10:00:00Z', '2026-07-12T10:45:00Z', 'updated note', 'time correction');
      expect(mockImplementation.core.overrideState).toHaveBeenCalled();

      const callArg = vi.mocked(mockImplementation.core.overrideState).mock.calls[0][0] as TimerRepositoryState;
      const updatedLog = callArg.logs.find((l: TimeLog) => l.id === 'l1')!;
      expect(updatedLog.note).toBe('updated note');
      expect(updatedLog.editHistory).toHaveLength(1);
      expect(updatedLog.editHistory![0].prevNote).toBe('original note');
    });

    it('Given edited log is the activeLog, Then it should also update activeLog in state', async () => {
      const log: TimeLog = {
        id: 'l1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-12T10:00:00Z',
        endTime: '2026-07-12T10:30:00Z',
        note: undefined,
        editHistory: undefined,
      };
      mockState.logs = [log];
      mockState.activeLog = log;

      await plugin.editTimeLog('l1', 't1', '2026-07-12T10:00:00Z', '2026-07-12T10:45:00Z', null, null);
      expect(mockImplementation.core.overrideState).toHaveBeenCalled();

      const callArg = vi.mocked(mockImplementation.core.overrideState).mock.calls[0][0] as TimerRepositoryState;
      expect(callArg.activeLog).not.toBeNull();
      expect(callArg.activeLog!.endTime).toBe('2026-07-12T10:45:00Z');
    });
  });
});
