export const ENGINE_ERROR_CODES = {
  AUDIT_REASON_REQUIRED: 'ERR_AUDIT_REASON_REQUIRED',
  AUDIT_SOURCE_INVALID: 'ERR_AUDIT_SOURCE_INVALID',
  TIMELOG_INVALID_RANGE: 'ERR_TIMELOG_INVALID_RANGE',
} as const;

export type EngineErrorCode = (typeof ENGINE_ERROR_CODES)[keyof typeof ENGINE_ERROR_CODES];

export function isEngineErrorCode(code: unknown): code is EngineErrorCode {
  return (
    typeof code === 'string' &&
    Object.values(ENGINE_ERROR_CODES).includes(code as EngineErrorCode)
  );
}
