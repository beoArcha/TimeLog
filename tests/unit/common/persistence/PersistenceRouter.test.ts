import { describe, it, expect, vi } from 'vitest';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { IPersistence } from '@common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';

describe('Unit Tests: PersistenceRouter', () => {
  it('should delegate all calls to the active implementation', async () => {
    const mockState: TimerRepositoryState = {
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
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
      startTimer: vi.fn().mockResolvedValue({ state: mockState, events: [] }),
      stopTimer: vi.fn().mockResolvedValue({ state: mockState, events: [] }),
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

    await router.startTimer('t-id');
    expect(mockImplementation.startTimer).toHaveBeenCalledWith('t-id');

    await router.stopTimer('p-id');
    expect(mockImplementation.stopTimer).toHaveBeenCalledWith('p-id');

    await router.reset();
    expect(mockImplementation.reset).toHaveBeenCalled();
  });
});
