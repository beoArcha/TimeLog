import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';

export const createDemoProjects = (): Project[] => [
  {
    id: 'sb_p1',
    name: 'Sandbox Demo Project',
    color: 'indigo',
    createdAt: '2026-06-15T08:00:00Z',
    archived: false,
    description: null,
    icon: null,
    tags: null,
  },
  {
    id: 'sb_p2',
    name: 'CLI Learning Workshop',
    color: 'emerald',
    createdAt: '2026-06-15T08:00:00Z',
    archived: false,
    description: null,
    icon: null,
    tags: null,
  },
];

export const createDemoTasks = (): Task[] => [
  {
    id: 'sb_t1',
    projectId: 'sb_p1',
    name: 'Explore CLI commands',
    completed: false,
    createdAt: '2026-06-15T08:00:00Z',
    status: null,
    parentTaskId: null,
  },
  {
    id: 'sb_t2',
    projectId: 'sb_p1',
    name: 'Simulate Timer Tracking',
    completed: false,
    createdAt: '2026-06-15T08:00:00Z',
    status: null,
    parentTaskId: null,
  },
  {
    id: 'sb_t3',
    projectId: 'sb_p2',
    name: 'Practice Task Renaming',
    completed: false,
    createdAt: '2026-06-15T08:00:00Z',
    status: null,
    parentTaskId: null,
  },
];

export const createDemoLogs = (): TimeLog[] => [
  {
    id: 'sb_l1',
    taskId: 'sb_t1',
    projectId: 'sb_p1',
    startTime: '2026-06-15T08:00:00Z',
    endTime: '2026-06-15T09:00:00Z',
    note: null,
    editHistory: null,
  },
];

export const createDemoHolidays = (): HolidayLeave[] => [
  {
    id: 'sb_hol1',
    date: '2026-07-04',
    type: 'holiday',
    name: 'Sandbox Independence Day',
  },
];
