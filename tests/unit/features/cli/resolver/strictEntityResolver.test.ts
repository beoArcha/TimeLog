import { describe, it, expect } from 'vitest';
import { resolveEntity } from '@features/cli/resolver/entityResolver';

interface MockEntity {
  id: string;
  name: string;
}

describe('resolveEntity', () => {
  it('should return entity when given exact ID in strict mode', () => {
    // Arrange
    const entities: MockEntity[] = [
      { id: 'proj-12345678', name: 'Alpha Project' },
      { id: 'proj-87654321', name: 'Beta Project' },
    ];

    // Act
    const result = resolveEntity(
      entities,
      'proj-12345678',
      'Project',
      (e) => e.id,
      (e) => e.name,
      true
    );

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.entity?.id).toBe('proj-12345678');
  });

  it('should return entity when given hash-prefixed ID in strict mode', () => {
    // Arrange
    const entities: MockEntity[] = [
      { id: 'task-550e8400', name: 'Worker Thread' },
    ];

    // Act
    const result = resolveEntity(
      entities,
      '#task-550e8400',
      'Task',
      (e) => e.id,
      (e) => e.name,
      true
    );

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.entity?.id).toBe('task-550e8400');
  });

  it('should return entity when given unique 8+ character prefix in strict mode', () => {
    // Arrange
    const entities: MockEntity[] = [
      { id: 'task-abcdef123', name: 'Data Pipeline' },
      { id: 'task-999999999', name: 'Web Server' },
    ];

    // Act
    const result = resolveEntity(
      entities,
      'task-abc',
      'Task',
      (e) => e.id,
      (e) => e.name,
      true
    );

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.entity?.id).toBe('task-abcdef123');
  });

  it('should return not found when given 7-character prefix in strict mode', () => {
    // Arrange
    const entities: MockEntity[] = [
      { id: 'task-12345678', name: 'Deploy App' },
    ];

    // Act
    const result = resolveEntity(
      entities,
      'task-12',
      'Task',
      (e) => e.id,
      (e) => e.name,
      true
    );

    // Assert
    expect(result.exitCode).toBe(4);
    expect(result.errorCode).toBe('DOM_ENTITY_NOT_FOUND');
  });

  it('should return not found when given ID suffix in strict mode', () => {
    // Arrange
    const entities: MockEntity[] = [
      { id: 'task-12345678', name: 'Deploy App' },
    ];

    // Act
    const result = resolveEntity(
      entities,
      '345678',
      'Task',
      (e) => e.id,
      (e) => e.name,
      true
    );

    // Assert
    expect(result.exitCode).toBe(4);
    expect(result.errorCode).toBe('DOM_ENTITY_NOT_FOUND');
  });

  it('should return not found when given name fragment in strict mode', () => {
    // Arrange
    const entities: MockEntity[] = [
      { id: 'p1', name: 'Klient ACME' },
    ];

    // Act
    const result = resolveEntity(
      entities,
      'ACME',
      'Project',
      (e) => e.id,
      (e) => e.name,
      true
    );

    // Assert
    expect(result.exitCode).toBe(4);
    expect(result.errorCode).toBe('DOM_ENTITY_NOT_FOUND');
  });

  it('should return entity when given exact name in different case in strict mode', () => {
    // Arrange
    const entities: MockEntity[] = [
      { id: 'p1', name: 'Klient ACME' },
    ];

    // Act
    const result = resolveEntity(
      entities,
      'klient acme',
      'Project',
      (e) => e.id,
      (e) => e.name,
      true
    );

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.entity?.id).toBe('p1');
  });

  it('should return ambiguous error when given duplicate exact names in strict mode', () => {
    // Arrange
    const entities: MockEntity[] = [
      { id: 'p1', name: 'Project Matrix' },
      { id: 'p2', name: 'project matrix' },
    ];

    // Act
    const result = resolveEntity(
      entities,
      'PROJECT MATRIX',
      'Project',
      (e) => e.id,
      (e) => e.name,
      true
    );

    // Assert
    expect(result.exitCode).toBe(4);
    expect(result.errorCode).toBe('DOM_ENTITY_AMBIGUOUS');
  });

  it('should return ambiguous error when given ambiguous 8+ character prefix in strict mode', () => {
    // Arrange
    const entities: MockEntity[] = [
      { id: '550e8400-e29b-41d4-a716-111111111111', name: 'Task 1' },
      { id: '550e8400-e29b-41d4-a716-222222222222', name: 'Task 2' },
    ];

    // Act
    const result = resolveEntity(
      entities,
      '550e8400',
      'Task',
      (e) => e.id,
      (e) => e.name,
      true
    );

    // Assert
    expect(result.exitCode).toBe(4);
    expect(result.errorCode).toBe('DOM_ENTITY_AMBIGUOUS');
  });

  it('should resolve name fragment in human mode while failing in strict mode', () => {
    // Arrange
    const entities: MockEntity[] = [
      { id: 'p100', name: 'Klient ACME' },
    ];

    // Act
    const strictResult = resolveEntity(
      entities,
      'ACME',
      'Project',
      (e) => e.id,
      (e) => e.name,
      true
    );
    const humanResult = resolveEntity(
      entities,
      'ACME',
      'Project',
      (e) => e.id,
      (e) => e.name,
      false
    );

    // Assert
    expect(strictResult.exitCode).toBe(4);
    expect(strictResult.errorCode).toBe('DOM_ENTITY_NOT_FOUND');
    expect(humanResult.exitCode).toBe(0);
    expect(humanResult.entity?.id).toBe('p100');
  });
});
