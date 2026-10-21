import { invoke } from '@tauri-apps/api/core';
import { IHolidaysPersistence } from '../IPersistence';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { ErrorHandler, TauriInteropException } from '../../exceptions';

export class TauriHolidaysPersistence implements IHolidaysPersistence {
  async getAll(): Promise<HolidayLeave[]> {
    try {
      return await invoke<HolidayLeave[]>('get_holidays');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get holidays via Tauri', err, 'ERR_TAURI_HOLIDAYS_GET'));
      throw err;
    }
  }

  async save(holidays: HolidayLeave[]): Promise<void> {
    try {
      await invoke('save_holidays', { holidays });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save holidays via Tauri', err, 'ERR_TAURI_HOLIDAYS_SAVE'));
      throw err;
    }
  }
}
