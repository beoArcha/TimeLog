import { IHolidaysPersistence } from '@common/persistence/IPersistence';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { STORAGE_KEYS } from '@common/constants/storage-keys';
import { DEFAULT_HOLIDAYS } from '../InitialData';

export class LocalStorageHolidaysPersistence implements IHolidaysPersistence {
  async getAll(): Promise<HolidayLeave[]> {
    const data = localStorage.getItem(STORAGE_KEYS.HOLIDAYS_KEY);
    if (!data) return DEFAULT_HOLIDAYS;
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_HOLIDAYS;
    }
  }

  async save(holidays: HolidayLeave[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS_KEY, JSON.stringify(holidays));
  }
}
