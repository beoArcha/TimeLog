import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTasksManager } from '@common/hooks/data/useTasksManager';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EngineRouter } from '@common/engine/EngineRouter';
import { WorkflowRouter } from '@common/workflows/WorkflowRouter';
import { aTask, aTimeLog, aWorkflowConfig } from '@tests/shared/builders/entity-builders';
import { createMockRepositoryState, createMockActionRunner } from '@tests/unit/hooks/data/test-doubles';
import { IWorkflow } from '@common/workflows/IWorkflow';

describe('Integration Tests: AutoStopTimerOnTaskComplete', () => {
  let mockStopTimer: ReturnType<typeof vi.fn>;
  let mockWorkflow: IWorkflow;

  beforeEach(() => {
    WorkflowRouter.resetForTesting();
    EngineRouter.resetForTesting();
    PersistenceRouter.resetForTesting();
    vi.clearAllMocks();

    mockStopTimer = vi.fn().mockResolvedValue(undefined);

    const mockEngine = {
      timer: {
        startTimer: vi.fn(),
        stopTimer: mockStopTimer,
        resumeTimer: vi.fn(),
        getActiveLogs: vi.fn().mockResolvedValue([]),
      },
      metrics: {} as unknown,
      timeLogs: {} as unknown,
      validation: {
        validateTaskName: vi.fn().mockResolvedValue(undefined),
        validateTaskHierarchy: vi.fn().mockResolvedValue(undefined),
        validateProjectName: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as import('@common/engine/IEngine').IEngine;
    EngineRouter.getInstance().setImplementationForTesting(mockEngine);

    mockWorkflow = {
      getConfig: vi.fn().mockResolvedValue(
        aWorkflowConfig({
          autoStopOnTaskComplete: true,
        })
      ),
      saveConfig: vi.fn(),
      getStatus: vi.fn(),
      checkRules: vi.fn(),
      startDaemon: vi.fn(),
      stopDaemon: vi.fn(),
    };
    WorkflowRouter.getInstance().setImplementationForTesting(mockWorkflow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Given an active running timer and autoStopOnTaskComplete enabled', () => {
    describe('When the user marks the currently running task as complete', () => {
      it('Then it should automatically stop the timer and update the task state', async () => {
        // Given
        const activeTask = aTask({ id: 'task-active', projectId: 'p1', name: 'Active Task', completed: false });
        const runningLog = aTimeLog({ id: 'log-1', taskId: 'task-active', projectId: 'p1', endTime: null });

        const setTasksState = vi.fn();
        const setLogsState = vi.fn();
        const setActiveLogState = vi.fn();
        const refreshComputedMetrics = vi.fn().mockResolvedValue(undefined);

        const mockRepositoryState = createMockRepositoryState({
          tasks: [activeTask],
          logs: [runningLog],
          activeLog: runningLog,
          setTasksState,
          setLogsState,
          setActiveLogState,
        });

        const mockActionRunner = createMockActionRunner();

        vi.spyOn(PersistenceRouter.getInstance().tasks, 'toggleComplete').mockResolvedValue({
          projects: [],
          tasks: [{ ...activeTask, completed: true }],
          logs: [{ ...runningLog, endTime: '2026-10-19T10:00:00.000Z' }],
          activeLog: null,
        });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepositoryState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics,
          })
        );

        // When
        await act(async () => {
          await result.current.handleToggleTaskComplete('task-active');
        });

        // Then
        expect(mockStopTimer).toHaveBeenCalledTimes(1);
        expect(setTasksState).toHaveBeenCalledWith([expect.objectContaining({ id: 'task-active', completed: true })]);
      });
    });

    describe('When the user updates the currently running task status to Done', () => {
      it('Then it should automatically invoke stopTimer', async () => {
        // Given
        const activeTask = aTask({ id: 'task-active', projectId: 'p1', name: 'Active Task', completed: false });
        const runningLog = aTimeLog({ id: 'log-1', taskId: 'task-active', projectId: 'p1', endTime: null });

        const mockRepositoryState = createMockRepositoryState({
          tasks: [activeTask],
          logs: [runningLog],
          activeLog: runningLog,
        });

        const mockActionRunner = createMockActionRunner();

        vi.spyOn(PersistenceRouter.getInstance().tasks, 'update').mockResolvedValue({
          projects: [],
          tasks: [{ ...activeTask, completed: true, status: 'Done' }],
          logs: [{ ...runningLog, endTime: '2026-10-19T10:00:00.000Z' }],
          activeLog: null,
        });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepositoryState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics: vi.fn().mockResolvedValue(undefined),
          })
        );

        // When
        await act(async () => {
          await result.current.handleUpdateTask('task-active', 'Active Task', null, 'Done', true);
        });

        // Then
        expect(mockStopTimer).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Given autoStopOnTaskComplete is disabled in workflow configuration', () => {
    describe('When the user completes the currently running task', () => {
      it('Then it should unconditionally stop the running timer even if workflow auto-stop is disabled', async () => {
        // Given
        mockWorkflow.getConfig = vi.fn().mockResolvedValue(
          aWorkflowConfig({
            autoStopOnTaskComplete: false,
          })
        );

        const activeTask = aTask({ id: 'task-active', projectId: 'p1', name: 'Active Task', completed: false });
        const runningLog = aTimeLog({ id: 'log-1', taskId: 'task-active', projectId: 'p1', endTime: null });

        const mockRepositoryState = createMockRepositoryState({
          tasks: [activeTask],
          logs: [runningLog],
          activeLog: runningLog,
        });

        const mockActionRunner = createMockActionRunner();

        vi.spyOn(PersistenceRouter.getInstance().tasks, 'toggleComplete').mockResolvedValue({
          projects: [],
          tasks: [{ ...activeTask, completed: true }],
          logs: [{ ...runningLog, endTime: '2026-10-19T10:00:00.000Z' }],
          activeLog: null,
        });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepositoryState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics: vi.fn().mockResolvedValue(undefined),
          })
        );

        // When
        await act(async () => {
          await result.current.handleToggleTaskComplete('task-active');
        });

        // Then
        expect(mockStopTimer).toHaveBeenCalledTimes(1);
      });
    });

    describe('When the user completes a parent task whose subtask has an active running timer', () => {
      it('Then it should unconditionally stop the running timer on the descendant task', async () => {
        // Given
        mockWorkflow.getConfig = vi.fn().mockResolvedValue(
          aWorkflowConfig({
            autoStopOnTaskComplete: false,
          })
        );

        const parentTask = aTask({ id: 'task-parent', projectId: 'p1', name: 'Parent Task', completed: false });
        const subTask = aTask({ id: 'task-child', projectId: 'p1', parentTaskId: 'task-parent', name: 'Child Task', completed: false });
        const runningLog = aTimeLog({ id: 'log-1', taskId: 'task-child', projectId: 'p1', endTime: null });

        const mockRepositoryState = createMockRepositoryState({
          tasks: [parentTask, subTask],
          logs: [runningLog],
          activeLog: runningLog,
        });

        const mockActionRunner = createMockActionRunner();

        vi.spyOn(PersistenceRouter.getInstance().tasks, 'toggleComplete').mockResolvedValue({
          projects: [],
          tasks: [{ ...parentTask, completed: true }, subTask],
          logs: [{ ...runningLog, endTime: '2026-10-19T10:00:00.000Z' }],
          activeLog: null,
        });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepositoryState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics: vi.fn().mockResolvedValue(undefined),
          })
        );

        // When
        await act(async () => {
          await result.current.handleToggleTaskComplete('task-parent');
        });

        // Then
        expect(mockStopTimer).toHaveBeenCalledTimes(1);
      });
    });

    describe('When the user updates a parent task to completed whose subtask has an active running timer', () => {
      it('Then it should unconditionally stop the running timer on the descendant task', async () => {
        // Given
        mockWorkflow.getConfig = vi.fn().mockResolvedValue(
          aWorkflowConfig({
            autoStopOnTaskComplete: false,
          })
        );

        const parentTask = aTask({ id: 'task-parent-2', projectId: 'p1', name: 'Parent Task 2', completed: false });
        const subTask = aTask({ id: 'task-child-2', projectId: 'p1', parentTaskId: 'task-parent-2', name: 'Child Task 2', completed: false });
        const runningLog = aTimeLog({ id: 'log-2', taskId: 'task-child-2', projectId: 'p1', endTime: null });

        const mockRepositoryState = createMockRepositoryState({
          tasks: [parentTask, subTask],
          logs: [runningLog],
          activeLog: runningLog,
        });

        const mockActionRunner = createMockActionRunner();

        vi.spyOn(PersistenceRouter.getInstance().tasks, 'update').mockResolvedValue({
          projects: [],
          tasks: [{ ...parentTask, completed: true }, subTask],
          logs: [{ ...runningLog, endTime: '2026-10-19T10:00:00.000Z' }],
          activeLog: null,
        });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepositoryState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics: vi.fn().mockResolvedValue(undefined),
          })
        );

        // When
        await act(async () => {
          await result.current.handleUpdateTask('task-parent-2', 'Parent Task 2', null, 'Done', true);
        });

        // Then
        expect(mockStopTimer).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Given multiple tasks where only one has an active running timer', () => {
    describe('When the user completes a different inactive task', () => {
      it('Then it should not stop the running timer of the active task', async () => {
        // Given
        const runningTask = aTask({ id: 'task-running', projectId: 'p1', name: 'Running Task', completed: false });
        const otherTask = aTask({ id: 'task-other', projectId: 'p1', name: 'Other Task', completed: false });
        const runningLog = aTimeLog({ id: 'log-1', taskId: 'task-running', projectId: 'p1', endTime: null });

        const mockRepositoryState = createMockRepositoryState({
          tasks: [runningTask, otherTask],
          logs: [runningLog],
          activeLog: runningLog,
        });

        const mockActionRunner = createMockActionRunner();

        vi.spyOn(PersistenceRouter.getInstance().tasks, 'toggleComplete').mockResolvedValue({
          projects: [],
          tasks: [runningTask, { ...otherTask, completed: true }],
          logs: [runningLog],
          activeLog: runningLog,
        });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepositoryState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics: vi.fn().mockResolvedValue(undefined),
          })
        );

        // When
        await act(async () => {
          await result.current.handleToggleTaskComplete('task-other');
        });

        // Then
        expect(mockStopTimer).not.toHaveBeenCalled();
      });
    });
  });

  describe('Regression: Selective cascade stop across concurrent projects, hierarchies, and update transitions', () => {
    describe('1. Two active timers in different projects with allowConcurrency = true', () => {
      it('Then completing task A stops A but task B remains running', async () => {
        // Given
        const taskA = aTask({ id: 'task-a', projectId: 'p1', name: 'Task A', completed: false });
        const taskB = aTask({ id: 'task-b', projectId: 'p2', name: 'Task B', completed: false });
        const logA = aTimeLog({ id: 'log-a', taskId: 'task-a', projectId: 'p1', endTime: null });
        const logB = aTimeLog({ id: 'log-b', taskId: 'task-b', projectId: 'p2', endTime: null });

        const mockRepositoryState = createMockRepositoryState({
          tasks: [taskA, taskB],
          logs: [logA, logB],
          activeLogs: [logA, logB],
          activeLog: logA,
        });

        const mockActionRunner = createMockActionRunner();

        vi.spyOn(PersistenceRouter.getInstance().tasks, 'toggleComplete').mockResolvedValue({
          projects: [],
          tasks: [{ ...taskA, completed: true }, taskB],
          logs: [{ ...logA, endTime: '2026-10-19T10:00:00.000Z' }, logB],
          activeLogs: [logB],
          activeLog: logB,
        });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepositoryState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics: vi.fn().mockResolvedValue(undefined),
          })
        );

        // When
        await act(async () => {
          await result.current.handleToggleTaskComplete('task-a');
        });

        // Then
        expect(mockStopTimer).toHaveBeenCalledTimes(1);
        expect(mockStopTimer).toHaveBeenCalledWith('p1');
        expect(mockStopTimer).not.toHaveBeenCalledWith('p2');
      });
    });

    describe('2. Active timer on a grandchild task', () => {
      it('Then completing the grandparent task stops the grandchild timer', async () => {
        // Given
        const grandparent = aTask({ id: 'task-gp', projectId: 'p1', name: 'Grandparent', completed: false });
        const parent = aTask({ id: 'task-parent', projectId: 'p1', parentTaskId: 'task-gp', name: 'Parent', completed: false });
        const grandchild = aTask({ id: 'task-gc', projectId: 'p1', parentTaskId: 'task-parent', name: 'Grandchild', completed: false });
        const runningLog = aTimeLog({ id: 'log-gc', taskId: 'task-gc', projectId: 'p1', endTime: null });

        const mockRepositoryState = createMockRepositoryState({
          tasks: [grandparent, parent, grandchild],
          logs: [runningLog],
          activeLogs: [runningLog],
          activeLog: runningLog,
        });

        const mockActionRunner = createMockActionRunner();

        vi.spyOn(PersistenceRouter.getInstance().tasks, 'toggleComplete').mockResolvedValue({
          projects: [],
          tasks: [{ ...grandparent, completed: true }, parent, grandchild],
          logs: [{ ...runningLog, endTime: '2026-10-19T10:00:00.000Z' }],
          activeLogs: [],
          activeLog: null,
        });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepositoryState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics: vi.fn().mockResolvedValue(undefined),
          })
        );

        // When
        await act(async () => {
          await result.current.handleToggleTaskComplete('task-gp');
        });

        // Then
        expect(mockStopTimer).toHaveBeenCalledTimes(1);
        expect(mockStopTimer).toHaveBeenCalledWith('p1');
      });
    });

    describe('3. Update status to Done without completed: true', () => {
      it('Then updating status to Done stops the timer', async () => {
        // Given
        const activeTask = aTask({ id: 'task-active-3', projectId: 'p1', name: 'Task 3', completed: false, status: 'Todo' });
        const runningLog = aTimeLog({ id: 'log-3', taskId: 'task-active-3', projectId: 'p1', endTime: null });

        const mockRepositoryState = createMockRepositoryState({
          tasks: [activeTask],
          logs: [runningLog],
          activeLogs: [runningLog],
          activeLog: runningLog,
        });

        const mockActionRunner = createMockActionRunner();

        vi.spyOn(PersistenceRouter.getInstance().tasks, 'update').mockResolvedValue({
          projects: [],
          tasks: [{ ...activeTask, status: 'Done', completed: true }],
          logs: [{ ...runningLog, endTime: '2026-10-19T10:00:00.000Z' }],
          activeLogs: [],
          activeLog: null,
        });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepositoryState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics: vi.fn().mockResolvedValue(undefined),
          })
        );

        // When: updating status: 'Done' without completed: true (e.g. completed: null)
        await act(async () => {
          await result.current.handleUpdateTask('task-active-3', 'Task 3', null, 'Done', null);
        });

        // Then
        expect(mockStopTimer).toHaveBeenCalledTimes(1);
        expect(mockStopTimer).toHaveBeenCalledWith('p1');
      });
    });

    describe('4. Renaming or updating rate on an already completed task', () => {
      it('Then updating name or rate on completed task does not stop unrelated active timers', async () => {
        // Given
        const completedTask = aTask({ id: 'task-done', projectId: 'p1', name: 'Done Task', completed: true, status: 'Done' });
        const otherTask = aTask({ id: 'task-other-running', projectId: 'p2', name: 'Other Running', completed: false });
        const runningLog = aTimeLog({ id: 'log-other', taskId: 'task-other-running', projectId: 'p2', endTime: null });

        const mockRepositoryState = createMockRepositoryState({
          tasks: [completedTask, otherTask],
          logs: [runningLog],
          activeLogs: [runningLog],
          activeLog: runningLog,
        });

        const mockActionRunner = createMockActionRunner();

        vi.spyOn(PersistenceRouter.getInstance().tasks, 'update').mockResolvedValue({
          projects: [],
          tasks: [{ ...completedTask, name: 'Renamed Done Task', hourlyRate: '75' }, otherTask],
          logs: [runningLog],
          activeLogs: [runningLog],
          activeLog: runningLog,
        });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepositoryState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics: vi.fn().mockResolvedValue(undefined),
          })
        );

        // When
        await act(async () => {
          await result.current.handleUpdateTask('task-done', 'Renamed Done Task', null, null, null, '75');
        });

        // Then
        expect(mockStopTimer).not.toHaveBeenCalled();
      });
    });

    describe('5. Completing task without active timer', () => {
      it('Then completing a task without any active timer does not invoke stopTimer', async () => {
        // Given
        const idleTask = aTask({ id: 'task-idle', projectId: 'p1', name: 'Idle Task', completed: false });

        const mockRepositoryState = createMockRepositoryState({
          tasks: [idleTask],
          logs: [],
          activeLogs: [],
          activeLog: null,
        });

        const mockActionRunner = createMockActionRunner();

        vi.spyOn(PersistenceRouter.getInstance().tasks, 'toggleComplete').mockResolvedValue({
          projects: [],
          tasks: [{ ...idleTask, completed: true }],
          logs: [],
          activeLogs: [],
          activeLog: null,
        });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepositoryState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics: vi.fn().mockResolvedValue(undefined),
          })
        );

        // When
        await act(async () => {
          await result.current.handleToggleTaskComplete('task-idle');
        });

        // Then
        expect(mockStopTimer).not.toHaveBeenCalled();
      });
    });
  });
});
