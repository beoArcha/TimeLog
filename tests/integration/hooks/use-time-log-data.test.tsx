import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { setupLocalStorageMock } from '@tests/shared/test-helpers';
import { useTimeLogData } from '@common/hooks/useTimeLogData';
import { TEST_CONSTANTS } from '@tests/shared/test-constants';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PersistencePlugin } from '../../../src/plugins/persistence/PersistencePlugin';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
const LOCAL_STORAGE_KEY = 'timelog_persistence_plugin_state';

describe('Integration Tests: useTimeLogData Storage Lifecycle', () => {
  const pushToApi = vi.fn();
  const originalLocation = window.location;

  beforeAll(() => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      reload: vi.fn(),
    } as any;
  });

  afterAll(() => {
    (window as any).location = originalLocation;
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    setupLocalStorageMock();
    PersistenceRouter.getInstance().setImplementationForTesting(new PersistencePlugin());
  });

  const renderTimeLog = async () => {
    const rendered = renderHook(() => useTimeLogData(pushToApi));
    await waitFor(() => expect(rendered.result.current.isInitialized).toBe(true));
    return rendered;
  };

  it('Given empty storage, When application starts, Then default state is created', async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    const { result } = await renderTimeLog();

    expect(result.current.projects).toHaveLength(3);
    expect(result.current.tasks).toHaveLength(7);
    expect(result.current.logs).toHaveLength(3);
    expect(result.current.isInitialized).toBe(true);

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!).projects).toHaveLength(3);
  });

  it('Given existing projects, When application starts, Then state is restored', async () => {
    const existingState = {
      projects: [{ id: 'p_custom', name: 'My Custom Project', color: 'teal', createdAt: '2026-06-20', archived: false }],
      tasks: [{ id: 't_custom', projectId: 'p_custom', parentTaskId: null, name: 'My Custom Task', createdAt: '2026-06-20', completed: false }],
      logs: [],
      activeLog: null,
      holidays: [],
      patches: []
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingState));

    const { result } = await renderTimeLog();

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].name).toBe('My Custom Project');
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.isInitialized).toBe(true);
  });

  it('Given corrupted storage, When application starts, Then fallback state is created', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, '{corrupted-json-data...');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { result } = await renderTimeLog();

    expect(result.current.projects).toHaveLength(0);
    expect(result.current.isInitialized).toBe(true);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('Given active timer, When application reloads, Then timer is restored', async () => {
    const activeTimeLog = { id: 'log_active', taskId: '102', projectId: '1', startTime: '2026-06-20T12:00:00Z', endTime: null };
    const existingState = {
      projects: [{ id: '1', name: 'Proj 1', color: 'violet', createdAt: '2026-06-20' }],
      tasks: [{ id: '102', projectId: '1', parentTaskId: null, name: 'Task 2', createdAt: '2026-06-20', completed: false }],
      logs: [activeTimeLog],
      activeLog: activeTimeLog,
      holidays: [],
      patches: []
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingState));

    const { result } = await renderTimeLog();

    expect(result.current.activeLog).not.toBeNull();
    expect(result.current.activeLog?.id).toBe('log_active');
    expect(result.current.activeLog?.endTime).toBeNull();
  });

  it('Given default state, When handleAddProject is called, Then project state updates and persists to storage', async () => {
    const { result } = await renderTimeLog();
    const initialCount = result.current.projects.length;

    await act(async () => {
      await result.current.handleAddProject('Brand New Project', 'rose');
    });

    expect(result.current.projects).toHaveLength(initialCount + 1);
    const addedProj = result.current.projects.find(p => p.name === 'Brand New Project');
    expect(addedProj).toBeDefined();
    expect(addedProj?.color).toBe('rose');

    const saved: TimerRepositoryState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!);
    expect(saved.projects).toHaveLength(initialCount + 1);
    expect(saved.projects.some(p => p.name === 'Brand New Project')).toBe(true);
  });

  it('Given active project, When handleToggleProjectArchive is called, Then project archived flag updates and persists to storage', async () => {
    const { result } = await renderTimeLog();
    const projectId = TEST_CONSTANTS.PROJECT_ID_1;
    const initialArchived = result.current.projects.find(p => p.id === projectId)?.archived ?? false;

    await act(async () => {
      await result.current.handleToggleProjectArchive(projectId);
    });

    expect(result.current.projects.find(p => p.id === projectId)?.archived).toBe(!initialArchived);

    const saved: TimerRepositoryState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!);
    expect(saved.projects.find(p => p.id === projectId)?.archived).toBe(!initialArchived);
  });

  it('Given active project, When handleAddTask is called, Then task updates and persists to storage', async () => {
    const { result } = await renderTimeLog();
    const initialCount = result.current.tasks.length;

    await act(async () => {
      await result.current.handleAddTask(TEST_CONSTANTS.PROJECT_ID_1, 'Integration Subtask', TEST_CONSTANTS.TASK_ID_101);
    });

    expect(result.current.tasks).toHaveLength(initialCount + 1);
    const addedTask = result.current.tasks.find(t => t.name === 'Integration Subtask');
    expect(addedTask).toBeDefined();
    expect(addedTask?.parentTaskId).toBe(TEST_CONSTANTS.TASK_ID_101);

    const saved: TimerRepositoryState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!);
    expect(saved.tasks).toHaveLength(initialCount + 1);
    expect(saved.tasks.some(t => t.name === 'Integration Subtask')).toBe(true);
  });

  it('Given active project and task, When handleRenameProject and handleRenameTask are called, Then state and storage update', async () => {
    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleRenameProject(TEST_CONSTANTS.PROJECT_ID_1, 'Super Backend');
      await result.current.handleRenameTask(TEST_CONSTANTS.TASK_ID_101, 'Super Schema Setup');
    });

    expect(result.current.projects.find(p => p.id === TEST_CONSTANTS.PROJECT_ID_1)?.name).toBe('Super Backend');
    expect(result.current.tasks.find(t => t.id === TEST_CONSTANTS.TASK_ID_101)?.name).toBe('Super Schema Setup');

    const saved: TimerRepositoryState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!);
    expect(saved.projects.find(p => p.id === TEST_CONSTANTS.PROJECT_ID_1)?.name).toBe('Super Backend');
    expect(saved.tasks.find(t => t.id === TEST_CONSTANTS.TASK_ID_101)?.name).toBe('Super Schema Setup');
  });

  it('Given task with nested task and logs, When handleDeleteTask is called, Then task, nested tasks, and associated logs are deleted and persist', async () => {
    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleDeleteTask(TEST_CONSTANTS.TASK_ID_102);
    });

    expect(result.current.tasks.find(t => t.id === TEST_CONSTANTS.TASK_ID_102)).toBeUndefined();
    expect(result.current.tasks.find(t => t.id === TEST_CONSTANTS.TASK_ID_1021)).toBeUndefined();

    expect(result.current.logs.some(l => l.taskId === TEST_CONSTANTS.TASK_ID_102 || l.taskId === TEST_CONSTANTS.TASK_ID_1021)).toBe(false);

    const saved: TimerRepositoryState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!);
    expect(saved.tasks.find(t => t.id === TEST_CONSTANTS.TASK_ID_102)).toBeUndefined();
    expect(saved.logs.some(l => l.taskId === TEST_CONSTANTS.TASK_ID_102)).toBe(false);
  });

  it('Given active timer on a task, When handleToggleTaskComplete is called, Then completed flag changes and active log on that task terminates', async () => {
    const activeTimeLog = { id: 'log_active', taskId: TEST_CONSTANTS.TASK_ID_102, projectId: TEST_CONSTANTS.PROJECT_ID_1, startTime: '2026-06-20T12:00:00Z', endTime: null };
    const existingState = {
      projects: [{ id: TEST_CONSTANTS.PROJECT_ID_1, name: 'Proj 1', color: 'violet', createdAt: '2026-06-20' }],
      tasks: [{ id: TEST_CONSTANTS.TASK_ID_102, projectId: TEST_CONSTANTS.PROJECT_ID_1, parentTaskId: null, name: 'Task 2', createdAt: '2026-06-20', completed: false }],
      logs: [activeTimeLog],
      activeLog: activeTimeLog,
      holidays: [],
      patches: []
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingState));

    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleToggleTaskComplete(TEST_CONSTANTS.TASK_ID_102);
    });

    expect(result.current.tasks[0].completed).toBe(true);
    expect(result.current.activeLog).toBeNull();
    expect(result.current.logs[0].endTime).not.toBeNull();

    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!);
    expect(saved.tasks[0].completed).toBe(true);
    expect(saved.activeLog).toBeNull();
    expect(saved.logs[0].endTime).not.toBeNull();
  });

  it('Given default state, When handleStartTimer is called, Then new active log is created and pushToApi is triggered', async () => {
    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_102);
    });

    expect(result.current.activeLog).not.toBeNull();
    expect(result.current.activeLog?.taskId).toBe(TEST_CONSTANTS.TASK_ID_102);
    expect(result.current.activeLog?.endTime).toBeNull();

    expect(pushToApi).toHaveBeenCalledTimes(1);
    expect(pushToApi.mock.calls[0][0]).toMatchObject({
      event: 'START',
      log: {
        taskId: TEST_CONSTANTS.TASK_ID_102,
        endTime: null,
      }
    });

    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!);
    expect(saved.activeLog).not.toBeNull();
    expect(saved.activeLog.taskId).toBe(TEST_CONSTANTS.TASK_ID_102);
  });

  it('Given child task and mother task not running, When handleStartTimer is called on child, Then mother task is automatically started', async () => {
    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_1021);
    });

    expect(result.current.activeLog?.taskId).toBe(TEST_CONSTANTS.TASK_ID_1021);
    const runningLogs = result.current.logs.filter(l => l.endTime === null);
    expect(runningLogs).toHaveLength(2);
    expect(runningLogs.some(l => l.taskId === TEST_CONSTANTS.TASK_ID_102)).toBe(true);
    expect(runningLogs.some(l => l.taskId === TEST_CONSTANTS.TASK_ID_1021)).toBe(true);

    expect(pushToApi).toHaveBeenCalledTimes(2);
  });

  it('Given child task and mother task already running, When handleStartTimer is called on child, Then mother task is NOT started again', async () => {
    const activeMotherLog = { id: 'log_mother', taskId: TEST_CONSTANTS.TASK_ID_102, projectId: TEST_CONSTANTS.PROJECT_ID_1, startTime: '2026-06-20T12:00:00Z', endTime: null };
    const existingState = {
      projects: [{ id: TEST_CONSTANTS.PROJECT_ID_1, name: 'Proj 1', color: 'violet', createdAt: '2026-06-20' }],
      tasks: [
        { id: TEST_CONSTANTS.TASK_ID_102, projectId: TEST_CONSTANTS.PROJECT_ID_1, parentTaskId: null, name: 'Task 2', createdAt: '2026-06-20', completed: false },
        { id: TEST_CONSTANTS.TASK_ID_1021, projectId: TEST_CONSTANTS.PROJECT_ID_1, parentTaskId: TEST_CONSTANTS.TASK_ID_102, name: 'Task 2.1', createdAt: '2026-06-20', completed: false }
      ],
      logs: [activeMotherLog],
      activeLog: activeMotherLog,
      holidays: [],
      patches: []
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingState));

    const { result } = await renderTimeLog();
    expect(result.current.logs.filter(l => l.endTime === null)).toHaveLength(1);

    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_1021);
    });

    const runningLogs = result.current.logs.filter(l => l.endTime === null);
    expect(runningLogs).toHaveLength(2);
    expect(pushToApi).toHaveBeenCalledTimes(1);
  });

  it('Given running task timer, When handleStartTimer is called, Then it terminates the timer', async () => {
    const activeTimeLog = { id: 'log_active', taskId: TEST_CONSTANTS.TASK_ID_102, projectId: TEST_CONSTANTS.PROJECT_ID_1, startTime: '2026-06-20T12:00:00Z', endTime: null };
    const existingState = {
      projects: [{ id: TEST_CONSTANTS.PROJECT_ID_1, name: 'Proj 1', color: 'violet', createdAt: '2026-06-20' }],
      tasks: [{ id: TEST_CONSTANTS.TASK_ID_102, projectId: TEST_CONSTANTS.PROJECT_ID_1, parentTaskId: null, name: 'Task 2', createdAt: '2026-06-20', completed: false }],
      logs: [activeTimeLog],
      activeLog: activeTimeLog,
      holidays: [],
      patches: []
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingState));

    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_102);
    });

    expect(result.current.activeLog).toBeNull();
    expect(result.current.logs[0].endTime).not.toBeNull();
    expect(pushToApi).toHaveBeenCalledTimes(1);
    expect(pushToApi.mock.calls[0][0].event).toBe('TERMINATE');
  });

  it('Given running task timer, When handleStopTimer is called, Then active log is closed and pushToApi is triggered', async () => {
    const activeTimeLog = { id: 'log_active', taskId: TEST_CONSTANTS.TASK_ID_102, projectId: TEST_CONSTANTS.PROJECT_ID_1, startTime: '2026-06-20T12:00:00Z', endTime: null };
    const existingState = {
      projects: [{ id: TEST_CONSTANTS.PROJECT_ID_1, name: 'Proj 1', color: 'violet', createdAt: '2026-06-20' }],
      tasks: [{ id: TEST_CONSTANTS.TASK_ID_102, projectId: TEST_CONSTANTS.PROJECT_ID_1, parentTaskId: null, name: 'Task 2', createdAt: '2026-06-20', completed: false }],
      logs: [activeTimeLog],
      activeLog: activeTimeLog,
      holidays: [],
      patches: []
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingState));

    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStopTimer();
    });

    expect(result.current.activeLog).toBeNull();
    expect(result.current.logs[0].endTime).not.toBeNull();
    expect(pushToApi).toHaveBeenCalledTimes(1);
    expect(pushToApi.mock.calls[0][0].event).toBe('TERMINATE');
  });

  it('Given running timers in different projects, When handleStopTimer is called with specific projectId, Then only matching project timers stop', async () => {
    const log1 = { id: 'log_1', taskId: '101', projectId: '1', startTime: '2026-06-20T12:00:00Z', endTime: null };
    const log2 = { id: 'log_2', taskId: '201', projectId: '2', startTime: '2026-06-20T12:05:00Z', endTime: null };
    const existingState = {
      projects: [
        { id: '1', name: 'Proj 1', color: 'violet', createdAt: '2026-06-20' },
        { id: '2', name: 'Proj 2', color: 'rose', createdAt: '2026-06-20' }
      ],
      tasks: [
        { id: '101', projectId: '1', parentTaskId: null, name: 'Task 1', createdAt: '2026-06-20', completed: false },
        { id: '201', projectId: '2', parentTaskId: null, name: 'Task 2', createdAt: '2026-06-20', completed: false }
      ],
      logs: [log1, log2],
      activeLog: log2,
      holidays: [],
      patches: []
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingState));

    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStopTimer('1');
    });

    expect(result.current.logs.find(l => l.id === 'log_1')?.endTime).not.toBeNull();
    expect(result.current.logs.find(l => l.id === 'log_2')?.endTime).toBeNull();
    expect(result.current.activeLog).not.toBeNull();
  });

  it('Given default state, When handleStartTimer is called with non-existent taskId, Then nothing changes', async () => {
    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStartTimer('invalid-task-id-999');
    });

    expect(result.current.activeLog).toBeNull();
    expect(pushToApi).not.toHaveBeenCalled();
  });

  it('Given running task timer, When handleDeleteTask is called on that task, Then activeLog becomes null', async () => {
    const activeTimeLog = { id: 'log_active', taskId: TEST_CONSTANTS.TASK_ID_102, projectId: TEST_CONSTANTS.PROJECT_ID_1, startTime: '2026-06-20T12:00:00Z', endTime: null };
    const existingState = {
      projects: [{ id: TEST_CONSTANTS.PROJECT_ID_1, name: 'Proj 1', color: 'violet', createdAt: '2026-06-20' }],
      tasks: [{ id: TEST_CONSTANTS.TASK_ID_102, projectId: TEST_CONSTANTS.PROJECT_ID_1, parentTaskId: null, name: 'Task 2', createdAt: '2026-06-20', completed: false }],
      logs: [activeTimeLog],
      activeLog: activeTimeLog,
      holidays: [],
      patches: []
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingState));

    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleDeleteTask(TEST_CONSTANTS.TASK_ID_102);
    });

    expect(result.current.activeLog).toBeNull();
    expect(result.current.logs).toHaveLength(0);
  });

  it('Given no running timers, When handleStopTimer is called, Then nothing changes and API is not triggered', async () => {
    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStopTimer();
    });

    expect(result.current.activeLog).toBeNull();
    expect(pushToApi).not.toHaveBeenCalled();
  });

  it('Given state in localStorage, When handleResetLocalStorage is called, Then localStorage is cleared and window reloads', async () => {
    const { result } = await renderTimeLog();
    localStorage.setItem(LOCAL_STORAGE_KEY, 'some-state');

    await act(async () => {
      await result.current.handleResetLocalStorage();
    });

    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBeNull();
    expect(window.location.reload).toHaveBeenCalled();
  });
});
