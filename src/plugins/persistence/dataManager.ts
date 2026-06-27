import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';

// Definitions for the database state
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

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  loadState(): FullAppState | null {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as FullAppState;
    } catch (err) {
      console.warn('Failed parsing local LogTime by OxyFlow store', err);
      return null;
    }
  }

  saveState(state: FullAppState): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save state to localStorage', err);
    }
  }

  clearState(): void {
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
