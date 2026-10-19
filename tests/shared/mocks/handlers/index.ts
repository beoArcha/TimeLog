import { CORE_HANDLERS } from './core-handlers';
import { PROJECT_HANDLERS } from './project-handlers';
import { TASK_HANDLERS } from './task-handlers';
import { TIMER_HANDLERS } from './timer-handlers';
import { TIMELOG_HANDLERS } from './timelog-handlers';
import { SETTINGS_HANDLERS } from './settings-handlers';
import { AUXILIARY_HANDLERS } from './auxiliary-handlers';
import { WORKFLOW_HANDLERS } from './workflow-handlers';
import { MockCommandArgs } from '../types';

export * from './core-handlers';
export * from './project-handlers';
export * from './task-handlers';
export * from './timer-handlers';
export * from './timelog-handlers';
export * from './settings-handlers';
export * from './auxiliary-handlers';
export * from './workflow-handlers';

export const ALL_BACKEND_HANDLERS: Record<string, (args: MockCommandArgs) => Promise<unknown>> = {
  ...CORE_HANDLERS,
  ...PROJECT_HANDLERS,
  ...TASK_HANDLERS,
  ...TIMER_HANDLERS,
  ...TIMELOG_HANDLERS,
  ...SETTINGS_HANDLERS,
  ...AUXILIARY_HANDLERS,
  ...WORKFLOW_HANDLERS,
};
