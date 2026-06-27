import { describe, it, expect } from 'vitest';
import { RepositoryFactory } from '@plugins/persistence/RepositoryFactory';
import { LocalStorageTimerRepository } from '@plugins/persistence/localstorage/LocalStorageTimerRepository';
import { SqliteTimerRepository } from '@plugins/persistence/sqlite/SqliteTimerRepository';
import { RemoteTimerRepository } from '@plugins/persistence/remote/RemoteTimerRepository';

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
