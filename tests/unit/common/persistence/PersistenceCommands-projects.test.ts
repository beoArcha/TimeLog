import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';
import { ErrorHandler } from '@common/exceptions';

describe('Unit Tests: PersistenceCommands - Projects', () => {
  let commands: PersistenceCommands;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ErrorHandler, 'handle').mockImplementation(() => {});
    commands = new PersistenceCommands();
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
        allowConcurrency: null,
        hourlyRate: null,
        currency: null,
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
        input: {
          projectId: 'p1',
          name: 'New Name',
          color: '#00ff00',
          description: null,
          icon: null,
          tags: null,
          allowConcurrency: null,
          hourlyRate: null,
          currency: null,
        },
      });
      expect(mockInvoke).toHaveBeenCalledWith('rename_project', {
        projectId: 'p1',
        name: 'Renamed',
      });
    });
  });
});
