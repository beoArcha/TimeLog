import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';

describe('Unit Tests: PersistenceCommands - Tasks', () => {
  let commands: PersistenceCommands;

  beforeEach(() => {
    vi.clearAllMocks();
    commands = new PersistenceCommands();
  });

  describe('tasks persistence', () => {
    it('should call create when adding task', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({});

      // Act
      await commands.tasks.add({ projectId: 'p1', name: 'Task 1', parentTaskId: null });

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('create', {
        projectId: 'p1',
        name: 'Task 1',
        parentTaskId: null,
        hourlyRate: null,
      });
    });

    it('should call update_task when updating and rename_task when renaming', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({});

      // Act
      await commands.tasks.update('t1', 'New Task', null, 'Todo', false);
      await commands.tasks.rename('t1', 'Renamed Task');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('update_task', {
        taskId: 't1',
        name: 'New Task',
        parentTaskId: null,
        status: 'Todo',
        completed: false,
      });
      expect(mockInvoke).toHaveBeenCalledWith('rename_task', {
        taskId: 't1',
        name: 'Renamed Task',
      });
    });

    it('should call delete and toggle_complete', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({});

      // Act
      await commands.tasks.delete('t1');
      await commands.tasks.toggleComplete('t1');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('delete', { taskId: 't1' });
      expect(mockInvoke).toHaveBeenCalledWith('toggle_complete', { taskId: 't1' });
    });

    it('should getProjectId and getSubtasks correctly via direct IPC calls', async () => {
      // Arrange
      mockInvoke
        .mockResolvedValueOnce('p1')
        .mockResolvedValueOnce([
          { id: 'sub-1', name: 'Subtask', projectId: 'p1', parentTaskId: 't1' },
        ]);

      // Act
      const projectId = await commands.tasks.getProjectId('t1');
      const subtasks = await commands.tasks.getSubtasks('t1');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_task_project_id', { taskId: 't1' });
      expect(mockInvoke).toHaveBeenCalledWith('get_subtasks', { taskId: 't1' });
      expect(projectId).toBe('p1');
      expect(subtasks).toHaveLength(1);
      expect(subtasks[0].id).toBe('sub-1');
    });

    it('should throw error when getProjectId is called for non-existent task', async () => {
      // Arrange
      mockInvoke.mockRejectedValueOnce(new Error('Task unknown-task not found'));

      // Act & Assert
      await expect(commands.tasks.getProjectId('unknown-task')).rejects.toThrow(
        'Task unknown-task not found'
      );
    });
  });
});
