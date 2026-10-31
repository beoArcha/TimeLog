import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { TauriProjectsPersistence } from '@common/persistence/commands/TauriProjectsPersistence';

describe('TauriProjectsPersistence', () => {
  let projectsPersistence: TauriProjectsPersistence;

  beforeEach(() => {
    vi.clearAllMocks();
    projectsPersistence = new TauriProjectsPersistence();
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
      allowConcurrency: null,
      hourlyRate: null,
      currency: null,
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
      input: {
        projectId: 'proj-123',
        name: 'Updated Project',
        color: '#00ff00',
        description: 'Updated desc',
        icon: 'star',
        tags: ['new-tag'],
        allowConcurrency: null,
      },
    });
  });

  it('should invoke update_project command with billing fields when provided', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await projectsPersistence.update(
      'proj-123',
      'Updated Project',
      '#00ff00',
      'Updated desc',
      'star',
      ['new-tag'],
      false,
      '250.00',
      'EUR'
    );

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('update_project', {
      input: {
        projectId: 'proj-123',
        name: 'Updated Project',
        color: '#00ff00',
        description: 'Updated desc',
        icon: 'star',
        tags: ['new-tag'],
        allowConcurrency: false,
        hourlyRate: '250.00',
        currency: 'EUR',
      },
    });
  });

  it('should invoke rename_project command when renaming project', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await projectsPersistence.rename('proj-123', 'Renamed Project');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('rename_project', {
      projectId: 'proj-123',
      name: 'Renamed Project',
    });
  });
});
