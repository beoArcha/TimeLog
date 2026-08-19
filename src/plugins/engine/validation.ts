import { Task } from '@bindings/Task';
import { Project } from '@bindings/Project';
import { TimeLog } from '@bindings/TimeLog';
import { EngineValidationError } from '@common/exceptions';

/**
 * Validates project name for non-emptiness and uniqueness.
 * Internal to EnginePlugin (Browser runtime).
 */
export function validateProjectName(
  name: string,
  existingProjects: Project[],
  excludeProjectId?: string
): void {
  const trimmed = name?.trim();
  if (!trimmed) {
    throw new EngineValidationError('Project name cannot be empty', undefined, 'ERR_ENGINE_VALIDATION');
  }

  const duplicate = existingProjects.find(
    p => p.id !== excludeProjectId && p.name.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    throw new EngineValidationError(
      `Project with name "${trimmed}" already exists`,
      undefined,
      'ERR_ENGINE_DUPLICATE_NAME'
    );
  }
}

/**
 * Validates task name for non-emptiness.
 * Internal to EnginePlugin (Browser runtime).
 */
export function validateTaskName(name: string): void {
  const trimmed = name?.trim();
  if (!trimmed) {
    throw new EngineValidationError('Task name cannot be empty', undefined, 'ERR_ENGINE_VALIDATION');
  }
}

/**
 * Validates task hierarchy to prevent circular dependencies and excessive nesting (>1 level deep).
 * Internal to EnginePlugin (Browser runtime).
 */
export function validateTaskHierarchy(
  taskId: string | null | undefined,
  parentTaskId: string | null | undefined,
  tasks: Task[]
): void {
  if (!parentTaskId) {
    return;
  }

  if (taskId && taskId === parentTaskId) {
    throw new EngineValidationError(
      'Task cannot be its own parent',
      undefined,
      'ERR_ENGINE_CIRCULAR_HIERARCHY'
    );
  }

  const parent = tasks.find(t => t.id === parentTaskId);
  if (parent && parent.parentTaskId) {
    throw new EngineValidationError(
      'Cannot nest tasks more than one level deep',
      undefined,
      'ERR_ENGINE_VALIDATION'
    );
  }

  if (taskId) {
    const hasSubtasks = tasks.some(t => t.parentTaskId === taskId);
    if (hasSubtasks) {
      throw new EngineValidationError(
        'Cannot set a parent for a task that already has subtasks',
        undefined,
        'ERR_ENGINE_VALIDATION'
      );
    }
  }
}

/**
 * Validates time log timing and overlaps.
 * Internal to EnginePlugin (Browser runtime).
 */
export function validateTimeLog(
  logId: string | null | undefined,
  startTime: string,
  endTime: string | null | undefined,
  existingLogs: TimeLog[],
  nowMs: number = Date.now()
): void {
  const start = new Date(startTime).getTime();
  if (isNaN(start)) {
    throw new EngineValidationError('Parse time error: start_time is invalid', undefined, 'ERR_ENGINE_PARSE_TIME');
  }

  const end = endTime ? new Date(endTime).getTime() : nowMs;
  if (isNaN(end)) {
    throw new EngineValidationError('Parse time error: end_time is invalid', undefined, 'ERR_ENGINE_PARSE_TIME');
  }

  if (end < start) {
    throw new EngineValidationError('End time cannot be before start time', undefined, 'ERR_ENGINE_VALIDATION');
  }

  if (start > nowMs) {
    throw new EngineValidationError('Start time cannot be in the future', undefined, 'ERR_ENGINE_VALIDATION');
  }

  for (const log of existingLogs) {
    if (log.id === logId) {
      continue;
    }
    const logStart = new Date(log.startTime).getTime();
    const logEnd = log.endTime ? new Date(log.endTime).getTime() : nowMs;
    if (start < logEnd && logStart < end) {
      throw new EngineValidationError(
        `Time log overlaps with an existing log (ID: ${log.id})`,
        undefined,
        'ERR_ENGINE_OVERLAP'
      );
    }
  }
}


