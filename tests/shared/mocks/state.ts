import { STORAGE_KEYS } from '@common/constants';
import { MockDatabaseState } from './types';

export const STATE_DB_KEY = STORAGE_KEYS.STATE_DB;

export const getMockDbState = (): MockDatabaseState => {
  const rawState = localStorage.getItem(STATE_DB_KEY);
  let state: Partial<MockDatabaseState> | null = null;
  if (rawState) {
    try {
      state = JSON.parse(rawState) as Partial<MockDatabaseState>;
    } catch {
      // Ignore parsing error
    }
  }

  return {
    projects: state?.projects ?? [],
    tasks: state?.tasks ?? [],
    logs: state?.logs ?? [],
    activeLog: state?.activeLog ?? null,
    activeLogs: state?.activeLogs ?? (state?.activeLog ? [state.activeLog] : []),
  };
};

export const saveMockDbState = (state: MockDatabaseState): void => {
  localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
};
