import { ICorePersistence } from '@common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { ILocalStorageStateStore } from './LocalStorageStateStore';

export class LocalStorageCorePersistence implements ICorePersistence {
  constructor(private readonly store: ILocalStorageStateStore) {}

  async load(): Promise<TimerRepositoryState | null> {
    return this.store.load();
  }

  async overrideState(state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
    const newState: TimerRepositoryState = { ...current, ...state };
    return this.store.save(newState);
  }

  async reset(): Promise<TimerRepositoryState> {
    return this.store.reset();
  }
}
