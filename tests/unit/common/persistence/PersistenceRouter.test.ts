import { describe, it, expect, vi } from 'vitest';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { IPersistence } from '@common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { Settings } from '@bindings/Settings';

describe('Unit Tests: PersistenceRouter', () => {
  it('should delegate all calls to the active implementation', async () => {
    const mockState: TimerRepositoryState = {
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    };

    const mockSettings: Settings = {
      autoStart: false,
      autoPauseOnSleep: true,
      includePatchesInReports: true,
      activeSinks: ['Csv'],
    };

    const mockImplementation: IPersistence = {
      load: vi.fn().mockResolvedValue(mockState),
      overrideState: vi.fn().mockResolvedValue(mockState),
      addProject: vi.fn().mockResolvedValue(mockState),
      toggleProjectArchive: vi.fn().mockResolvedValue(mockState),
      addTask: vi.fn().mockResolvedValue(mockState),
      renameProject: vi.fn().mockResolvedValue(mockState),
      renameTask: vi.fn().mockResolvedValue(mockState),
      deleteTask: vi.fn().mockResolvedValue(mockState),
      toggleTaskComplete: vi.fn().mockResolvedValue(mockState),
      getSettings: vi.fn().mockResolvedValue(mockSettings),
      saveSettings: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn().mockResolvedValue(mockState),
    };

    const router = PersistenceRouter.getInstance();
    router.setImplementationForTesting(mockImplementation);

    await router.load();
    expect(mockImplementation.load).toHaveBeenCalled();

    await router.overrideState({});
    expect(mockImplementation.overrideState).toHaveBeenCalledWith({});

    await router.addProject({ name: 'P', color: 'c' });
    expect(mockImplementation.addProject).toHaveBeenCalledWith({ name: 'P', color: 'c' });

    await router.toggleProjectArchive('p-id');
    expect(mockImplementation.toggleProjectArchive).toHaveBeenCalledWith('p-id');

    await router.addTask({ projectId: 'p-id', name: 'T', parentTaskId: null });
    expect(mockImplementation.addTask).toHaveBeenCalledWith({ projectId: 'p-id', name: 'T', parentTaskId: null });

    await router.renameProject('p-id', 'new-name');
    expect(mockImplementation.renameProject).toHaveBeenCalledWith('p-id', 'new-name');

    await router.renameTask('t-id', 'new-name');
    expect(mockImplementation.renameTask).toHaveBeenCalledWith('t-id', 'new-name');

    await router.deleteTask('t-id');
    expect(mockImplementation.deleteTask).toHaveBeenCalledWith('t-id');

    await router.toggleTaskComplete('t-id');
    expect(mockImplementation.toggleTaskComplete).toHaveBeenCalledWith('t-id');

    await router.getSettings();
    expect(mockImplementation.getSettings).toHaveBeenCalled();

    await router.saveSettings(mockSettings);
    expect(mockImplementation.saveSettings).toHaveBeenCalledWith(mockSettings);

    await router.reset();
    expect(mockImplementation.reset).toHaveBeenCalled();
  });
});
