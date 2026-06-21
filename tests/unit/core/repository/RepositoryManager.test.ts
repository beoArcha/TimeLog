import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RepositoryManager } from '../../../../src/core/repository/RepositoryManager';
import { TimerRepository, TimerRepositoryState } from '../../../../src/core/repository/RepositoryTypes';

describe('Unit Tests: RepositoryManager delegation', () => {
  let mockRepo: TimerRepository;
  let manager: RepositoryManager;

  beforeEach(() => {
    mockRepo = {
      load: vi.fn(),
      overrideState: vi.fn(),
      addProject: vi.fn(),
      toggleProjectArchive: vi.fn(),
      addTask: vi.fn(),
      renameProject: vi.fn(),
      renameTask: vi.fn(),
      deleteTask: vi.fn(),
      toggleTaskComplete: vi.fn(),
      startTimer: vi.fn(),
      stopTimer: vi.fn(),
      reset: vi.fn(),
    };
    manager = RepositoryManager.getInstance();
    manager.setBackend(mockRepo);
  });

  afterEach(() => {
    manager.restoreDefaultBackend();
  });

  it('should delegate load calls to active repository', async () => {
    await manager.load();
    expect(mockRepo.load).toHaveBeenCalled();
  });

  it('should delegate overrideState calls to active repository', async () => {
    const mockState: Partial<TimerRepositoryState> = { projects: [] };
    await manager.overrideState(mockState);
    expect(mockRepo.overrideState).toHaveBeenCalledWith(mockState);
  });

  it('should delegate addProject calls to active repository', async () => {
    const input = { name: 'P1', color: 'red' };
    await manager.addProject(input);
    expect(mockRepo.addProject).toHaveBeenCalledWith(input);
  });

  it('should delegate addTask calls to active repository', async () => {
    const input = { projectId: 'p1', name: 't1', parentTaskId: null };
    await manager.addTask(input);
    expect(mockRepo.addTask).toHaveBeenCalledWith(input);
  });

  it('should delegate startTimer and stopTimer calls to active repository', async () => {
    await manager.startTimer('t1');
    expect(mockRepo.startTimer).toHaveBeenCalledWith('t1');

    await manager.stopTimer('p1');
    expect(mockRepo.stopTimer).toHaveBeenCalledWith('p1');
  });
});
