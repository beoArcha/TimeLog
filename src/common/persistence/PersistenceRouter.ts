import { isDesktopEnvironment } from '../utils/environment';
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
} from './IPersistence';
import { PersistenceCommands } from './PersistenceCommands';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { IRouter } from '../types/routing';

/**
 * Unified dispatch router for persistence operations.
 * Automatically delegates to Tauri IPC commands in desktop mode
 * or to the local in-memory persistence plugin in browser mode.
 */
export class PersistenceRouter implements IPersistence, IRouter<IPersistence> {
  private static instance: PersistenceRouter | null = null;
  private implementation: IPersistence;

  private constructor() {
    if (isDesktopEnvironment()) {
      this.implementation = new PersistenceCommands();
    } else {
      this.implementation = new PersistencePlugin();
    }
  }

  /** Returns the singleton router instance. */
  static getInstance(): PersistenceRouter {
    if (!PersistenceRouter.instance) {
      PersistenceRouter.instance = new PersistenceRouter();
    }
    return PersistenceRouter.instance;
  }

  /** Overrides the underlying persistence implementation for test suites. */
  setImplementationForTesting(implementation: IPersistence): void {
    this.implementation = implementation;
  }

  /** Resets the singleton router instance for test suite isolation. */
  static resetForTesting(): void {
    PersistenceRouter.instance = null;
  }

  get core(): ICorePersistence {
    return this.implementation.core;
  }

  get projects(): IProjectsPersistence {
    return this.implementation.projects;
  }

  get tasks(): ITasksPersistence {
    return this.implementation.tasks;
  }

  get settings(): ISettingsPersistence {
    return this.implementation.settings;
  }

  get runtimeConfigs(): IRuntimeConfigPersistence {
    return this.implementation.runtimeConfigs;
  }

  get timeLogs(): ITimeLogsPersistence {
    return this.implementation.timeLogs;
  }

  get holidays(): IHolidaysPersistence {
    return this.implementation.holidays;
  }

  get patches(): IPatchesPersistence {
    return this.implementation.patches;
  }

  get uiState(): IUiStatePersistence {
    return this.implementation.uiState;
  }

  get externalApi(): IExternalApiPersistence {
    return this.implementation.externalApi;
  }

  get locale(): ILocalePersistence {
    return this.implementation.locale;
  }

  get webhookQueue(): IWebhookQueuePersistence {
    return this.implementation.webhookQueue;
  }
}
