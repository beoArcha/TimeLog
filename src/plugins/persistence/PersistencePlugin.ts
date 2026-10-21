import {
  IPersistence,
  ICorePersistence,
  IProjectsPersistence,
  ITasksPersistence,
  ISettingsPersistence,
  IRuntimeConfigPersistence,
  ITimeLogsPersistence,
  IHolidaysPersistence,
  IPatchesPersistence,
  IUiStatePersistence,
  IExternalApiPersistence,
  ILocalePersistence,
  IWebhookQueuePersistence
} from '@common/persistence/IPersistence';
import {
  ILocalStorageStateStore,
  LocalStorageStateStore,
  LocalStorageCorePersistence,
  LocalStorageProjectsPersistence,
  LocalStorageTasksPersistence,
  LocalStorageTimeLogsPersistence,
  LocalStorageSettingsPersistence,
  LocalStorageRuntimeConfigsPersistence,
  LocalStorageHolidaysPersistence,
  LocalStoragePatchesPersistence,
  LocalStorageUiStatePersistence,
  LocalStorageExternalApiPersistence,
  LocalStorageLocalePersistence,
  LocalStorageWebhookQueuePersistence
} from './services';

/**
 * Composition facade for browser LocalStorage persistence.
 */
export class PersistencePlugin implements IPersistence {
  public readonly core: ICorePersistence;
  public readonly projects: IProjectsPersistence;
  public readonly tasks: ITasksPersistence;
  public readonly settings: ISettingsPersistence;
  public readonly runtimeConfigs: IRuntimeConfigPersistence;
  public readonly timeLogs: ITimeLogsPersistence;
  public readonly holidays: IHolidaysPersistence;
  public readonly patches: IPatchesPersistence;
  public readonly uiState: IUiStatePersistence;
  public readonly externalApi: IExternalApiPersistence;
  public readonly locale: ILocalePersistence;
  public readonly webhookQueue: IWebhookQueuePersistence;

  constructor(services?: Partial<IPersistence>, customStore?: ILocalStorageStateStore) {
    const store = customStore ?? new LocalStorageStateStore();

    this.core = services?.core ?? new LocalStorageCorePersistence(store);
    this.projects = services?.projects ?? new LocalStorageProjectsPersistence(store);
    this.tasks = services?.tasks ?? new LocalStorageTasksPersistence(store);
    this.timeLogs = services?.timeLogs ?? new LocalStorageTimeLogsPersistence(store);
    this.settings = services?.settings ?? new LocalStorageSettingsPersistence();
    this.runtimeConfigs = services?.runtimeConfigs ?? new LocalStorageRuntimeConfigsPersistence();
    this.holidays = services?.holidays ?? new LocalStorageHolidaysPersistence();
    this.patches = services?.patches ?? new LocalStoragePatchesPersistence();
    this.uiState = services?.uiState ?? new LocalStorageUiStatePersistence();
    this.externalApi = services?.externalApi ?? new LocalStorageExternalApiPersistence();
    this.locale = services?.locale ?? new LocalStorageLocalePersistence();
    this.webhookQueue = services?.webhookQueue ?? new LocalStorageWebhookQueuePersistence();
  }
}
