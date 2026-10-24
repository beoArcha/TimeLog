import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';

export const SANDBOX_STORAGE_KEY = 'oxy_cli_sandbox_state';

export interface SandboxPersistedState {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  holidays: HolidayLeave[];
  activeLog: TimeLog | null;
  selectedTaskId: string | null;
  nextIdCounter: number;
}

export const readPersistedSandboxState = (): SandboxPersistedState | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(SANDBOX_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SandboxPersistedState;
    if (Array.isArray(parsed.projects) && Array.isArray(parsed.tasks)) {
      return parsed;
    }
    return null;
  } catch (err) {
    ErrorHandler.handle(
      new PersistenceException('Failed reading sandbox emulator state from localStorage', err, 'WARN_SANDBOX_READ', 'WARN')
    );
    return null;
  }
};

export const savePersistedSandboxState = (state: SandboxPersistedState | null): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    if (state) {
      localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(SANDBOX_STORAGE_KEY);
    }
  } catch (err) {
    ErrorHandler.handle(
      new PersistenceException('Failed saving sandbox emulator state to localStorage', err, 'ERR_SANDBOX_SAVE')
    );
  }
};
