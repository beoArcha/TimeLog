import { describe, it, expect, vi } from 'vitest';
import { EngineRouter } from '@common/engine/EngineRouter';
import { IEngine } from '@common/engine/IEngine';
import { EngineException } from '@common/exceptions';

describe('Unit Tests: EngineRouter', () => {
  it('should delegate all calls to the active implementation', async () => {
    const mockImplementation: IEngine = {
      startTimer: vi.fn().mockResolvedValue(undefined),
      stopTimer: vi.fn().mockResolvedValue(undefined),
      resumeTimer: vi.fn().mockResolvedValue(undefined),
      getActiveLogs: vi.fn().mockResolvedValue(['log-1']),
      getTaskElapsed: vi.fn().mockResolvedValue(100),
      getProjectElapsed: vi.fn().mockResolvedValue(200),
      getElapsedRange: vi.fn().mockResolvedValue(300),
      editTimeLog: vi.fn().mockResolvedValue(undefined),
      getProjectStatistics: vi.fn().mockResolvedValue({ totalDurationSec: BigInt(0), totalTasks: 0, completedTasks: 0 }),
      addProject: vi.fn().mockResolvedValue({ projects: [], tasks: [], logs: [], activeLog: null }),
      addTask: vi.fn().mockResolvedValue({ projects: [], tasks: [], logs: [], activeLog: null }),
      getSettings: vi.fn().mockResolvedValue({ soundAlerts: false, timeRounding: 0, launchAtStartup: false, dynamicTheme: false }),
      resetState: vi.fn().mockResolvedValue({ projects: [], tasks: [], logs: [], activeLog: null }),
    };

    const router = EngineRouter.getInstance();
    router.setImplementationForTesting(mockImplementation);

    await router.startTimer('task-123');
    expect(mockImplementation.startTimer).toHaveBeenCalledWith('task-123');

    await router.stopTimer('project-456');
    expect(mockImplementation.stopTimer).toHaveBeenCalledWith('project-456');

    await router.resumeTimer('task-123');
    expect(mockImplementation.resumeTimer).toHaveBeenCalledWith('task-123');

    const activeLogs = await router.getActiveLogs();
    expect(activeLogs).toEqual(['log-1']);

    const taskElapsed = await router.getTaskElapsed('task-123');
    expect(taskElapsed).toBe(100);

    await router.editTimeLog('id-1', 'task-1', 'start', 'end', 'note', 'reason');
    expect(mockImplementation.editTimeLog).toHaveBeenCalledWith('id-1', 'task-1', 'start', 'end', 'note', 'reason');

    await router.getProjectStatistics('project-456');
    expect(mockImplementation.getProjectStatistics).toHaveBeenCalledWith('project-456');

    await router.addProject({ name: 'P', color: '#fff' });
    expect(mockImplementation.addProject).toHaveBeenCalledWith({ name: 'P', color: '#fff' });

    await router.addTask({ projectId: 'p1', name: 'T' });
    expect(mockImplementation.addTask).toHaveBeenCalledWith({ projectId: 'p1', name: 'T' });

    await router.getSettings();
    expect(mockImplementation.getSettings).toHaveBeenCalled();

    await router.resetState();
    expect(mockImplementation.resetState).toHaveBeenCalled();
  });

  it('should throw EngineException when an optional operation is not supported by implementation', async () => {
    const minimalImpl: IEngine = {
      startTimer: vi.fn().mockResolvedValue(undefined),
      stopTimer: vi.fn().mockResolvedValue(undefined),
      editTimeLog: vi.fn().mockResolvedValue(undefined),
      getProjectStatistics: vi.fn().mockResolvedValue({ totalDurationSec: BigInt(0), totalTasks: 0, completedTasks: 0 }),
    };

    const router = EngineRouter.getInstance();
    router.setImplementationForTesting(minimalImpl);

    await expect(router.addProject({ name: 'P', color: '#f00' })).rejects.toThrow(EngineException);
    await expect(router.addTask({ projectId: 'p1', name: 'T' })).rejects.toThrow(EngineException);
    await expect(router.getSettings()).rejects.toThrow(EngineException);
    await expect(router.resetState()).rejects.toThrow(EngineException);
  });
});
