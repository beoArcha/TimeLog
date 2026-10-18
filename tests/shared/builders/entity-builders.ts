import type { Project } from '@bindings/Project';
import type { Task } from '@bindings/Task';
import type { TimeLog } from '@bindings/TimeLog';
import type { PatchLog } from '@bindings/PatchLog';
import type { HolidayLeave } from '@bindings/HolidayLeave';
import type { Settings } from '@bindings/Settings';

export const aProject = (overrides?: Partial<Project>): Project => ({
  id: 'p1',
  name: 'Default Test Project',
  color: 'indigo',
  createdAt: '2026-06-15T00:00:00Z',
  archived: false,
  description: undefined,
  icon: undefined,
  tags: undefined,
  ...overrides,
});

export const aTask = (overrides?: Partial<Task>): Task => ({
  id: 't1',
  projectId: 'p1',
  name: 'Default Test Task',
  completed: false,
  createdAt: '2026-06-15T00:00:00Z',
  status: undefined,
  parentTaskId: undefined,
  ...overrides,
});

export const aTimeLog = (overrides?: Partial<TimeLog>): TimeLog => ({
  id: 'l1',
  projectId: 'p1',
  taskId: 't1',
  startTime: '2026-06-15T12:00:00Z',
  endTime: '2026-06-15T13:00:00Z',
  note: undefined,
  editHistory: undefined,
  ...overrides,
});

export const aPatchLog = (overrides?: Partial<PatchLog>): PatchLog => ({
  id: 'pat_1',
  projectId: 'p1',
  taskId: 't1',
  startTime: '2026-06-15T10:00:00Z',
  endTime: '2026-06-15T11:00:00Z',
  patchNote: 'Test Patch Note',
  isSystemEvent: false,
  ...overrides,
});

export const aHolidayLeave = (overrides?: Partial<HolidayLeave>): HolidayLeave => ({
  id: 'hol_1',
  date: '2026-07-20',
  type: 'holiday',
  name: 'Test Holiday',
  ...overrides,
});

export const aSettings = (overrides?: Partial<Settings>): Settings => ({
  autoStart: false,
  includePatchesInReports: true,
  activeSinks: [],
  theme: 'system',
  textAndIconSize: 'medium',
  ...overrides,
});
