// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupLocalStorageMock } from '@tests/shared/mocks/browser-mocks';
import { useTimeLogData } from '@common/hooks/useTimeLogData';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ErrorHandler } from '@common/exceptions';

describe('Integration Tests: useTimeLogData Error Recovery & Persistence Failures', () => {
  const mockPushToApi = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    setupLocalStorageMock();
  });

  it('Given repository load fails, When useTimeLogData initializes, Then it sets repositoryError and handles exception', async () => {
    const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');

    const router = PersistenceRouter.getInstance();
    vi.spyOn(router.core, 'load').mockRejectedValue(new Error('DB connection lost'));

    const { result } = renderHook(() => useTimeLogData(mockPushToApi));

    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    expect(result.current.repositoryError).toBe('DB connection lost');
    expect(errorHandlerSpy).toHaveBeenCalled();
  });

  it('Given project addition fails, When handleAddProject is called, Then it sets repositoryError and preserves state', async () => {
    const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');
    const router = PersistenceRouter.getInstance();

    vi.spyOn(router.core, 'load').mockResolvedValue({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null
    });

    // Mock project add failure
    vi.spyOn(router.projects, 'add').mockRejectedValue(new Error('Storage quota exceeded'));

    const { result } = renderHook(() => useTimeLogData(mockPushToApi));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    await act(async () => {
      await result.current.handleAddProject('Test Project', 'red');
    });

    expect(result.current.repositoryError).toBe('Storage quota exceeded');
    expect(result.current.projects).toHaveLength(0);
    expect(errorHandlerSpy).toHaveBeenCalled();
  });

  it('Given task rename fails, When handleRenameTask is called, Then it captures error and does not update state', async () => {
    const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');
    const router = PersistenceRouter.getInstance();

    const initialTasks = [{ id: 't1', projectId: 'p1', name: 'Original Name', completed: false, createdAt: '2026' }];
    vi.spyOn(router.core, 'load').mockResolvedValue({
      projects: [],
      tasks: initialTasks,
      logs: [],
      activeLog: null
    });

    vi.spyOn(router.tasks, 'rename').mockRejectedValue(new Error('Database locked'));

    const { result } = renderHook(() => useTimeLogData(mockPushToApi));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    await act(async () => {
      await result.current.handleRenameTask('t1', 'New Name');
    });

    expect(result.current.repositoryError).toBe('Database locked');
    expect(result.current.tasks[0].name).toBe('Original Name');
    expect(errorHandlerSpy).toHaveBeenCalled();
  });
});
