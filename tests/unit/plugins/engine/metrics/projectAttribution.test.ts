import { describe, it, expect } from 'vitest';
import { createProjectAttribution } from '@plugins/engine/metrics/projectAttribution';
import { aTask } from '../../../../shared/builders/entity-builders';

describe('createProjectAttribution', () => {
  it('should return the project of the task when the task moved away from the interval project', () => {
    // Arrange
    const resolve = createProjectAttribution([aTask({ id: 't1', projectId: 'p_new' })]);

    // Act
    const projectId = resolve('t1', 'p_old');

    // Assert
    expect(projectId).toBe('p_new');
  });

  it('should return the interval project when the task cannot be found', () => {
    // Arrange
    const resolve = createProjectAttribution([aTask({ id: 't1', projectId: 'p_new' })]);

    // Act
    const projectId = resolve('t_gone', 'p_old');

    // Assert
    expect(projectId).toBe('p_old');
  });

  it('should return the interval project when the interval has no task', () => {
    // Arrange
    const resolve = createProjectAttribution([aTask({ id: 't1', projectId: 'p_new' })]);

    // Act
    const projectId = resolve(undefined, 'p_old');

    // Assert
    expect(projectId).toBe('p_old');
  });
});
