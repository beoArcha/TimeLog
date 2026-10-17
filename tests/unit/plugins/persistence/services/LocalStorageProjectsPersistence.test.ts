import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageProjectsPersistence } from '@plugins/persistence/services/LocalStorageProjectsPersistence';
import { ILocalStorageStateStore } from '@plugins/persistence/services/LocalStorageStateStore';
import { aProject, aTimeLog } from '@tests/shared/builders/entity-builders';

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

  it('should close active log when archiving its project', async () => {
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
    expect(result.activeLog).toBeNull();
    expect(result.logs[0].endTime).toBeDefined();
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
});
