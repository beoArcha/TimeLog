import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';

import { PersistenceCommands } from '@common/persistence/PersistenceCommands';

describe('Integration Tests: PersistenceRouter & PersistenceCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    PersistenceRouter.getInstance().setImplementationForTesting(
      new PersistenceCommands()
    );
  });

  it('should flow load call from Router to mock Tauri and return correct state', async () => {
    const mockState: TimerRepositoryState = {
      projects: [{ id: 'p1', name: 'Integration Project', color: '#ff0000', archived: false, createdAt: '2026' }],
      tasks: [{ id: 't1', projectId: 'p1', name: 'Integration Task', completed: false, createdAt: '2026' }],
      logs: [],
      activeLog: null,
    };

    mockInvoke.mockResolvedValue(mockState);

    const router = PersistenceRouter.getInstance();
    const result = await router.core.load();

    expect(mockInvoke).toHaveBeenCalledWith('get_state');
    expect(result).toEqual(mockState);
  });

  it('should flow addProject from Router to mock Tauri and propagate correct args', async () => {
    const mockState: TimerRepositoryState = {
      projects: [{ id: 'p1', name: 'New Project', color: '#00ff00', archived: false, createdAt: '2026' }],
      tasks: [],
      logs: [],
      activeLog: null,
    };

    mockInvoke.mockResolvedValue(mockState);

    const router = PersistenceRouter.getInstance();
    const result = await router.projects.add({ name: 'New Project', color: '#00ff00' });

    expect(mockInvoke).toHaveBeenCalledWith('add', {
      name: 'New Project',
      color: '#00ff00',
      description: null,
      icon: null,
      tags: null,
    });
    expect(result).toEqual(mockState);
  });
});
