import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageUiStatePersistence } from '@plugins/persistence/services/LocalStorageUiStatePersistence';
import { STORAGE_KEYS } from '@common/constants/storage-keys';

describe('LocalStorageUiStatePersistence', () => {
  let persistence: LocalStorageUiStatePersistence;

  beforeEach(() => {
    localStorage.clear();
    persistence = new LocalStorageUiStatePersistence();
  });

  it('should return null when no current project id is stored', async () => {
    // Arrange

    // Act
    const result = await persistence.getCurrentProjectId();

    // Assert
    expect(result).toBeNull();
  });

  it('should save and retrieve current project id correctly', async () => {
    // Arrange
    await persistence.saveCurrentProjectId('proj-alpha');

    // Act
    const result = await persistence.getCurrentProjectId();

    // Assert
    expect(result).toBe('proj-alpha');
  });

  it('should remove current project id from storage when saving null', async () => {
    // Arrange
    await persistence.saveCurrentProjectId('proj-alpha');

    // Act
    await persistence.saveCurrentProjectId(null);
    const result = await persistence.getCurrentProjectId();

    // Assert
    expect(result).toBeNull();
  });

  it('should return default full variant when none is stored', async () => {
    // Arrange

    // Act
    const result = await persistence.getLastNonCompactVariant();

    // Assert
    expect(result).toBe('full');
  });

  it('should save and retrieve last non-compact variant correctly', async () => {
    // Arrange
    await persistence.saveLastNonCompactVariant('medium');

    // Act
    const result = await persistence.getLastNonCompactVariant();

    // Assert
    expect(result).toBe('medium');
  });

  it('should return empty array when no project order is stored', async () => {
    // Arrange

    // Act
    const result = await persistence.getProjectOrder();

    // Assert
    expect(result).toEqual([]);
  });

  it('should save and retrieve project order correctly', async () => {
    // Arrange
    const sampleOrder = ['proj-3', 'proj-1', 'proj-2'];
    await persistence.saveProjectOrder(sampleOrder);

    // Act
    const result = await persistence.getProjectOrder();

    // Assert
    expect(result).toEqual(sampleOrder);
  });

  it('should return empty array when stored project order is corrupted json', async () => {
    // Arrange
    localStorage.setItem(STORAGE_KEYS.PROJECT_ORDER, 'invalid-json{{[');

    // Act
    const result = await persistence.getProjectOrder();

    // Assert
    expect(result).toEqual([]);
  });

  it('should return empty array when stored project order is not an array', async () => {
    // Arrange
    localStorage.setItem(STORAGE_KEYS.PROJECT_ORDER, JSON.stringify({ key: 'value' }));

    // Act
    const result = await persistence.getProjectOrder();

    // Assert
    expect(result).toEqual([]);
  });
});
