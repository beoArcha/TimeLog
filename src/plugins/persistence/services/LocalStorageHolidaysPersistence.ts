import { IHolidaysPersistence } from '@common/persistence/IPersistence';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { STORAGE_KEYS } from '@common/constants/storage-keys';
import { DEFAULT_HOLIDAYS } from '../InitialData';

export class LocalStorageHolidaysPersistence implements IHolidaysPersistence {
  async getAll(): Promise<HolidayLeave[]> {
    const data = localStorage.getItem(STORAGE_KEYS.HOLIDAYS_KEY);
    if (!data) return DEFAULT_HOLIDAYS;
    try {
      return JSON.parse(data);
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException(
          'Failed to parse holidays from LocalStorage',
          e,
          'WARN_PERSISTENCE_HOLIDAYS_PARSE',
          'WARN'
        )
      );
      return DEFAULT_HOLIDAYS;
    }
  }

  async save(holidays: HolidayLeave[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.HOLIDAYS_KEY, JSON.stringify(holidays));
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException(
          'Failed to save holidays to LocalStorage',
          e,
          'ERR_PERSISTENCE_HOLIDAYS_SAVE'
        )
      );
      throw e;
    }
  }
}
