import { ICorePersistence } from '@common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { StorageDomain, StorageResetScope } from '@common/constants/storage-keys';
import { ILocalStorageStateStore } from './LocalStorageStateStore';

export class LocalStorageCorePersistence implements ICorePersistence {
  constructor(private readonly store: ILocalStorageStateStore) {}

  async load(): Promise<TimerRepositoryState | null> {
    return this.store.load();
  }

  async overrideState(state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
    const newState: TimerRepositoryState = { ...current, ...state };
    if (state.activeLog === undefined && newState.activeLog) {
      const activeStillExists = newState.logs.some((l) => l.id === newState.activeLog?.id);
      if (!activeStillExists) {
        newState.activeLog = newState.logs.find((l) => !l.endTime) || null;
      }
    }
    return this.store.save(newState);
  }

  async reset(scope?: StorageResetScope | StorageDomain[]): Promise<TimerRepositoryState> {
    return this.store.reset(scope);
  }
}
