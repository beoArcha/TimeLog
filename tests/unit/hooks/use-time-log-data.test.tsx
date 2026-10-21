import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { setupLocalStorageMock, saveMockDbState, setupWindowLocationMock } from '@tests/shared/test-helpers';
import { useTimeLogData } from '@common/hooks/useTimeLogData';
import { STORAGE_KEYS } from '@common/constants';
import { TEST_CONSTANTS } from '@tests/shared/test-constants';
import { INIT_PROJECTS, INIT_TASKS, INIT_LOGS } from '@plugins/persistence/InitialData';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';

const LOCAL_STORAGE_KEY = STORAGE_KEYS.STATE_DB;

describe('Unit Tests: useTimeLogData Hook', () => {
  const pushToApi = vi.fn();
  let locationMock: ReturnType<typeof setupWindowLocationMock>;

  beforeAll(() => {
    locationMock = setupWindowLocationMock();
  });

  afterAll(() => {
    locationMock.restore();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    PersistenceRouter.resetForTesting();
    setupLocalStorageMock();
    saveMockDbState({
      projects: INIT_PROJECTS,
      tasks: INIT_TASKS,
      logs: INIT_LOGS,
      activeLog: null
    });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  const renderTimeLog = async () => {
    const rendered = renderHook(() => useTimeLogData(pushToApi));
    await waitFor(() => expect(rendered.result.current.isInitialized).toBe(true));
    return rendered;
  };

  it('should initialize with default projects when storage is empty', async () => {
    // Arrange & Act
    const { result } = await renderTimeLog();

    // Assert
    expect(result.current.projects).toHaveLength(3);
  });

  it('should add new project when handleAddProject is called', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    // Act
    await act(async () => {
      await result.current.handleAddProject('Test Project', 'rose');
    });

    // Assert
    expect(result.current.projects).toHaveLength(4);
    expect(result.current.projects[3].name).toBe('Test Project');
  });

  it('should toggle project archived state when handleToggleProjectArchive is called', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    // Act & Assert (Phase 1: archive)
    await act(async () => {
      await result.current.handleToggleProjectArchive(TEST_CONSTANTS.PROJECT_ID_1);
    });
    expect(result.current.projects[0].archived).toBe(true);

    // Act & Assert (Phase 2: unarchive)
    await act(async () => {
      await result.current.handleToggleProjectArchive(TEST_CONSTANTS.PROJECT_ID_1);
    });
    expect(result.current.projects[0].archived).toBe(false);
  });

  it('should add task when handleAddTask is called', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    // Act
    await act(async () => {
      await result.current.handleAddTask(TEST_CONSTANTS.PROJECT_ID_1, 'New Task', null);
    });

    // Assert
    expect(result.current.tasks).toHaveLength(8);
    expect(result.current.tasks[result.current.tasks.length - 1].name).toBe('New Task');
  });

  it('should rename project when handleRenameProject is called', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    // Act
    await act(async () => {
      await result.current.handleRenameProject(TEST_CONSTANTS.PROJECT_ID_1, 'Renamed Backend');
    });

    // Assert
    expect(result.current.projects[0].name).toBe('Renamed Backend');
  });

  it('should rename task when handleRenameTask is called', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    // Act
    await act(async () => {
      await result.current.handleRenameTask(TEST_CONSTANTS.TASK_ID_101, 'Renamed Auth API');
    });

    // Assert
    expect(result.current.tasks[0].name).toBe('Renamed Auth API');
  });

  it('should delete task and all subtasks and logs when handleDeleteTask is called', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    // Act
    await act(async () => {
      await result.current.handleDeleteTask(TEST_CONSTANTS.TASK_ID_102);
    });

    // Assert
    expect(result.current.tasks.find(t => t.id === TEST_CONSTANTS.TASK_ID_102)).toBeUndefined();
    expect(result.current.tasks.find(t => t.id === TEST_CONSTANTS.TASK_ID_1021)).toBeUndefined();
    expect(result.current.logs.find(l => l.taskId === TEST_CONSTANTS.TASK_ID_102)).toBeUndefined();
  });

  it('should toggle task complete when handleToggleTaskComplete is called', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    // Act
    await act(async () => {
      await result.current.handleToggleTaskComplete(TEST_CONSTANTS.TASK_ID_102);
    });

    // Assert
    expect(result.current.tasks.find(t => t.id === TEST_CONSTANTS.TASK_ID_102)?.completed).toBe(true);

    // Act & Assert (uncompleting)
    await act(async () => {
      await result.current.handleToggleTaskComplete(TEST_CONSTANTS.TASK_ID_102);
    });
    expect(result.current.tasks.find(t => t.id === TEST_CONSTANTS.TASK_ID_102)?.completed).toBe(false);
  });

  it('should trigger api callback when starting timer', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    // Act
    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_101);
    });

    // Assert
    expect(pushToApi).toHaveBeenCalled();
  });

  it('should stop running timer when handleStartTimer is called on an already running task', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_101);
    });
    expect(result.current.activeLog).not.toBeNull();
    pushToApi.mockClear();

    // Act
    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_101);
    });

    // Assert
    expect(result.current.activeLog).toBeNull();
    expect(pushToApi).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'TERMINATE' }),
      expect.stringContaining('Terminating')
    );
  });

  it('should automatically create mother log when starting child task timer', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    // Act
    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_1021);
    });

    // Assert
    const motherLog = result.current.logs.find(l => l.taskId === TEST_CONSTANTS.TASK_ID_102);
    const childLog = result.current.logs.find(l => l.taskId === TEST_CONSTANTS.TASK_ID_1021);
    expect(motherLog).toBeDefined();
    expect(childLog).toBeDefined();
    expect(motherLog?.endTime).toBeNull();
    expect(childLog?.endTime).toBeNull();
  });

  it('should stop all active timers when handleStopTimer is called', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_101);
    });
    expect(result.current.activeLog).not.toBeNull();

    // Act
    await act(async () => {
      await result.current.handleStopTimer();
    });

    // Assert
    expect(result.current.activeLog).toBeNull();
    const openLogs = result.current.logs.filter(l => l.endTime === null);
    expect(openLogs).toHaveLength(0);
  });

  it('should clear local storage and reload when handleResetLocalStorage is called', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    // Act
    await act(async () => {
      await result.current.handleResetLocalStorage();
    });

    // Assert
    const state = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    expect(state).toEqual({});
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('should handle empty backend state gracefully', async () => {
    // Arrange
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    // Act
    const { result } = await renderTimeLog();

    // Assert
    expect(result.current.projects).toHaveLength(0);
  });

  it('should do nothing when handleRenameProject is called with non existent id', async () => {
    // Arrange
    const { result } = await renderTimeLog();
    const initialProjects = [...result.current.projects];

    // Act
    await act(async () => {
      await result.current.handleRenameProject('non-existent', 'New Name');
    });

    // Assert
    expect(result.current.projects).toEqual(initialProjects);
  });

  it('should do nothing when handleRenameTask is called with non existent id', async () => {
    // Arrange
    const { result } = await renderTimeLog();
    const initialTasks = [...result.current.tasks];

    // Act
    await act(async () => {
      await result.current.handleRenameTask('non-existent', 'New Name');
    });

    // Assert
    expect(result.current.tasks).toEqual(initialTasks);
  });

  it('should do nothing when handleDeleteTask is called with non existent id', async () => {
    // Arrange
    const { result } = await renderTimeLog();
    const initialTasks = [...result.current.tasks];

    // Act
    await act(async () => {
      await result.current.handleDeleteTask('non-existent');
    });

    // Assert
    expect(result.current.tasks).toEqual(initialTasks);
  });

  it('should do nothing when handleToggleTaskComplete is called with non existent id', async () => {
    // Arrange
    const { result } = await renderTimeLog();
    const initialTasks = [...result.current.tasks];

    // Act
    await act(async () => {
      await result.current.handleToggleTaskComplete('non-existent');
    });

    // Assert
    expect(result.current.tasks).toEqual(initialTasks);
  });

  it('should do nothing when handleStartTimer is called with non existent id', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    // Act
    await act(async () => {
      await result.current.handleStartTimer('non-existent');
    });

    // Assert
    expect(pushToApi).not.toHaveBeenCalled();
    expect(result.current.activeLog).toBeNull();
  });

  it('should stop running timer when task is completed', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_102);
    });
    expect(result.current.activeLog?.taskId).toBe(TEST_CONSTANTS.TASK_ID_102);
    pushToApi.mockClear();

    // Act
    await act(async () => {
      await result.current.handleToggleTaskComplete(TEST_CONSTANTS.TASK_ID_102);
    });

    // Assert
    expect(result.current.activeLog).toBeNull();
    const log102 = result.current.logs.find(l => l.taskId === TEST_CONSTANTS.TASK_ID_102);
    expect(log102?.endTime).not.toBeNull();
  });

  it('should terminate running non mother task timer when starting another task timer', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_101);
    });
    pushToApi.mockClear();

    // Act
    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_102);
    });

    // Assert
    const log101 = result.current.logs.find(l => l.taskId === TEST_CONSTANTS.TASK_ID_101);
    expect(log101?.endTime).not.toBeNull();
    expect(pushToApi).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'TERMINATE' }),
      expect.stringContaining('Terminating')
    );
  });

  it('should keep mother task timer running when starting child task timer and mother is already running', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_102);
    });
    pushToApi.mockClear();

    // Act
    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_1021);
    });

    // Assert
    const motherLog = result.current.logs.find(l => l.taskId === TEST_CONSTANTS.TASK_ID_102);
    expect(motherLog?.endTime).toBeNull();

    const childLog = result.current.logs.find(l => l.taskId === TEST_CONSTANTS.TASK_ID_1021);
    expect(childLog?.endTime).toBeNull();
  });

  it('should stop only matching project timers when handleStopTimer is called with specific project id', async () => {
    // Arrange
    const { result } = await renderTimeLog();

    await act(async () => {
      await result.current.handleStartTimer(TEST_CONSTANTS.TASK_ID_101);
    });
    expect(result.current.activeLog?.projectId).toBe(TEST_CONSTANTS.PROJECT_ID_1);
    pushToApi.mockClear();

    // Act & Assert (Phase 1: stop unrelated project)
    await act(async () => {
      await result.current.handleStopTimer(TEST_CONSTANTS.PROJECT_ID_2);
    });
    expect(result.current.activeLog).not.toBeNull();

    // Act & Assert (Phase 2: stop matching project)
    await act(async () => {
      await result.current.handleStopTimer(TEST_CONSTANTS.PROJECT_ID_1);
    });
    expect(result.current.activeLog).toBeNull();
  });
});
