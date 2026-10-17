import { MockCommandArgs, MockDatabaseState } from '../types';
import { getMockDbState, saveMockDbState, STATE_DB_KEY } from '../state';

export const resetDatabaseHandler = async (): Promise<MockDatabaseState> => {
  const rawState = localStorage.getItem(STATE_DB_KEY);
  let raw: Record<string, unknown> = {};
  if (rawState) {
    try {
      raw = JSON.parse(rawState) as Record<string, unknown>;
    } catch {
      // Ignore parsing error
    }
  }
  delete raw.projects;
  delete raw.tasks;
  delete raw.logs;
  delete raw.activeLog;
  localStorage.setItem(STATE_DB_KEY, JSON.stringify(raw));
  return { projects: [], tasks: [], logs: [], activeLog: null };
};

export const CORE_HANDLERS: Record<string, (args: MockCommandArgs) => Promise<unknown>> = {
  override_state: async (args) => {
    const state = getMockDbState();
    const newState = { ...state, ...args.state };
    saveMockDbState(newState);
    return newState;
  },
  get_timer_state: async () => {
    return getMockDbState();
  },
  get_state: async () => {
    return getMockDbState();
  },
  reset_database: resetDatabaseHandler,
  reset: resetDatabaseHandler,
};
