import { describe, it, expect } from 'vitest';
import { RepositoryRegistry } from '../../../../src/plugins/data/RepositoryRegistry';

describe('Unit Tests: RepositoryRegistry', () => {
  it('should initialize with default sources, where localStorage is primary', () => {
    const registry = new RepositoryRegistry();
    const sources = registry.getSources();
    expect(sources).toHaveLength(3);

    const primary = registry.getPrimarySource();
    expect(primary.kind).toBe('localStorage');
    expect(primary.primary).toBe(true);
    expect(primary.enabled).toBe(true);
  });

  it('should allow changing the primary source and enable it automatically', () => {
    const registry = new RepositoryRegistry();
    registry.setPrimarySource('sqlite');

    const primary = registry.getPrimarySource();
    expect(primary.kind).toBe('sqlite');
    expect(primary.primary).toBe(true);
    expect(primary.enabled).toBe(true);

    const oldPrimary = registry.getSources().find(s => s.kind === 'localStorage');
    expect(oldPrimary?.primary).toBe(false);
  });

  it('should throw error when setting a non-registered backend as primary', () => {
    const registry = new RepositoryRegistry();
    expect(() => registry.setPrimarySource('invalid' as any)).toThrow();
  });

  it('should allow enabling/disabling non-primary sources', () => {
    const registry = new RepositoryRegistry();
    registry.enableSource('sqlite', true);
    expect(registry.getSources().find(s => s.kind === 'sqlite')?.enabled).toBe(true);

    registry.enableSource('sqlite', false);
    expect(registry.getSources().find(s => s.kind === 'sqlite')?.enabled).toBe(false);
  });

  it('should throw error when disabling primary source', () => {
    const registry = new RepositoryRegistry();
    expect(() => registry.enableSource('localStorage', false)).toThrow();
  });
});
