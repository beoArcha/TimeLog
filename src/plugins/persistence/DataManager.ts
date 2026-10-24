import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';
import { ErrorHandler, PersistenceException } from '@common/exceptions';

/**
 * In-memory snapshot of local database entities.
 */
export interface DatabaseState {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  holidays: HolidayLeave[];
  patches: PatchLog[];
}

export interface FullAppState extends DatabaseState {
  activeLog: TimeLog | null;
}

export interface IDataManager {
  loadState(): FullAppState | null;
  saveState(state: FullAppState): void;
  getNextId(items: { id: string }[], prefix?: string): string;
  clearState(): void;
}

export class LocalStorageDataManager implements IDataManager {
  private readonly storageKey: string;
  private isCorrupted = false;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  loadState(): FullAppState | null {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as FullAppState;
    } catch (err) {
      this.isCorrupted = true;
      const exception = new PersistenceException(
        'Failed parsing local LogTime by OxyFlow store - state quarantined to prevent data loss',
        err,
        'ERR_PERSISTENCE_CORRUPT'
      );
      ErrorHandler.handle(exception);
      throw exception;
    }
  }

  saveState(state: FullAppState): void {
    if (this.isCorrupted) {
      const exception = new PersistenceException(
        'Cannot write to LocalStorage while in corrupted quarantine state',
        null,
        'ERR_PERSISTENCE_QUARANTINE'
      );
      ErrorHandler.handle(exception);
      throw exception;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (err) {
      const exception = new PersistenceException('Failed to save state to localStorage', err, 'ERR_PERSISTENCE_SAVE');
      ErrorHandler.handle(exception);
      throw exception;
    }
  }

  clearState(): void {
    this.isCorrupted = false;
    localStorage.removeItem(this.storageKey);
  }

  static getNextId(items: { id: string }[], prefix: string = ''): string {
    let max = 0;
    for (const item of items) {
      const idStr = item.id;
      let numericPart = idStr;
      if (prefix && idStr.startsWith(prefix)) {
        numericPart = idStr.substring(prefix.length);
      } else if (!prefix) {
        const match = idStr.match(/\d+/);
        if (match) {
          numericPart = match[0];
        }
      }
      
      const num = parseInt(numericPart, 10);
      if (!isNaN(num) && num > max) {
        max = num;
      }
    }
    return `${prefix}${max + 1}`;
  }

  getNextId(items: { id: string }[], prefix: string = ''): string {
    return LocalStorageDataManager.getNextId(items, prefix);
  }
}
