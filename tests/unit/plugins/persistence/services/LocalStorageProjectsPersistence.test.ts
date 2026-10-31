import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LocalStorageProjectsPersistence,
  ValidationException,
} from '@plugins/persistence/services/LocalStorageProjectsPersistence';
import { ILocalStorageStateStore } from '@plugins/persistence/services/LocalStorageStateStore';
import { PersistenceException } from '@common/exceptions';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('LocalStorageProjectsPersistence', () => {
  let storeMock: ILocalStorageStateStore;
  let projectsPersistence: LocalStorageProjectsPersistence;

  beforeEach(() => {
    vi.clearAllMocks();
    storeMock = {
      load: vi.fn(),
      save: vi.fn().mockImplementation(async (s) => s),
      reset: vi.fn(),
      getStateOrDefault: vi.fn().mockResolvedValue({
        projects: [],
        tasks: [],
        logs: [],
        activeLog: null,
      }),
    };
    projectsPersistence = new LocalStorageProjectsPersistence(storeMock);
  });

  it('should append new project and save state when adding project', async () => {
    // Act
    const result = await projectsPersistence.add({
      name: 'Alpha',
      color: '#ff0000',
      description: 'Desc',
      icon: 'icon',
      tags: ['tag1'],
    });

    // Assert
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].name).toBe('Alpha');
    expect(storeMock.save).toHaveBeenCalledTimes(1);
  });

  it('should toggle archived boolean on matching project', async () => {
    // Arrange
    const project = aProject({ id: 'p-1', archived: false });
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [project],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    // Act
    const result = await projectsPersistence.toggleArchive('p-1');

    // Assert
    expect(result.projects[0].archived).toBe(true);
    expect(storeMock.save).toHaveBeenCalledTimes(1);
  });

  it('should not mutate logs or active log when toggling archive in persistence', async () => {
    // Arrange
    const project = aProject({ id: 'p-1', archived: false });
    const activeLog = aTimeLog({ id: 'l-active', projectId: 'p-1', endTime: null });
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [project],
      tasks: [],
      logs: [activeLog],
      activeLog,
    });

    // Act
    const result = await projectsPersistence.toggleArchive('p-1');

    // Assert
    expect(result.projects[0].archived).toBe(true);
    expect(result.activeLog).toEqual(activeLog);
    expect(result.logs[0].endTime).toBeNull();
  });

  it('should update project fields when update is called', async () => {
    // Arrange
    const project = aProject({ id: 'p-1', name: 'Old', color: '#111111' });
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [project],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    // Act
    const result = await projectsPersistence.update(
      'p-1',
      'New Name',
      '#222222',
      'New Desc',
      'new-icon',
      ['tag']
    );

    // Assert
    expect(result.projects[0].name).toBe('New Name');
    expect(result.projects[0].color).toBe('#222222');
    expect(result.projects[0].description).toBe('New Desc');
  });

  it('should rename project when rename is called', async () => {
    // Arrange
    const project = aProject({ id: 'p-1', name: 'Before Rename' });
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [project],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    // Act
    const result = await projectsPersistence.rename('p-1', 'After Rename');

    // Assert
    expect(result.projects[0].name).toBe('After Rename');
  });

  it('should throw PersistenceException when toggleArchive is called on non-existent project', async () => {
    // Arrange
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    // Act & Assert
    await expect(projectsPersistence.toggleArchive('missing-id')).rejects.toThrow(
      "Project with ID 'missing-id' not found"
    );
  });

  it('should throw PersistenceException when update is called on non-existent project', async () => {
    // Arrange
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    // Act & Assert
    await expect(
      projectsPersistence.update('missing-id', 'Name', '#fff', null, null, null)
    ).rejects.toThrow("Project with ID 'missing-id' not found");
  });

  it('should throw PersistenceException when rename is called on non-existent project', async () => {
    // Arrange
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    // Act & Assert
    await expect(projectsPersistence.rename('missing-id', 'New Name')).rejects.toThrow(
      "Project with ID 'missing-id' not found"
    );
  });

  describe('delete', () => {
    it('should throw PersistenceException with ERR_PERSISTENCE_PROJECT_NOT_FOUND when trying to delete non-existent project', async () => {
      // Arrange
      vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
        projects: [],
        tasks: [],
        logs: [],
        activeLog: null,
      });

      // Act & Assert
      await expect(projectsPersistence.delete('missing-id')).rejects.toThrow(
        "Project with ID 'missing-id' not found"
      );
      try {
        await projectsPersistence.delete('missing-id');
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(PersistenceException);
        expect((err as PersistenceException).code).toBe('ERR_PERSISTENCE_PROJECT_NOT_FOUND');
      }
      expect(storeMock.save).not.toHaveBeenCalled();
    });

    it('should block deletion and throw error when project has an active timer', async () => {
      // Arrange
      const project = aProject({ id: 'proj-active' });
      const activeLog = aTimeLog({ id: 'log-active', projectId: 'proj-active', endTime: undefined });
      vi.mocked(storeMock.getStateOrDefault).mockResolvedValue({
        projects: [project],
        tasks: [],
        logs: [activeLog],
        activeLog,
      });

      // Act & Assert
      await expect(projectsPersistence.delete('proj-active')).rejects.toThrow(
        'Cannot delete project with active timer. Stop timer first'
      );
      try {
        await projectsPersistence.delete('proj-active');
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationException);
        expect((err as ValidationException).code).toBe('ERR_PERSISTENCE_ACTIVE_TIMER');
      }
      expect(storeMock.save).not.toHaveBeenCalled();
    });

    it('should block deletion and throw error when a task of the project has an active timer', async () => {
      // Arrange
      const project = aProject({ id: 'proj-active-task' });
      const task = aTask({ id: 'task-1', projectId: 'proj-active-task' });
      const activeLog = aTimeLog({ id: 'log-active', projectId: 'other-proj', taskId: 'task-1', endTime: undefined });
      vi.mocked(storeMock.getStateOrDefault).mockResolvedValue({
        projects: [project],
        tasks: [task],
        logs: [activeLog],
        activeLog,
      });

      // Act & Assert
      await expect(projectsPersistence.delete('proj-active-task')).rejects.toThrow(
        'Cannot delete project with active timer. Stop timer first'
      );
      expect(storeMock.save).not.toHaveBeenCalled();
    });

    it('should block deletion and throw validation exception when project has logged time', async () => {
      // Arrange
      const project = aProject({ id: 'proj-with-time' });
      const task = aTask({ id: 'task-1', projectId: 'proj-with-time' });
      const log = aTimeLog({
        id: 'log-1',
        projectId: 'proj-with-time',
        taskId: 'task-1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: '2026-06-15T11:00:00Z',
      });
      vi.mocked(storeMock.getStateOrDefault).mockResolvedValue({
        projects: [project],
        tasks: [task],
        logs: [log],
        activeLog: null,
      });

      // Act & Assert
      await expect(projectsPersistence.delete('proj-with-time')).rejects.toThrow(
        'Cannot delete project with logged time'
      );
      try {
        await projectsPersistence.delete('proj-with-time');
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationException);
        expect((err as ValidationException).code).toBe('ERR_PERSISTENCE_VALIDATION');
      }
      expect(storeMock.save).not.toHaveBeenCalled();
    });

    it('should block deletion and throw validation exception when subtask has logged time', async () => {
      // Arrange
      const project = aProject({ id: 'proj-sub-time' });
      const parentTask = aTask({ id: 'parent-1', projectId: 'proj-sub-time' });
      const subtask = aTask({ id: 'sub-1', projectId: 'proj-sub-time', parentTaskId: 'parent-1' });
      const log = aTimeLog({
        id: 'log-sub',
        projectId: 'proj-sub-time',
        taskId: 'sub-1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: '2026-06-15T10:30:00Z',
      });
      vi.mocked(storeMock.getStateOrDefault).mockResolvedValue({
        projects: [project],
        tasks: [parentTask, subtask],
        logs: [log],
        activeLog: null,
      });

      // Act & Assert
      await expect(projectsPersistence.delete('proj-sub-time')).rejects.toThrow(
        'Cannot delete project with logged time'
      );
      expect(storeMock.save).not.toHaveBeenCalled();
    });

    it('should cascade delete all tasks and subtasks and the project itself when project has zero time', async () => {
      // Arrange
      const projectToDelete = aProject({ id: 'proj-zero', name: 'Zero Project' });
      const otherProject = aProject({ id: 'proj-other', name: 'Other Project' });
      const parentTask = aTask({ id: 't-parent', projectId: 'proj-zero', name: 'Parent Task' });
      const subTask = aTask({ id: 't-sub', projectId: 'proj-zero', parentTaskId: 't-parent', name: 'Subtask' });
      const otherTask = aTask({ id: 't-other', projectId: 'proj-other', name: 'Other Task' });

      vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
        projects: [projectToDelete, otherProject],
        tasks: [parentTask, subTask, otherTask],
        logs: [],
        activeLog: null,
      });

      // Act
      const result = await projectsPersistence.delete('proj-zero');

      // Assert
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].id).toBe('proj-other');
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).toBe('t-other');
      expect(storeMock.save).toHaveBeenCalledTimes(1);
      expect(storeMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          projects: [otherProject],
          tasks: [otherTask],
        })
      );
    });

    it('should successfully delete an archived project with zero time', async () => {
      // Arrange
      const archivedProject = aProject({ id: 'proj-archived', name: 'Archived Proj', archived: true });
      const archivedTask = aTask({ id: 't-archived', projectId: 'proj-archived' });

      vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
        projects: [archivedProject],
        tasks: [archivedTask],
        logs: [],
        activeLog: null,
      });

      // Act
      const result = await projectsPersistence.delete('proj-archived');

      // Assert
      expect(result.projects).toHaveLength(0);
      expect(result.tasks).toHaveLength(0);
      expect(storeMock.save).toHaveBeenCalledTimes(1);
    });
  });
});
