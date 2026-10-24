import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler } from '@common/exceptions';
import { SandboxEmulatorStore, SANDBOX_STORAGE_KEY } from '@features/cli/sandbox/sandboxEmulatorStore';
import { CliEngineContext } from '@features/cli/types';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('Unit Tests: SandboxEmulatorStore', () => {
  let store: SandboxEmulatorStore;

  beforeEach(() => {
    SandboxEmulatorStore.resetInstanceForTesting();
    store = SandboxEmulatorStore.getInstance();
  });

  it('should initialize with default demonstration data', () => {
    // Arrange
    // Instance obtained in beforeEach

    // Act
    const projects = store.getProjects();
    const tasks = store.getTasks();
    const logs = store.getLogs();
    const holidays = store.getHolidays();

    // Assert
    expect(projects.length).toBeGreaterThan(0);
    expect(tasks.length).toBeGreaterThan(0);
    expect(logs.length).toBeGreaterThan(0);
    expect(holidays.length).toBeGreaterThan(0);
    expect(store.isActive()).toBe(false);
  });

  it('should toggle active state on enable and disable', () => {
    // Arrange
    expect(store.isActive()).toBe(false);

    // Act
    store.enable();

    // Assert
    expect(store.isActive()).toBe(true);

    // Act
    store.disable();

    // Assert
    expect(store.isActive()).toBe(false);
  });

  it('should add and rename a project in memory without touching real storage', () => {
    // Arrange
    const initialCount = store.getProjects().length;

    // Act
    const newProj = store.handleAddProject('Test Sandbox Project', 'rose');

    // Assert
    expect(store.getProjects().length).toBe(initialCount + 1);
    expect(newProj.name).toBe('Test Sandbox Project');

    // Act
    const renameSuccess = store.handleRenameProject(newProj.id, 'Renamed Sandbox Project');

    // Assert
    expect(renameSuccess).toBe(true);
    const updatedProj = store.getProjects().find(p => p.id === newProj.id);
    expect(updatedProj?.name).toBe('Renamed Sandbox Project');
  });

  it('should add, rename, and complete tasks in memory', () => {
    // Arrange
    const initialTasksCount = store.getTasks().length;

    // Act
    const newTask = store.handleAddTask('sb_p1', 'Sandbox Task 1');

    // Assert
    expect(store.getTasks().length).toBe(initialTasksCount + 1);
    expect(newTask.completed).toBe(false);

    // Act
    store.handleRenameTask(newTask.id, 'Updated Sandbox Task');
    store.handleToggleTaskComplete(newTask.id);

    // Assert
    const updatedTask = store.getTasks().find(t => t.id === newTask.id);
    expect(updatedTask?.name).toBe('Updated Sandbox Task');
    expect(updatedTask?.completed).toBe(true);
  });

  it('should start and stop timer in memory', () => {
    // Arrange
    const nowIso = '2026-06-15T12:00:00Z';
    const stopIso = '2026-06-15T13:00:00Z';

    // Act
    const activeLog = store.handleStartTimer('sb_t1', nowIso);

    // Assert
    expect(activeLog.endTime).toBeNull();
    expect(store.getActiveLog()?.id).toBe(activeLog.id);

    // Act
    store.handleStopTimer(undefined, stopIso);

    // Assert
    expect(store.getActiveLog()).toBeNull();
    const completedLog = store.getLogs().find(l => l.id === activeLog.id);
    expect(completedLog?.endTime).toBe(stopIso);
  });

  it('should calculate computed metrics purely from in-memory logs', () => {
    // Arrange
    const nowIso = '2026-06-15T10:00:00Z';

    // Act
    const metrics = store.getComputedMetrics(nowIso);

    // Assert
    expect(metrics.projects).toBeDefined();
    expect(metrics.tasks).toBeDefined();
    expect(metrics.snapshotNowIso).toBe(nowIso);
  });

  it('should generate an isolated CliEngineContext via toCliContext', () => {
    // Arrange
    const baseContext: CliEngineContext = {
      projects: [aProject({ id: 'live_p1', name: 'Live Project' })],
      tasks: [aTask({ id: 'live_t1', name: 'Live Task' })],
      logs: [aTimeLog({ id: 'live_l1' })],
      activeLog: null,
      nowIso: '2026-06-15T15:00:00Z',
      locale: 'en',
      customTranslations: {},
      holidays: [],
      setHolidays: vi.fn(),
      selectedTaskId: null,
      setSelectedTaskId: vi.fn(),
      onAddProject: vi.fn(),
      onRenameProject: vi.fn(),
      onAddTask: vi.fn(),
      onRenameTask: vi.fn(),
      onToggleTaskComplete: vi.fn(),
      onStartTimer: vi.fn(),
      onStopTimer: vi.fn(),
    };

    // Act
    const sandboxContext = store.toCliContext(baseContext);

    // Assert
    expect(sandboxContext.isSandbox).toBe(true);
    expect(sandboxContext.projects.some(p => p.id.startsWith('sb_'))).toBe(true);
    expect(sandboxContext.projects.some(p => p.id === 'live_p1')).toBe(false);

    // Act (mutate via context handler)
    sandboxContext.onAddProject('Context Added Project', 'amber');

    // Assert (base context handler was not touched)
    expect(baseContext.onAddProject).not.toHaveBeenCalled();
    expect(store.getProjects().some(p => p.name === 'Context Added Project')).toBe(true);
  });

  it('should reset all modifications back to initial demo state', () => {
    // Arrange
    store.handleAddProject('Temporary Project');
    store.handleAddTask('sb_p1', 'Temporary Task');

    // Act
    store.reset();

    // Assert
    expect(store.getProjects().some(p => p.name === 'Temporary Project')).toBe(false);
    expect(store.getTasks().some(t => t.name === 'Temporary Task')).toBe(false);
    expect(store.getActiveLog()).toBeNull();
  });

  it('should persist modifications to localStorage across mutations', () => {
    // Arrange
    const projectName = 'Persisted Sandbox Project';

    // Act
    const project = store.handleAddProject(projectName);
    const storedRaw = localStorage.getItem(SANDBOX_STORAGE_KEY);

    // Assert
    expect(storedRaw).not.toBeNull();
    expect(storedRaw).toContain(projectName);
    expect(storedRaw).toContain(project.id);
  });

  it('should restore persisted state on initialization when stored in localStorage', () => {
    // Arrange
    const statePayload = {
      projects: [{ id: 'sb_custom_p1', name: 'Restored Proj', color: 'indigo', createdAt: '2026-01-01T00:00:00Z', archived: false, description: null, icon: null, tags: null }],
      tasks: [{ id: 'sb_custom_t1', projectId: 'sb_custom_p1', name: 'Restored Task', completed: false, createdAt: '2026-01-01T00:00:00Z', status: null, parentTaskId: null }],
      logs: [],
      holidays: [],
      activeLog: null,
      selectedTaskId: 'sb_custom_t1',
      nextIdCounter: 150,
    };
    localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(statePayload));

    // Act
    // Reset instance reference manually to trigger init() with localStorage contents:
    (SandboxEmulatorStore as unknown as { instance: null }).instance = null;
    const freshStore = SandboxEmulatorStore.getInstance();

    // Assert
    expect(freshStore.getProjects().some(p => p.id === 'sb_custom_p1')).toBe(true);
    expect(freshStore.getTasks().some(t => t.id === 'sb_custom_t1')).toBe(true);
    expect(freshStore.getSelectedTaskId()).toBe('sb_custom_t1');
  });

  it('should remove stored data from localStorage when reset is called', () => {
    // Arrange
    store.handleAddProject('Project To Clear');
    expect(localStorage.getItem(SANDBOX_STORAGE_KEY)).not.toBeNull();

    // Act
    store.reset();

    // Assert
    expect(localStorage.getItem(SANDBOX_STORAGE_KEY)).toBeNull();
  });

  it('should delegate to ErrorHandler when storage operations throw', () => {
    // Arrange
    const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    // Act
    store.handleAddProject('Quota Exceeded Project');

    // Assert
    expect(errorHandlerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'ERR_SANDBOX_SAVE',
      })
    );

    // Cleanup
    setItemSpy.mockRestore();
    errorHandlerSpy.mockRestore();
  });

  it('should return ENG_TIMER_INACTIVE error when stopping timer while idle', () => {
    // Arrange
    expect(store.getActiveLog()).toBeNull();

    // Act
    const result = store.handleStopTimer();

    // Assert
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('ENG_TIMER_INACTIVE');
  });

  it('should atomically stop previous timer and start new task on handleSwitchTimer', () => {
    // Arrange
    const firstLog = store.handleStartTimer('sb_t1', '2026-06-15T10:00:00Z');
    expect(store.getActiveLog()?.taskId).toBe('sb_t1');

    // Act
    const switchedLog = store.handleSwitchTimer('sb_t2', '2026-06-15T11:00:00Z');

    // Assert
    expect(switchedLog.taskId).toBe('sb_t2');
    expect(store.getActiveLog()?.taskId).toBe('sb_t2');
    const stoppedFirst = store.getLogs().find((l) => l.id === firstLog.id);
    expect(stoppedFirst?.endTime).toBe('2026-06-15T11:00:00Z');
  });

  it('should throw MissingTarget error when starting timer without valid taskId', () => {
    // Arrange & Act & Assert
    expect(() => store.handleStartTimer('')).toThrowError(/MissingTarget/);
  });

  it('should archive and unarchive projects and tasks', () => {
    // Arrange
    const proj = store.getProjects()[0];
    const task = store.getTasks()[0];

    // Act
    store.handleArchiveProject(proj.id);
    store.handleArchiveTask(task.id);

    // Assert
    expect(store.getProjects().find((p) => p.id === proj.id)?.archived).toBe(true);
    expect(store.getTasks().find((t) => t.id === task.id)?.archived).toBe(true);

    // Act (unarchive)
    store.handleArchiveProject(proj.id);
    store.handleArchiveTask(task.id);

    // Assert (unarchive)
    expect(store.getProjects().find((p) => p.id === proj.id)?.archived).toBe(false);
    expect(store.getTasks().find((t) => t.id === task.id)?.archived).toBe(false);
  });
});
