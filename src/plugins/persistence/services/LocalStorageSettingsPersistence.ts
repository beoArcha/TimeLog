import { ISettingsPersistence } from '@common/persistence/IPersistence';
import { Settings } from '@bindings/Settings';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { STORAGE_KEYS } from '@common/constants/storage-keys';

const DEFAULT_SETTINGS: Settings = {
  autoStart: false,
  includePatchesInReports: true,
  activeSinks: ['Csv'],
  theme: 'system',
  textAndIconSize: 'medium',
  guiVariant: 'full',
  alwaysOnTopSmall: false,
  alwaysOnTopMain: false,
  minimizeToTray: true,
};

export class LocalStorageSettingsPersistence implements ISettingsPersistence {
  async get(): Promise<Settings> {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async save(settings: Settings): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException('Failed to save settings to LocalStorage', e, 'ERR_PERSISTENCE_SETTINGS_SAVE')
      );
      throw e;
    }
  }
}
