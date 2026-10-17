import { describe, it, expect } from 'vitest';
import { TauriValidationEngine } from '@common/engine/commands/TauriValidationEngine';
import { aProject, aTask } from '../../../../shared/builders/entity-builders';

describe('TauriValidationEngine', () => {
  const engine = new TauriValidationEngine();

  it('should succeed when validating non-duplicate project name', async () => {
    // Arrange
    const projects = [aProject({ name: 'Alpha' })];

    // Act & Assert
    await expect(engine.validateProjectName('Beta', projects)).resolves.toBeUndefined();
  });

  it('should throw when validating empty project name', async () => {
    // Arrange
    const projects = [aProject({ name: 'Alpha' })];

    // Act & Assert
    await expect(engine.validateProjectName('  ', projects)).rejects.toThrow();
  });

  it('should throw when validating empty task name', async () => {
    // Act & Assert
    await expect(engine.validateTaskName('')).rejects.toThrow();
  });

  it('should throw when task hierarchy contains direct cycle', async () => {
    // Arrange
    const tasks = [aTask({ id: 'task-1' })];

    // Act & Assert
    await expect(engine.validateTaskHierarchy('task-1', 'task-1', tasks)).rejects.toThrow();
  });
});
