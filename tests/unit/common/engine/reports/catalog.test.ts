import { describe, it, expect } from 'vitest';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';
import { Catalog } from '@common/engine/reports/catalog';
import { BUSINESS_VIOLATION_CODE, ENTITY_NOT_FOUND_CODE } from '@common/engine/reports/errors';

describe('Catalog', () => {
  it('should return the project registered under an id', () => {
    // Arrange
    const project = aProject({ id: 'p9' });
    const catalog = new Catalog([project], []);

    // Act
    const found = catalog.project('p9');

    // Assert
    expect(found).toBe(project);
  });

  it('should fail with a not-found error naming the missing project', () => {
    // Arrange
    const catalog = new Catalog([], []);

    // Act
    const act = () => catalog.project('ghost');

    // Assert
    expect(act).toThrow(
      expect.objectContaining({ code: ENTITY_NOT_FOUND_CODE, message: "Project with id 'ghost' not found" })
    );
  });

  it('should fail with a not-found error naming the missing task', () => {
    // Arrange
    const catalog = new Catalog([], []);

    // Act
    const act = () => catalog.task('ghost');

    // Assert
    expect(act).toThrow(
      expect.objectContaining({ code: ENTITY_NOT_FOUND_CODE, message: "Task with id 'ghost' not found" })
    );
  });

  it('should return a task chain with the task first and its root last', () => {
    // Arrange
    const root = aTask({ id: 'root' });
    const child = aTask({ id: 'child', parentTaskId: 'root' });
    const grand = aTask({ id: 'grand', parentTaskId: 'child' });
    const catalog = new Catalog([], [grand, root, child]);

    // Act
    const chain = catalog.chain('grand');

    // Assert
    expect(chain.map((task) => task.id)).toEqual(['grand', 'child', 'root']);
  });

  it('should return a single-element chain for a root task', () => {
    // Arrange
    const catalog = new Catalog([], [aTask({ id: 'root' })]);

    // Act
    const chain = catalog.chain('root');

    // Assert
    expect(chain.map((task) => task.id)).toEqual(['root']);
  });

  it('should treat a null parent as no parent', () => {
    // Arrange
    const task = aTask({ id: 'root', parentTaskId: null as unknown as string });
    const catalog = new Catalog([], [task]);

    // Act
    const chain = catalog.chain('root');

    // Assert
    expect(chain).toHaveLength(1);
  });

  it('should fail with a business violation when parent links form a cycle', () => {
    // Arrange
    const a = aTask({ id: 'a', parentTaskId: 'b' });
    const b = aTask({ id: 'b', parentTaskId: 'a' });
    const catalog = new Catalog([], [a, b]);

    // Act
    const act = () => catalog.chain('a');

    // Assert
    expect(act).toThrow(expect.objectContaining({ code: BUSINESS_VIOLATION_CODE }));
  });

  it('should fail with a not-found error when a parent link dangles', () => {
    // Arrange
    const orphan = aTask({ id: 'orphan', parentTaskId: 'missing' });
    const catalog = new Catalog([], [orphan]);

    // Act
    const act = () => catalog.chain('orphan');

    // Assert
    expect(act).toThrow(expect.objectContaining({ code: ENTITY_NOT_FOUND_CODE }));
  });

  it('should accept a chain as long as the number of tasks', () => {
    // Arrange
    const tasks = [
      aTask({ id: 't1' }),
      aTask({ id: 't2', parentTaskId: 't1' }),
      aTask({ id: 't3', parentTaskId: 't2' }),
    ];
    const catalog = new Catalog([], tasks);

    // Act
    const chain = catalog.chain('t3');

    // Assert
    expect(chain).toHaveLength(3);
  });
});
