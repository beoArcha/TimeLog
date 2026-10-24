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
      it('Then it should keep the running timer intact without calling stopTimer', async () => {
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
          await result.current.handleToggleTaskComplete('task-active');
        });

        // Then
        expect(mockStopTimer).not.toHaveBeenCalled();
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
});
