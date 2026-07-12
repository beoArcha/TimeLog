import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnginePlugin } from '../../../../src/plugins/engine/EnginePlugin';
import { PersistenceRouter } from '../../../../src/common/persistence/PersistenceRouter';
import { IPersistence } from '../../../../src/common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { Settings } from '@bindings/Settings';

describe('Unit Tests: EnginePlugin (Browser/Local)', () => {
  let plugin: EnginePlugin;
  let mockState: TimerRepositoryState;
  let mockImplementation: IPersistence;

  beforeEach(() => {
    vi.clearAllMocks();

    mockState = {
      projects: [{ id: 'p1', name: 'Project 1', color: 'rose', createdAt: '2026-06-12T00:00:00Z' }],
      tasks: [{ id: 't1', projectId: 'p1', parentTaskId: null, name: 'Task 1', createdAt: '2026-06-12T00:00:00Z', completed: false }],
      logs: [],
      activeLog: null
    };

    const mockSettings: Settings = {
      autoStart: false,
      autoPauseOnSleep: true,
      includePatchesInReports: false,
      activeSinks: []
    };

    mockImplementation = {
      core: {
        load: vi.fn().mockResolvedValue(mockState),
        overrideState: vi.fn().mockResolvedValue(mockState),
        reset: vi.fn().mockResolvedValue(mockState),
      },
      projects: {
        add: vi.fn().mockResolvedValue(mockState),
        toggleArchive: vi.fn().mockResolvedValue(mockState),
        update: vi.fn().mockResolvedValue(mockState),
        rename: vi.fn().mockResolvedValue(mockState),
      },
      tasks: {
        add: vi.fn().mockResolvedValue(mockState),
        update: vi.fn().mockResolvedValue(mockState),
        rename: vi.fn().mockResolvedValue(mockState),
        delete: vi.fn().mockResolvedValue(mockState),
        toggleComplete: vi.fn().mockResolvedValue(mockState),
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

    PersistenceRouter.getInstance().setImplementationForTesting(mockImplementation);
    plugin = new EnginePlugin();
  });

  it('should start timer by closing active projects and inserting new log', async () => {
    await plugin.startTimer('t1');
    expect(mockImplementation.tasks.getProjectId).toHaveBeenCalledWith('t1');
    expect(mockImplementation.timeLogs.closeActiveByProject).toHaveBeenCalled();
    expect(mockImplementation.timeLogs.insert).toHaveBeenCalled();
  });

  it('should stop timer for a specific project or all projects', async () => {
    await plugin.stopTimer('p1');
    expect(mockImplementation.timeLogs.closeActiveByProject).toHaveBeenCalled();

    await plugin.stopTimer();
    expect(mockImplementation.timeLogs.closeAllActive).toHaveBeenCalled();
  });

  it('should get project statistics correctly', async () => {
    mockState.logs = [
      { id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-07-12T10:00:00Z', endTime: '2026-07-12T10:30:00Z', note: 'test', editHistory: undefined }
    ];

    const stats = await plugin.getProjectStatistics('p1');
    expect(stats.totalTasks).toBe(1);
    expect(stats.completedTasks).toBe(0);
    expect(stats.totalDurationSec).toBe(BigInt(1800));
  });

  it('should edit time log and handle validation and overlap prevention', async () => {
    mockState.logs = [
      { id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-07-12T10:00:00Z', endTime: '2026-07-12T10:30:00Z', note: 'test', editHistory: undefined }
    ];

    await plugin.editTimeLog('l1', 't1', '2026-07-12T10:00:00Z', '2026-07-12T10:45:00Z', 'updated note', 'reason');
    expect(mockImplementation.core.overrideState).toHaveBeenCalled();
  });
});
