import { MockCommandArgs } from '../types';
import { STORAGE_KEYS } from '@common/constants';
import { WorkflowConfig, WorkflowStatus, WorkflowCheckResult } from '@common/workflows/IWorkflow';
import { DEFAULT_WORKFLOW_CONFIG } from '@common/workflows/IWorkflow';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { PersistenceException } from '@common/exceptions/AppExceptions';

let mockDaemonRunning = false;
let mockLastCheckIso: string | undefined = undefined;
let mockLastAutoStopReason: string | undefined = undefined;
let mockLastAutoStopTimeIso: string | undefined = undefined;

export const resetMockWorkflowState = (): void => {
  mockDaemonRunning = false;
  mockLastCheckIso = undefined;
  mockLastAutoStopReason = undefined;
  mockLastAutoStopTimeIso = undefined;
};

export const WORKFLOW_HANDLERS: Record<string, (args: MockCommandArgs) => Promise<unknown>> = {
  workflow_get_config: async (): Promise<WorkflowConfig> => {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKFLOW_CONFIG);
    if (raw) {
      try {
        return { ...DEFAULT_WORKFLOW_CONFIG, ...JSON.parse(raw) };
      } catch (err) {
        ErrorHandler.handle(
          new PersistenceException(
            'Failed parsing mock workflow configuration, falling back to defaults',
            err,
            'WARN_MOCK_PARSE',
            'INFO'
          )
        );
      }
    }
    return { ...DEFAULT_WORKFLOW_CONFIG };
  },

  workflow_save_config: async (args: MockCommandArgs): Promise<void> => {
    if (args.config) {
      localStorage.setItem(STORAGE_KEYS.WORKFLOW_CONFIG, JSON.stringify(args.config));
    }
  },

  workflow_get_status: async (): Promise<WorkflowStatus> => {
    return {
      isDaemonRunning: mockDaemonRunning,
      lastCheckIso: mockLastCheckIso,
      lastAutoStopReason: mockLastAutoStopReason,
      lastAutoStopTimeIso: mockLastAutoStopTimeIso,
    };
  },

  workflow_check_rules: async (args: MockCommandArgs): Promise<WorkflowCheckResult> => {
    mockLastCheckIso = (args.nowIso as string) || new Date().toISOString();
    return {
      stopped: false,
      reason: undefined,
      warning: false,
    };
  },

  workflow_start_daemon: async (): Promise<void> => {
    mockDaemonRunning = true;
  },

  workflow_stop_daemon: async (): Promise<void> => {
    mockDaemonRunning = false;
  },
};
