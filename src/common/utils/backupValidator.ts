import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';
import { BackupValidationException } from '../exceptions';

export interface BackupPayload {
  version?: number;
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  holidays?: HolidayLeave[];
  patches?: PatchLog[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateProject(item: unknown, index: number): Project {
  if (!isPlainObject(item)) {
    throw new BackupValidationException(`Invalid project entry at index ${index}: expected an object`);
  }
  if (typeof item.id !== 'string' || item.id.trim() === '') {
    throw new BackupValidationException(`Invalid project entry at index ${index}: missing or empty 'id'`);
  }
  if (typeof item.name !== 'string' || item.name.trim() === '') {
    throw new BackupValidationException(`Invalid project entry at index ${index}: missing or empty 'name'`);
  }
  if (typeof item.color !== 'string' || item.color.trim() === '') {
    throw new BackupValidationException(`Invalid project entry at index ${index}: missing or empty 'color'`);
  }
  return item as unknown as Project;
}

function validateTask(item: unknown, index: number): Task {
  if (!isPlainObject(item)) {
    throw new BackupValidationException(`Invalid task entry at index ${index}: expected an object`);
  }
  if (typeof item.id !== 'string' || item.id.trim() === '') {
    throw new BackupValidationException(`Invalid task entry at index ${index}: missing or empty 'id'`);
  }
  if (typeof item.projectId !== 'string' || item.projectId.trim() === '') {
    throw new BackupValidationException(`Invalid task entry at index ${index}: missing or empty 'projectId'`);
  }
  if (typeof item.name !== 'string' || item.name.trim() === '') {
    throw new BackupValidationException(`Invalid task entry at index ${index}: missing or empty 'name'`);
  }
  return item as unknown as Task;
}

function validateTimeLog(item: unknown, index: number): TimeLog {
  if (!isPlainObject(item)) {
    throw new BackupValidationException(`Invalid log entry at index ${index}: expected an object`);
  }
  if (typeof item.id !== 'string' || item.id.trim() === '') {
    throw new BackupValidationException(`Invalid log entry at index ${index}: missing or empty 'id'`);
  }
  if (typeof item.taskId !== 'string' || item.taskId.trim() === '') {
    throw new BackupValidationException(`Invalid log entry at index ${index}: missing or empty 'taskId'`);
  }
  if (typeof item.startTime !== 'string' || item.startTime.trim() === '') {
    throw new BackupValidationException(`Invalid log entry at index ${index}: missing or empty 'startTime'`);
  }
  return item as unknown as TimeLog;
}

export function validateBackupPayload(raw: unknown): BackupPayload {
  if (!isPlainObject(raw)) {
    throw new BackupValidationException('Invalid backup payload: expected a JSON object at root level');
  }

  if (raw.version !== undefined && (typeof raw.version !== 'number' || raw.version < 1)) {
    throw new BackupValidationException('Invalid backup payload: version must be a positive number when provided');
  }

  if (!Array.isArray(raw.projects)) {
    throw new BackupValidationException("Invalid backup payload: 'projects' must be an array");
  }

  if (!Array.isArray(raw.tasks)) {
    throw new BackupValidationException("Invalid backup payload: 'tasks' must be an array");
  }

  if (!Array.isArray(raw.logs)) {
    throw new BackupValidationException("Invalid backup payload: 'logs' must be an array");
  }

  const projects = raw.projects.map((p, idx) => validateProject(p, idx));
  const tasks = raw.tasks.map((t, idx) => validateTask(t, idx));
  const logs = raw.logs.map((l, idx) => validateTimeLog(l, idx));

  let holidays: HolidayLeave[] | undefined;
  if (raw.holidays !== undefined) {
    if (!Array.isArray(raw.holidays)) {
      throw new BackupValidationException("Invalid backup payload: 'holidays' must be an array when provided");
    }
    holidays = raw.holidays as HolidayLeave[];
  }

  let patches: PatchLog[] | undefined;
  if (raw.patches !== undefined) {
    if (!Array.isArray(raw.patches)) {
      throw new BackupValidationException("Invalid backup payload: 'patches' must be an array when provided");
    }
    patches = raw.patches as PatchLog[];
  }

  return {
    version: typeof raw.version === 'number' ? raw.version : 1,
    projects,
    tasks,
    logs,
    holidays,
    patches,
  };
}
