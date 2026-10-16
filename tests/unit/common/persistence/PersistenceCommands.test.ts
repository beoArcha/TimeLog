import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';
import { ErrorHandler } from '@common/exceptions';

describe('Unit Tests: PersistenceCommands', () => {
  let commands: PersistenceCommands;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ErrorHandler, 'handle').mockImplementation(() => {});
    commands = new PersistenceCommands();
  });

  describe('core persistence', () => {
    it('should call get_state on load and return populated state', async () => {
      // Arrange
      const mockState = {
        projects: [{ id: 'p1', name: 'Proj 1', color: 'blue' }],
        tasks: [{ id: 't1', name: 'Task 1' }],
        logs: [],
        activeLog: null,
      };
      mockInvoke.mockResolvedValue(mockState);

      // Act
      const result = await commands.core.load();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_state');
      expect(result).toEqual(mockState);
    });

    it('should return null on load if state has empty projects and tasks', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({ projects: [], tasks: [], logs: [], activeLog: null });

      // Act
      const result = await commands.core.load();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null on load if state is malformed or null', async () => {
      // Arrange
      mockInvoke.mockResolvedValue(null);

      // Act
      const result = await commands.core.load();

      // Assert
      expect(result).toBeNull();
    });

    it('should handle error and rethrow on load failure', async () => {
      // Arrange
      const err = new Error('Tauri load error');
      mockInvoke.mockRejectedValue(err);

      // Act & Assert
      await expect(commands.core.load()).rejects.toThrow('Tauri load error');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });

    it('should call override_state and reload state', async () => {
      // Arrange
      const mockState = {
        projects: [{ id: 'p1', name: 'Proj 1', color: 'blue' }],
        tasks: [],
      };
      mockInvoke.mockResolvedValue(mockState);

      // Act
      const result = await commands.core.overrideState({ projects: mockState.projects as never });

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('override_state', {
        state: { projects: mockState.projects },
      });
      expect(result).toEqual(mockState);
    });

    it('should call reset command', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({ projects: [], tasks: [], logs: [], activeLog: null });

      // Act
      const result = await commands.core.reset();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('reset');
      expect(result).toEqual({ projects: [], tasks: [], logs: [], activeLog: null });
    });
  });

  describe('projects persistence', () => {
    it('should call add with project input', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({});

      // Act
      await commands.projects.add({ name: 'Project 1', color: 'red' });

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('add', {
        name: 'Project 1',
        color: 'red',
        description: null,
        icon: null,
        tags: null,
      });
    });

    it('should call toggle_archive', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({});

      // Act
      await commands.projects.toggleArchive('p1');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('toggle_archive', { projectId: 'p1' });
    });

    it('should call update_project on update and rename', async () => {
      // Arrange
      const mockState = {
        projects: [
          { id: 'p1', name: 'Old', color: '#ff0000', description: null, icon: null, tags: null },
        ],
        tasks: [],
        logs: [],
        activeLog: null,
      };
      mockInvoke.mockResolvedValue(mockState);

      // Act
      await commands.projects.update('p1', 'New Name', '#00ff00', null, null, null);
      await commands.projects.rename('p1', 'Renamed');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('update_project', {
        projectId: 'p1',
        name: 'New Name',
        color: '#00ff00',
        description: null,
        icon: null,
        tags: null,
      });
      expect(mockInvoke).toHaveBeenCalledWith('update_project', {
        projectId: 'p1',
        name: 'Renamed',
        color: '#ff0000',
        description: null,
        icon: null,
        tags: null,
      });
    });
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
      });
    });

    it('should call update_task when updating and renaming', async () => {
      // Arrange
      const mockState = {
        projects: [],
        tasks: [
          { id: 't1', name: 'Old Task', projectId: 'p1', parentTaskId: null, status: null, completed: false },
        ],
        logs: [],
        activeLog: null,
      };
      mockInvoke.mockResolvedValue(mockState);

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
      expect(mockInvoke).toHaveBeenCalledWith('update_task', {
        taskId: 't1',
        name: 'Renamed Task',
        parentTaskId: null,
        status: null,
        completed: false,
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

    it('should getProjectId and getSubtasks correctly', async () => {
      // Arrange
      const mockState = {
        projects: [],
        tasks: [
          { id: 't1', name: 'Parent', projectId: 'p1', parentTaskId: null },
          { id: 'sub-1', name: 'Subtask', projectId: 'p1', parentTaskId: 't1' },
        ],
        logs: [],
        activeLog: null,
      };
      mockInvoke.mockResolvedValue(mockState);

      // Act
      const projectId = await commands.tasks.getProjectId('t1');
      const subtasks = await commands.tasks.getSubtasks('t1');

      // Assert
      expect(projectId).toBe('p1');
      expect(subtasks).toHaveLength(1);
      expect(subtasks[0].id).toBe('sub-1');
    });

    it('should throw error when getProjectId is called for non-existent task', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({ projects: [], tasks: [], logs: [], activeLog: null });

      // Act & Assert
      await expect(commands.tasks.getProjectId('unknown-task')).rejects.toThrow(
        'Task unknown-task not found'
      );
    });
  });

  describe('settings persistence', () => {
    it('should call get settings and handle errors', async () => {
      // Arrange
      const mockSettings = { autoStart: true, minimizeToTray: false };
      mockInvoke.mockResolvedValue(mockSettings);

      // Act
      const result = await commands.settings.get();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get');
      expect(result).toEqual(mockSettings);

      // Error case
      mockInvoke.mockRejectedValue(new Error('Settings fetch failed'));
      await expect(commands.settings.get()).rejects.toThrow('Settings fetch failed');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });

    it('should call save settings and handle errors', async () => {
      // Arrange
      const mockSettings = { autoStart: true, minimizeToTray: false };
      mockInvoke.mockResolvedValue(undefined);

      // Act
      await commands.settings.save(mockSettings as never);

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('save', { settings: mockSettings });

      // Error case
      mockInvoke.mockRejectedValue(new Error('Settings save failed'));
      await expect(commands.settings.save(mockSettings as never)).rejects.toThrow('Settings save failed');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });
  });

  describe('runtimeConfigs persistence', () => {
    it('should call save_runtime_config and get_runtime_configs', async () => {
      // Arrange
      const mockConfig = { id: 'cfg-1', key: 'api_url', value: 'http://localhost' };
      mockInvoke.mockResolvedValue([mockConfig]);

      // Act
      await commands.runtimeConfigs.save(mockConfig as never);
      const allConfigs = await commands.runtimeConfigs.getAll();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('save_runtime_config', { config: mockConfig });
      expect(mockInvoke).toHaveBeenCalledWith('get_runtime_configs');
      expect(allConfigs).toEqual([mockConfig]);
    });

    it('should handle errors in runtimeConfigs methods', async () => {
      // Arrange
      mockInvoke.mockRejectedValue(new Error('Runtime config error'));

      // Act & Assert
      await expect(commands.runtimeConfigs.save({} as never)).rejects.toThrow('Runtime config error');
      await expect(commands.runtimeConfigs.getAll()).rejects.toThrow('Runtime config error');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });
  });

  describe('timeLogs persistence', () => {
    it('should invoke all timeLogs persistence commands', async () => {
      // Arrange
      const mockLogs = [{ id: 'l1', taskId: 't1', startTime: '2026-01-01T00:00:00Z' }];
      mockInvoke.mockResolvedValue(mockLogs);

      // Act
      const forTask = await commands.timeLogs.getForTask('t1');
      await commands.timeLogs.closeActiveByProject('2026-01-01T01:00:00Z', 'p1');
      await commands.timeLogs.closeAllActive('2026-01-01T01:00:00Z');
      await commands.timeLogs.insert('l2', 't1', '2026-01-01T02:00:00Z');
      mockInvoke.mockResolvedValue(['l1']);
      const activeIds = await commands.timeLogs.queryActive();
      mockInvoke.mockResolvedValue(mockLogs);
      const allLogs = await commands.timeLogs.getAll();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_for_task', { taskId: 't1' });
      expect(mockInvoke).toHaveBeenCalledWith('close_active_by_project', {
        endTime: '2026-01-01T01:00:00Z',
        projectId: 'p1',
      });
      expect(mockInvoke).toHaveBeenCalledWith('close_all_active', {
        endTime: '2026-01-01T01:00:00Z',
      });
      expect(mockInvoke).toHaveBeenCalledWith('insert', {
        logId: 'l2',
        taskId: 't1',
        startTime: '2026-01-01T02:00:00Z',
      });
      expect(mockInvoke).toHaveBeenCalledWith('query_active');
      expect(activeIds).toEqual(['l1']);
      expect(mockInvoke).toHaveBeenCalledWith('get_all');
      expect(allLogs).toEqual(mockLogs);
      expect(forTask).toEqual(mockLogs);
    });
  });
});
