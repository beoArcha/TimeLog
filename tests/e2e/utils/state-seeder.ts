import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

export interface TimerRepositoryState {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  activeLog: TimeLog | null;
}

export function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id:
      overrides.id ||
      `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: overrides.name || "Default Test Project",
    color: overrides.color || "orange",
    createdAt: overrides.createdAt || new Date().toISOString(),
    archived: overrides.archived ?? false,
    description: overrides.description,
    icon: overrides.icon,
    tags: overrides.tags || [],
    ...overrides,
  };
}

export function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id:
      overrides.id ||
      `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    projectId: overrides.projectId || "default-proj",
    parentTaskId: overrides.parentTaskId,
    name: overrides.name || "Default Test Task",
    createdAt: overrides.createdAt || new Date().toISOString(),
    completed: overrides.completed ?? false,
    status: overrides.status || "Todo",
    ...overrides,
  };
}

export function createMockTimeLog(overrides: Partial<TimeLog> = {}): TimeLog {
  const start =
    overrides.startTime || new Date(Date.now() - 3600000).toISOString();
  return {
    id:
      overrides.id ||
      `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    taskId: overrides.taskId || "default-task",
    projectId: overrides.projectId || "default-proj",
    startTime: start,
    endTime: overrides.endTime,
    note: overrides.note,
    ...overrides,
  };
}

export function createDefaultState(
  overrides: Partial<TimerRepositoryState> = {},
): TimerRepositoryState {
  return {
    projects: overrides.projects || [],
    tasks: overrides.tasks || [],
    logs: overrides.logs || [],
    activeLog: overrides.activeLog ?? null,
  };
}
