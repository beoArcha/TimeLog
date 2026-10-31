import { TimerRepositoryState } from '@bindings/TimerRepositoryState';

export const CURRENT_LOCAL_STORAGE_SCHEMA_VERSION = 2;

export interface VersionedState extends TimerRepositoryState {
  schemaVersion?: number;
  _migrated?: boolean;
}

/**
 * Versioned migrator for active browser LocalStorage state.
 * Upgrades legacy state shapes while preserving existing records and unknown properties.
 */
export function migrateLocalStorageState(raw: unknown): VersionedState {
  if (!raw || typeof raw !== 'object') {
    return {
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
      schemaVersion: CURRENT_LOCAL_STORAGE_SCHEMA_VERSION,
    };
  }

  const state = { ...(raw as Record<string, unknown>) } as VersionedState;
  let didMigrate = false;
  const currentVersion = typeof state.schemaVersion === 'number' ? state.schemaVersion : 1;

  if (currentVersion < 2) {
    if (Array.isArray(state.projects)) {
      state.projects = state.projects.map((project) => {
        if (!project || typeof project !== 'object') return project;
        const p = project as Record<string, unknown>;
        return {
          ...p,
          hourlyRate: typeof p.hourlyRate === 'string' ? p.hourlyRate : null,
          currency: typeof p.currency === 'string' ? p.currency : null,
        };
      });
      didMigrate = true;
    }

    if (Array.isArray(state.tasks)) {
      state.tasks = state.tasks.map((task) => {
        if (!task || typeof task !== 'object') return task;
        const t = task as Record<string, unknown>;
        return {
          ...t,
          hourlyRate: typeof t.hourlyRate === 'string' ? t.hourlyRate : null,
        };
      });
      didMigrate = true;
    }

    state.schemaVersion = CURRENT_LOCAL_STORAGE_SCHEMA_VERSION;
    didMigrate = true;
  }

  if (didMigrate) {
    state._migrated = true;
  }

  return state;
}
