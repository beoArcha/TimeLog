import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { STORAGE_KEYS } from '@common/constants/storage-keys';
import { INIT_PROJECTS, INIT_TASKS, INIT_LOGS, DEFAULT_HOLIDAYS } from '../InitialData';

export const getDefaultState = (): TimerRepositoryState => ({
  projects: [],
  tasks: [],
  logs: [],
  activeLog: null,
});

export interface ILocalStorageStateStore {
  load(): Promise<TimerRepositoryState | null>;
  save(state: TimerRepositoryState): Promise<TimerRepositoryState>;
  reset(): Promise<TimerRepositoryState>;
  getStateOrDefault(): Promise<TimerRepositoryState>;
}

export class LocalStorageStateStore implements ILocalStorageStateStore {
  private isCorrupted = false;

  async load(): Promise<TimerRepositoryState | null> {
    const data = localStorage.getItem(STORAGE_KEYS.STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.HOLIDAYS_KEY, JSON.stringify(DEFAULT_HOLIDAYS));
      const seedState: TimerRepositoryState = {
        projects: INIT_PROJECTS,
        tasks: INIT_TASKS,
        logs: INIT_LOGS,
        activeLog: null,
      };
      await this.save(seedState);
      return seedState;
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

  async reset(): Promise<TimerRepositoryState> {
    this.isCorrupted = false;
    localStorage.removeItem(STORAGE_KEYS.STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS_KEY);
    localStorage.removeItem(STORAGE_KEYS.RUN_CONFIGS_KEY);
    localStorage.removeItem(STORAGE_KEYS.HOLIDAYS_KEY);
    return getDefaultState();
  }

  async getStateOrDefault(): Promise<TimerRepositoryState> {
    const state = await this.load();
    return state || getDefaultState();
  }
}
