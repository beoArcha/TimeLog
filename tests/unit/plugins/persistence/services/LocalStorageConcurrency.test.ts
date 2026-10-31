import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageStateStore } from '@plugins/persistence/services/LocalStorageStateStore';
import { LocalStorageProjectsPersistence, ValidationException } from '@plugins/persistence/services/LocalStorageProjectsPersistence';
import { LocalStorageTasksPersistence } from '@plugins/persistence/services/LocalStorageTasksPersistence';
import { LocalStorageTimeLogsPersistence } from '@plugins/persistence/services/LocalStorageTimeLogsPersistence';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';

describe('LocalStorage Concurrency & Mutation Serialization', () => {
  let store: LocalStorageStateStore;
  let projects: LocalStorageProjectsPersistence;
  let tasks: LocalStorageTasksPersistence;
  let timeLogs: LocalStorageTimeLogsPersistence;

  beforeEach(() => {
    localStorage.clear();
    store = new LocalStorageStateStore();
    projects = new LocalStorageProjectsPersistence(store);
    tasks = new LocalStorageTasksPersistence(store);
    timeLogs = new LocalStorageTimeLogsPersistence(store);
  });

  it('prevents project deletion when timer session start and project delete are executed concurrently', async () => {
    // Arrange: Create a project and task
    const proj = aProject({ id: 'proj-concurrent-1', name: 'Concurrent Test' });
    const task = aTask({ id: 'task-concurrent-1', projectId: 'proj-concurrent-1', name: 'Task 1' });
    await store.save({
      projects: [proj],
      tasks: [task],
      logs: [],
      activeLog: null,
    });

    // Act: Fire timer start and project delete simultaneously
    const now = new Date().toISOString();
    const [timerResult, deleteResult] = await Promise.allSettled([
      timeLogs.startTimerSession('task-concurrent-1', now, 'log-concurrent-1'),
      projects.delete('proj-concurrent-1'),
    ]);

    const finalState = await store.load();

    // Assert: Either timer started first and delete was rejected, or delete happened first and timer threw task not found
    if (timerResult.status === 'fulfilled') {
      // Timer won the mutex: delete MUST have failed because the project now has active timer / time log
      expect(deleteResult.status).toBe('rejected');
      expect((deleteResult as PromiseRejectedResult).reason).toBeInstanceOf(ValidationException);
      expect(finalState?.projects.some((p) => p.id === 'proj-concurrent-1')).toBe(true);
      expect(finalState?.logs).toHaveLength(1);
      expect(finalState?.activeLog?.id).toBe('log-concurrent-1');
    } else {
      // Delete won the mutex: timer MUST have failed because task was deleted
      expect(deleteResult.status).toBe('fulfilled');
      expect(finalState?.projects.some((p) => p.id === 'proj-concurrent-1')).toBe(false);
      expect(finalState?.tasks.some((t) => t.id === 'task-concurrent-1')).toBe(false);
    }
  });

  it('maintains state consistency when task creation and project deletion run concurrently', async () => {
    // Arrange: Create a project
    const proj = aProject({ id: 'proj-race-1', name: 'Race Project' });
    await store.save({
      projects: [proj],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    // Act: Concurrently add task and delete project
    const [addResult, deleteResult] = await Promise.allSettled([
      tasks.add({ projectId: 'proj-race-1', name: 'New Task', parentTaskId: null }),
      projects.delete('proj-race-1'),
    ]);

    const finalState = await store.load();

    // Assert: State must never be half-mutated or corrupted
    if (addResult.status === 'fulfilled' && deleteResult.status === 'fulfilled') {
      // If add finished before delete, delete cascade-deleted the task as well
      // Or if delete ran first, project was deleted
      expect(finalState?.projects.some((p) => p.id === 'proj-race-1')).toBe(false);
    }

    expect(Array.isArray(finalState?.projects)).toBe(true);
    expect(Array.isArray(finalState?.tasks)).toBe(true);
    expect(Array.isArray(finalState?.logs)).toBe(true);
  });

  it('serializes high-concurrency parallel writes without losing updates', async () => {
    // Arrange: Start with clean storage
    await store.load();

    // Act: Dispatch 10 project additions in parallel
    const operations = Array.from({ length: 10 }, (_, i) =>
      projects.add({
        name: `Parallel Project ${i}`,
        color: 'rose',
      })
    );

    await Promise.all(operations);

    // Assert: Exactly 10 projects must exist - no lost writes due to race conditions
    const finalState = await store.load();
    expect(finalState?.projects).toHaveLength(10);
    const names = finalState?.projects.map((p) => p.name).sort();
    expect(names).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      expect(names).toContain(`Parallel Project ${i}`);
    }
  });

  it('deterministically queues reset() behind in-flight mutations preventing resurrection', async () => {
    // Arrange: Create helper barrier
    const onEnter = (() => {
      let resolve!: () => void;
      const promise = new Promise<void>((r) => {
        resolve = r;
      });
      return { promise, resolve };
    })();

    const barrier = (() => {
      let resolve!: () => void;
      const promise = new Promise<void>((r) => {
        resolve = r;
      });
      return { promise, resolve };
    })();

    let mutationCompleted = false;
    let resetCompleted = false;

    // Act 1: Start a slow in-flight mutation that pauses inside its mutator
    const slowMutation = store.mutate(async (state) => {
      onEnter.resolve();
      await barrier.promise;
      state.projects.push(aProject({ id: 'proj-resurrect', name: 'Should Be Wiped' }));
      mutationCompleted = true;
    });

    // Wait until mutation is in-flight and holds the exclusive lock
    await onEnter.promise;

    // Act 2: Dispatch reset while mutation is actively in-flight
    const resetOperation = store.reset('BUSINESS').then((result) => {
      resetCompleted = true;
      return result;
    });

    // Assert intermediary state: neither operation has finished
    expect(mutationCompleted).toBe(false);
    expect(resetCompleted).toBe(false);

    // Act 3: Release the in-flight mutation so it commits to storage first
    barrier.resolve();
    await slowMutation;
    expect(mutationCompleted).toBe(true);

    // Wait for queued reset to execute after the mutation
    await resetOperation;
    expect(resetCompleted).toBe(true);

    // Assert: Storage must be empty because reset ran strictly after the mutation committed
    const finalState = await store.load();
    expect(finalState?.projects).toHaveLength(0);
    expect(finalState?.projects.some((p) => p.id === 'proj-resurrect')).toBe(false);
  });

  it('deterministically rejects project deletion when delete is queued behind in-flight timer start', async () => {
    // Arrange: Pre-populate project and task
    const proj = aProject({ id: 'proj-guarded', name: 'Guarded Project' });
    const task = aTask({ id: 'task-guarded', projectId: 'proj-guarded', name: 'Guarded Task' });
    await store.save({
      projects: [proj],
      tasks: [task],
      logs: [],
      activeLog: null,
    });

    const onEnter = (() => {
      let resolve!: () => void;
      const promise = new Promise<void>((r) => {
        resolve = r;
      });
      return { promise, resolve };
    })();

    const timerBarrier = (() => {
      let resolve!: () => void;
      const promise = new Promise<void>((r) => {
        resolve = r;
      });
      return { promise, resolve };
    })();

    let timerInFlightStarted = false;

    // Act 1: Start an operation that begins tracking time and halts before committing
    const startTimerOp = store.mutate(async (state) => {
      timerInFlightStarted = true;
      onEnter.resolve();
      await timerBarrier.promise;
      state.logs.push({
        id: 'log-guarded-1',
        taskId: 'task-guarded',
        projectId: 'proj-guarded',
        startTime: new Date().toISOString(),
        endTime: undefined,
        note: undefined,
        editHistory: undefined,
      });
      state.activeLog = state.logs[0];
    });

    // Wait until the mutator has actually entered execution and is paused
    await onEnter.promise;
    expect(timerInFlightStarted).toBe(true);

    // Act 2: Attempt delete while timer start is in-flight and holds the lock
    const deleteOp = projects.delete('proj-guarded');

    // Act 3: Complete timer start
    timerBarrier.resolve();
    await startTimerOp;

    // Assert: Delete must fail because timer start committed first
    await expect(deleteOp).rejects.toThrow(ValidationException);

    // Project and log must be intact in storage
    const state = await store.load();
    expect(state?.projects.some((p) => p.id === 'proj-guarded')).toBe(true);
    expect(state?.logs).toHaveLength(1);
  });
});
