import { describe, it, expect } from 'vitest';
import { RepositoryFactory } from '../../../../src/core/repository/RepositoryFactory';
import { LocalStorageTimerRepository } from '../../../../src/core/repository/adapters/LocalStorageTimerRepository';
import { SqliteTimerRepository } from '../../../../src/core/repository/adapters/SqliteTimerRepository';
import { RemoteTimerRepository } from '../../../../src/core/repository/adapters/RemoteTimerRepository';

describe('Unit Tests: RepositoryFactory', () => {
  it('should create LocalStorageTimerRepository', () => {
    const repo = RepositoryFactory.create('localStorage');
    expect(repo).toBeInstanceOf(LocalStorageTimerRepository);
  });

  it('should create SqliteTimerRepository', () => {
    const repo = RepositoryFactory.create('sqlite');
    expect(repo).toBeInstanceOf(SqliteTimerRepository);
  });

  it('should create RemoteTimerRepository', () => {
    const repo = RepositoryFactory.create('remote');
    expect(repo).toBeInstanceOf(RemoteTimerRepository);
  });

  it('should throw error for unknown backend', () => {
    expect(() => RepositoryFactory.create('invalid' as any)).toThrow();
  });
});
