import { Task } from '@bindings/Task';
import { Project } from '@bindings/Project';
import { TimeLog } from '@bindings/TimeLog';
import { EngineValidationError } from '@common/exceptions';

export const MAX_NAME_LENGTH = 1000;
export const MAX_TAG_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 10000;

/**
 * Strips non-printable ASCII control characters (0-31 and 127).
 * If allowNewlinesAndTabs is true, keeps '\n', '\r', and '\t'.
 */
export function sanitizeText(val: string, allowNewlinesAndTabs = false): string {
  if (!val) return '';
  let result = '';
  for (let i = 0; i < val.length; i++) {
    const code = val.charCodeAt(i);
    if (code === 127) {
      continue;
    }
    if (code < 32) {
      if (allowNewlinesAndTabs && (code === 9 || code === 10 || code === 13)) {
        result += val[i];
      }
      continue;
    }
    result += val[i];
  }
  return result;
}

/**
 * Validates project name for non-emptiness, length boundary (<=1000 chars), and uniqueness.
 * Internal to EnginePlugin (Browser runtime).
 */
export function validateProjectName(
  name: string,
  existingProjects: Project[],
  excludeProjectId?: string
): void {
  if (typeof name !== 'string') {
    throw new EngineValidationError('Project name must be a string', undefined, 'ERR_ENGINE_VALIDATION');
  }

  const sanitized = sanitizeText(name);
  const trimmed = sanitized.trim();
  if (!trimmed) {
    throw new EngineValidationError('Project name cannot be empty', undefined, 'ERR_ENGINE_VALIDATION');
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new EngineValidationError(
      `Project name exceeds maximum length of ${MAX_NAME_LENGTH} characters`,
      undefined,
      'ERR_ENGINE_VALIDATION'
    );
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
 * Validates task name for non-emptiness and length boundary (<=1000 chars).
 * Internal to EnginePlugin (Browser runtime).
 */
export function validateTaskName(name: string): void {
  if (typeof name !== 'string') {
    throw new EngineValidationError('Task name must be a string', undefined, 'ERR_ENGINE_VALIDATION');
  }

  const sanitized = sanitizeText(name);
  const trimmed = sanitized.trim();
  if (!trimmed) {
    throw new EngineValidationError('Task name cannot be empty', undefined, 'ERR_ENGINE_VALIDATION');
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new EngineValidationError(
      `Task name exceeds maximum length of ${MAX_NAME_LENGTH} characters`,
      undefined,
      'ERR_ENGINE_VALIDATION'
    );
  }
}

/**
 * Validates tag string for non-emptiness and length boundary (<=100 chars).
 */
export function validateTag(tag: string): string {
  if (typeof tag !== 'string') {
    throw new EngineValidationError('Tag must be a string', undefined, 'ERR_ENGINE_VALIDATION');
  }
  const sanitized = sanitizeText(tag);
  const trimmed = sanitized.trim();
  if (!trimmed) {
    throw new EngineValidationError('Tag cannot be empty', undefined, 'ERR_ENGINE_VALIDATION');
  }
  if (trimmed.length > MAX_TAG_LENGTH) {
    throw new EngineValidationError(
      `Tag exceeds maximum length of ${MAX_TAG_LENGTH} characters`,
      undefined,
      'ERR_ENGINE_VALIDATION'
    );
  }
  return trimmed;
}

/**
 * Validates optional description/note for length boundary (<=10000 chars).
 */
export function validateDescription(desc: string | null | undefined): string | null {
  if (desc === null || desc === undefined) return null;
  if (typeof desc !== 'string') {
    throw new EngineValidationError('Description must be a string', undefined, 'ERR_ENGINE_VALIDATION');
  }
  const sanitized = sanitizeText(desc, true);
  const trimmed = sanitized.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    throw new EngineValidationError(
      `Description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters`,
      undefined,
      'ERR_ENGINE_VALIDATION'
    );
  }
  return trimmed;
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


