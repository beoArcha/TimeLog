import { describe, it, expect } from 'vitest';
import { BrowserValidationEngine } from '@plugins/engine/services/BrowserValidationEngine';
import { aProject, aTask } from '../../../../shared/builders/entity-builders';

describe('BrowserValidationEngine', () => {
  const engine = new BrowserValidationEngine();

  it('should succeed when project name is valid and unique', async () => {
    // Arrange
    const projects = [aProject({ name: 'Alpha' })];

    // Act & Assert
    await expect(engine.validateProjectName('Beta', projects)).resolves.toBeUndefined();
  });

  it('should throw when project name is duplicate', async () => {
    // Arrange
    const projects = [aProject({ name: 'Alpha' })];

    // Act & Assert
    await expect(engine.validateProjectName('alpha', projects)).rejects.toThrow();
  });

  it('should throw when task name is empty', async () => {
    // Act & Assert
    await expect(engine.validateTaskName('   ')).rejects.toThrow();
  });

  it('should throw when task hierarchy is invalid', async () => {
    // Arrange
    const tasks = [aTask({ id: 't1' })];

    // Act & Assert
    await expect(engine.validateTaskHierarchy('t1', 't1', tasks)).rejects.toThrow();
  });
});
