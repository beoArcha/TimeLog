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
      core: {
        load: vi.fn().mockResolvedValue(mockState),
        overrideState: vi.fn().mockResolvedValue(mockState),
        reset: vi.fn().mockResolvedValue(mockState),
      },
      projects: {
        add: vi.fn().mockResolvedValue(mockState),
        toggleArchive: vi.fn().mockResolvedValue(mockState),
        rename: vi.fn().mockResolvedValue(mockState),
      },
      tasks: {
        add: vi.fn().mockResolvedValue(mockState),
        rename: vi.fn().mockResolvedValue(mockState),
        delete: vi.fn().mockResolvedValue(mockState),
        toggleComplete: vi.fn().mockResolvedValue(mockState),
      },
      settings: {
        get: vi.fn().mockResolvedValue(mockSettings),
        save: vi.fn().mockResolvedValue(undefined),
      }
    };

    const router = PersistenceRouter.getInstance();
    router.setImplementationForTesting(mockImplementation);

    await router.core.load();
    expect(mockImplementation.core.load).toHaveBeenCalled();

    await router.core.overrideState({});
    expect(mockImplementation.core.overrideState).toHaveBeenCalledWith({});

    await router.projects.add({ name: 'P', color: 'c' });
    expect(mockImplementation.projects.add).toHaveBeenCalledWith({ name: 'P', color: 'c' });

    await router.projects.toggleArchive('p-id');
    expect(mockImplementation.projects.toggleArchive).toHaveBeenCalledWith('p-id');

    await router.tasks.add({ projectId: 'p-id', name: 'T', parentTaskId: null });
    expect(mockImplementation.tasks.add).toHaveBeenCalledWith({ projectId: 'p-id', name: 'T', parentTaskId: null });

    await router.projects.rename('p-id', 'new-name');
    expect(mockImplementation.projects.rename).toHaveBeenCalledWith('p-id', 'new-name');

    await router.tasks.rename('t-id', 'new-name');
    expect(mockImplementation.tasks.rename).toHaveBeenCalledWith('t-id', 'new-name');

    await router.tasks.delete('t-id');
    expect(mockImplementation.tasks.delete).toHaveBeenCalledWith('t-id');

    await router.tasks.toggleComplete('t-id');
    expect(mockImplementation.tasks.toggleComplete).toHaveBeenCalledWith('t-id');

    await router.settings.get();
    expect(mockImplementation.settings.get).toHaveBeenCalled();

    await router.settings.save(mockSettings);
    expect(mockImplementation.settings.save).toHaveBeenCalledWith(mockSettings);

    await router.core.reset();
    expect(mockImplementation.core.reset).toHaveBeenCalled();
  });
});
