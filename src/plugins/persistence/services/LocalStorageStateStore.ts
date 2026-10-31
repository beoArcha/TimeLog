import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { STORAGE_KEYS, DOMAIN_STORAGE_KEYS, StorageDomain, StorageResetScope } from '@common/constants/storage-keys';

export const getDefaultState = (): TimerRepositoryState => ({
  projects: [],
  tasks: [],
  logs: [],
  activeLog: null,
});

export interface ILocalStorageStateStore {
  load(): Promise<TimerRepositoryState | null>;
  save(state: TimerRepositoryState): Promise<TimerRepositoryState>;
  reset(scope?: StorageResetScope | StorageDomain[]): Promise<TimerRepositoryState>;
  getStateOrDefault(): Promise<TimerRepositoryState>;
  runExclusive<T>(operation: () => Promise<T>): Promise<T>;
}

function resolveResetDomains(scope: StorageResetScope | StorageDomain[]): StorageDomain[] {
  if (scope === 'ALL') {
    return ['BUSINESS', 'SETTINGS', 'SYSTEM'];
  }
  if (Array.isArray(scope)) {
    return Array.from(new Set(scope));
  }
  return [scope];
}

export class LocalStorageStateStore implements ILocalStorageStateStore {
  private isCorrupted = false;
  private transactionQueue: Promise<unknown> = Promise.resolve();

  async runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.transactionQueue.then(operation, operation);
    this.transactionQueue = next.then(
      () => {},
      () => {}
    );
    return next;
  }

  async load(): Promise<TimerRepositoryState | null> {
    const data = localStorage.getItem(STORAGE_KEYS.STORAGE_KEY);
    if (!data) {
      const cleanState = getDefaultState();
      await this.save(cleanState);
      return cleanState;
    }

    try {
      return JSON.parse(data) as TimerRepositoryState;
    } catch (e) {
      this.isCorrupted = true;
      const exception = new PersistenceException(
        'Failed to parse persistence state from LocalStorage - storage quarantined to prevent data loss',
        e,
        'ERR_PERSISTENCE_PARSE'
      );
      ErrorHandler.handle(exception);
      throw exception;
    }
  }

  async save(state: TimerRepositoryState): Promise<TimerRepositoryState> {
    if (this.isCorrupted) {
      const exception = new PersistenceException(
        'Cannot save state while LocalStorage is in quarantined corrupted state',
        null,
        'ERR_PERSISTENCE_QUARANTINE'
      );
      ErrorHandler.handle(exception);
      throw exception;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, JSON.stringify(state));
      return state;
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException('Failed to save persistence state to LocalStorage', e, 'ERR_PERSISTENCE_SAVE')
      );
      throw e;
    }
  }

  async reset(scope: StorageResetScope | StorageDomain[] = 'ALL'): Promise<TimerRepositoryState> {
    const domains = resolveResetDomains(scope);
    const hasBusiness = domains.includes('BUSINESS');

    if (hasBusiness) {
      this.isCorrupted = false;
    }

    for (const domain of domains) {
      const keys = DOMAIN_STORAGE_KEYS[domain] || [];
      for (const key of keys) {
        localStorage.removeItem(key);
      }
    }

    if (hasBusiness) {
      return getDefaultState();
    }
    return this.getStateOrDefault();
  }

  async getStateOrDefault(): Promise<TimerRepositoryState> {
    const state = await this.load();
    return state || getDefaultState();
  }
}
