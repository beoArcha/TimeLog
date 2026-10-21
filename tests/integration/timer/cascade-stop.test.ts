import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProjectsManager } from '@common/hooks/data/useProjectsManager';
import { useTasksManager } from '@common/hooks/data/useTasksManager';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EngineRouter } from '@common/engine/EngineRouter';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import { createMockRepositoryState, createMockActionRunner } from '@tests/unit/hooks/data/test-doubles';
import { IEngine } from '@common/engine/IEngine';

describe('Integration Tests: Active Timer Cascade Stop Safeguard', () => {
  let mockStopTimer: ReturnType<typeof vi.fn>;
  let mockEngine: IEngine;

  beforeEach(() => {
    EngineRouter.resetForTesting();
    PersistenceRouter.resetForTesting();
    vi.clearAllMocks();

    mockStopTimer = vi.fn().mockResolvedValue(undefined);

    mockEngine = {
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
    } as unknown as IEngine;

    EngineRouter.getInstance().setImplementationForTesting(mockEngine);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Given an active running timer on a project', () => {
    describe('When the user archives the project', () => {
      it('Then it should invoke stopTimer with projectId before toggling archive', async () => {
        // Given
        const project = aProject({ id: 'p_active', archived: false });
        const task = aTask({ id: 't_active', projectId: 'p_active' });
        const activeLog = aTimeLog({ id: 'log_active', projectId: 'p_active', taskId: 't_active', endTime: null });

        const mockRepoState = createMockRepositoryState({
          projects: [project],
          tasks: [task],
          logs: [activeLog],
          activeLog,
        });

        const mockActionRunner = createMockActionRunner();
        const refreshComputedMetrics = vi.fn().mockResolvedValue(null);

        const toggleArchiveSpy = vi.spyOn(PersistenceRouter.getInstance().projects, 'toggleArchive')
          .mockResolvedValue({
            projects: [{ ...project, archived: true }],
            tasks: [task],
            logs: [{ ...activeLog, endTime: '2026-06-15T12:00:00Z' }],
            activeLog: null,
          });

        const { result } = renderHook(() =>
          useProjectsManager({
            repositoryState: mockRepoState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics,
          })
        );

        // When
        await act(async () => {
          await result.current.handleToggleProjectArchive('p_active');
        });

        // Then
        expect(mockStopTimer).toHaveBeenCalledTimes(1);
        expect(mockStopTimer).toHaveBeenCalledWith('p_active');
        expect(toggleArchiveSpy).toHaveBeenCalledWith('p_active');
        expect(mockRepoState.setProjectsState).toHaveBeenCalledWith([{ ...project, archived: true }]);
        expect(mockRepoState.setActiveLogState).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Given an active running timer on a direct task', () => {
    describe('When the user deletes the active task', () => {
      it('Then it should stop the active timer before deleting the task', async () => {
        // Given
        const task = aTask({ id: 't_to_delete', projectId: 'p1' });
        const activeLog = aTimeLog({ id: 'log_direct', projectId: 'p1', taskId: 't_to_delete', endTime: null });

        const mockRepoState = createMockRepositoryState({
          projects: [],
          tasks: [task],
          logs: [activeLog],
          activeLog,
        });

        const mockActionRunner = createMockActionRunner();
        const refreshComputedMetrics = vi.fn().mockResolvedValue(null);

        const deleteSpy = vi.spyOn(PersistenceRouter.getInstance().tasks, 'delete')
          .mockResolvedValue({
            projects: [],
            tasks: [],
            logs: [],
            activeLog: null,
          });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepoState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics,
          })
        );

        // When
        await act(async () => {
          await result.current.handleDeleteTask('t_to_delete');
        });

        // Then
        expect(mockStopTimer).toHaveBeenCalledTimes(1);
        expect(deleteSpy).toHaveBeenCalledWith('t_to_delete');
        expect(mockRepoState.setActiveLogState).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Given an active running timer on a nested subtask', () => {
    describe('When the user deletes the parent task', () => {
      it('Then it should detect descendant subtask activity and stop the timer before deleting parent', async () => {
        // Given
        const parentTask = aTask({ id: 'parent_1', projectId: 'p1', parentTaskId: null });
        const subtask = aTask({ id: 'child_1', projectId: 'p1', parentTaskId: 'parent_1' });
        const activeLog = aTimeLog({ id: 'log_child', projectId: 'p1', taskId: 'child_1', endTime: null });

        const mockRepoState = createMockRepositoryState({
          projects: [],
          tasks: [parentTask, subtask],
          logs: [activeLog],
          activeLog,
        });

        const mockActionRunner = createMockActionRunner();
        const refreshComputedMetrics = vi.fn().mockResolvedValue(null);

        const deleteSpy = vi.spyOn(PersistenceRouter.getInstance().tasks, 'delete')
          .mockResolvedValue({
            projects: [],
            tasks: [],
            logs: [],
            activeLog: null,
          });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepoState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics,
          })
        );

        // When
        await act(async () => {
          await result.current.handleDeleteTask('parent_1');
        });

        // Then
        expect(mockStopTimer).toHaveBeenCalledTimes(1);
        expect(deleteSpy).toHaveBeenCalledWith('parent_1');
        expect(mockRepoState.setActiveLogState).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Given an active timer running on a different task', () => {
    describe('When the user deletes an unrelated task', () => {
      it('Then it should not stop the active timer', async () => {
        // Given
        const activeTask = aTask({ id: 't_active', projectId: 'p1' });
        const unrelatedTask = aTask({ id: 't_unrelated', projectId: 'p1' });
        const activeLog = aTimeLog({ id: 'log_other', projectId: 'p1', taskId: 't_active', endTime: null });

        const mockRepoState = createMockRepositoryState({
          projects: [],
          tasks: [activeTask, unrelatedTask],
          logs: [activeLog],
          activeLog,
        });

        const mockActionRunner = createMockActionRunner();
        const refreshComputedMetrics = vi.fn().mockResolvedValue(null);

        vi.spyOn(PersistenceRouter.getInstance().tasks, 'delete').mockResolvedValue({
          projects: [],
          tasks: [activeTask],
          logs: [activeLog],
          activeLog,
        });

        const { result } = renderHook(() =>
          useTasksManager({
            repositoryState: mockRepoState,
            actionRunner: mockActionRunner,
            refreshComputedMetrics,
          })
        );

        // When
        await act(async () => {
          await result.current.handleDeleteTask('t_unrelated');
        });

        // Then
        expect(mockStopTimer).not.toHaveBeenCalled();
      });
    });
  });
});
