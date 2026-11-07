import { ENGINE_ERROR_CODES, EngineErrorCode } from '@common/engine/IEngine';

const KNOWN_CODES = [
  ENGINE_ERROR_CODES.AUDIT_REASON_REQUIRED,
  ENGINE_ERROR_CODES.TIMELOG_INVALID_RANGE,
  ENGINE_ERROR_CODES.AUDIT_SOURCE_INVALID,
] as const;

function matchEngineErrorCode(text: string): EngineErrorCode | undefined {
  return KNOWN_CODES.find((code) => text.includes(code));
}

function extractCauseCode(cause: unknown): string | undefined {
  if (typeof cause !== 'object' || cause === null) {
    return undefined;
  }
  const code = (cause as Record<string, unknown>).code;
  return typeof code === 'string' ? code : undefined;
}

/**
 * Extracts a typed engine error code from an unknown error object, string, or exception.
 */
export function extractErrorCode(err: unknown): EngineErrorCode | string | undefined {
  if (!err) {
    return undefined;
  }

  if (typeof err === 'string') {
    return matchEngineErrorCode(err);
  }

  if (typeof err !== 'object' || err === null) {
    return undefined;
  }

  const errorObj = err as Record<string, unknown>;
  if (typeof errorObj.code === 'string') {
    return errorObj.code;
  }

  const causeCode = extractCauseCode(errorObj.cause);
  if (causeCode) {
    return causeCode;
  }

  if (typeof errorObj.message === 'string') {
    return matchEngineErrorCode(errorObj.message);
  }

  return undefined;
}
