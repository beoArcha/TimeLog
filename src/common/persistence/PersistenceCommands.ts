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
  ILocalePersistence
} from './IPersistence';
import {
  TauriCorePersistence,
  TauriProjectsPersistence,
  TauriTasksPersistence,
  TauriSettingsPersistence,
  TauriRuntimeConfigsPersistence,
  TauriTimeLogsPersistence,
  TauriHolidaysPersistence,
  TauriPatchesPersistence,
  TauriUiStatePersistence,
  TauriExternalApiPersistence,
  TauriLocalePersistence
} from './commands';

/**
 * Composition facade for Tauri IPC persistence commands.
 */
export class PersistenceCommands implements IPersistence {
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

  constructor(services?: Partial<IPersistence>) {
    this.core = services?.core ?? new TauriCorePersistence();
    this.projects = services?.projects ?? new TauriProjectsPersistence();
    this.tasks = services?.tasks ?? new TauriTasksPersistence();
    this.settings = services?.settings ?? new TauriSettingsPersistence();
    this.runtimeConfigs = services?.runtimeConfigs ?? new TauriRuntimeConfigsPersistence();
    this.timeLogs = services?.timeLogs ?? new TauriTimeLogsPersistence();
    this.holidays = services?.holidays ?? new TauriHolidaysPersistence();
    this.patches = services?.patches ?? new TauriPatchesPersistence();
    this.uiState = services?.uiState ?? new TauriUiStatePersistence();
    this.externalApi = services?.externalApi ?? new TauriExternalApiPersistence();
    this.locale = services?.locale ?? new TauriLocalePersistence();
  }
}
