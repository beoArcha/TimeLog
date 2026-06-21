import { RepositoryBackend, RepositorySource } from './RepositoryTypes';

export class RepositoryRegistry {
  private sources: RepositorySource[] = [
    { kind: 'localStorage', enabled: true, primary: true },
    { kind: 'sqlite', enabled: false, primary: false },
    { kind: 'remote', enabled: false, primary: false },
  ];

  getSources(): RepositorySource[] {
    return [...this.sources];
  }

  getPrimarySource(): RepositorySource {
    const primary = this.sources.find(s => s.primary);
    if (!primary) {
      throw new Error('No primary repository source configured');
    }
    return primary;
  }

  setPrimarySource(kind: RepositoryBackend): void {
    const target = this.sources.find(s => s.kind === kind);
    if (!target) {
      throw new Error(`Repository source of kind "${kind}" not registered`);
    }

    this.sources.forEach(s => {
      s.primary = s.kind === kind;
      if (s.primary) {
        s.enabled = true;
      }
    });
  }

  enableSource(kind: RepositoryBackend, enabled: boolean): void {
    const target = this.sources.find(s => s.kind === kind);
    if (!target) {
      throw new Error(`Repository source of kind "${kind}" not registered`);
    }
    if (target.primary && !enabled) {
      throw new Error('Cannot disable the primary repository source');
    }
    target.enabled = enabled;
  }
}
