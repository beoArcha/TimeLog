import { ENGINE_ERROR_CODES, EngineErrorCode } from '@common/engine/IEngine';

/**
 * Extracts a typed engine error code from an unknown error object, string, or exception.
 */
export function extractErrorCode(err: unknown): EngineErrorCode | string | undefined {
  if (!err) return undefined;

  if (typeof err === 'string') {
    if (err.includes(ENGINE_ERROR_CODES.AUDIT_REASON_REQUIRED)) return ENGINE_ERROR_CODES.AUDIT_REASON_REQUIRED;
    if (err.includes(ENGINE_ERROR_CODES.TIMELOG_INVALID_RANGE)) return ENGINE_ERROR_CODES.TIMELOG_INVALID_RANGE;
    if (err.includes(ENGINE_ERROR_CODES.AUDIT_SOURCE_INVALID)) return ENGINE_ERROR_CODES.AUDIT_SOURCE_INVALID;
  }

  if (typeof err === 'object') {
    const errorObj = err as Record<string, unknown>;
    if (typeof errorObj.code === 'string') return errorObj.code;

    if (errorObj.cause && typeof errorObj.cause === 'object') {
      const causeObj = errorObj.cause as Record<string, unknown>;
      if (typeof causeObj.code === 'string') return causeObj.code;
    }

    if (typeof errorObj.message === 'string') {
      if (errorObj.message.includes(ENGINE_ERROR_CODES.AUDIT_REASON_REQUIRED)) {
        return ENGINE_ERROR_CODES.AUDIT_REASON_REQUIRED;
      }
      if (errorObj.message.includes(ENGINE_ERROR_CODES.TIMELOG_INVALID_RANGE)) {
        return ENGINE_ERROR_CODES.TIMELOG_INVALID_RANGE;
      }
      if (errorObj.message.includes(ENGINE_ERROR_CODES.AUDIT_SOURCE_INVALID)) {
        return ENGINE_ERROR_CODES.AUDIT_SOURCE_INVALID;
      }
    }
  }

  return undefined;
}
