import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { TauriProjectsPersistence } from '@common/persistence/commands/TauriProjectsPersistence';
import { ICorePersistence } from '@common/persistence/IPersistence';
import { aProject } from '@tests/shared/builders/entity-builders';

describe('TauriProjectsPersistence', () => {
  let coreMock: ICorePersistence;
  let projectsPersistence: TauriProjectsPersistence;

  beforeEach(() => {
    vi.clearAllMocks();
    coreMock = {
      load: vi.fn(),
      overrideState: vi.fn(),
      reset: vi.fn(),
    };
    projectsPersistence = new TauriProjectsPersistence(coreMock);
  });

  it('should invoke add command with normalized inputs when adding project', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await projectsPersistence.add({
      name: 'Project Alpha',
      color: '#ff0000',
      description: 'Test description',
      icon: 'folder',
      tags: ['tag1'],
    });

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('add', {
      name: 'Project Alpha',
      color: '#ff0000',
      description: 'Test description',
      icon: 'folder',
      tags: ['tag1'],
    });
  });

  it('should invoke toggle_archive command with project id when toggling archive', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await projectsPersistence.toggleArchive('proj-123');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('toggle_archive', { projectId: 'proj-123' });
  });

  it('should invoke update_project command with full parameters when updating project', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await projectsPersistence.update(
      'proj-123',
      'Updated Project',
      '#00ff00',
      'Updated desc',
      'star',
      ['new-tag']
    );

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('update_project', {
      projectId: 'proj-123',
      name: 'Updated Project',
      color: '#00ff00',
      description: 'Updated desc',
      icon: 'star',
      tags: ['new-tag'],
    });
  });

  it('should preserve existing project attributes when renaming project', async () => {
    // Arrange
    vi.mocked(coreMock.load).mockResolvedValueOnce({
      projects: [
        aProject({
          id: 'proj-123',
          name: 'Original Name',
          color: '#123456',
          description: 'Desc',
          icon: 'icon-tag',
          tags: ['t1'],
        }),
      ],
      tasks: [],
      logs: [],
      activeLog: null,
    });
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await projectsPersistence.rename('proj-123', 'Renamed Project');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('update_project', {
      projectId: 'proj-123',
      name: 'Renamed Project',
      color: '#123456',
      description: 'Desc',
      icon: 'icon-tag',
      tags: ['t1'],
    });
  });
});
