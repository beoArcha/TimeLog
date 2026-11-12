import { EngineValidationException, EntityNotFoundException } from '@common/exceptions';
import { MAX_SAFE_AMOUNT_MINOR } from './constants';

/** Same strings as the Rust `EngineError::code()` for these variants. */
export const ENTITY_NOT_FOUND_CODE = 'DOM_ENTITY_NOT_FOUND';
export const INVALID_TIMESTAMP_CODE = 'DOM_INVALID_TIMESTAMP';
export const BUSINESS_VIOLATION_CODE = 'DOM_BUSINESS_VIOLATION';

export function entityNotFound(entity: string, id: string): EntityNotFoundException {
  return new EntityNotFoundException(`${entity} with id '${id}' not found`, ENTITY_NOT_FOUND_CODE);
}

export function invalidTimestamp(raw: string): EngineValidationException {
  return new EngineValidationException(`Parse time error: invalid timestamp '${raw}'`, undefined, INVALID_TIMESTAMP_CODE);
}

export function businessViolation(message: string): EngineValidationException {
  return new EngineValidationException(`Validation error: ${message}`, undefined, BUSINESS_VIOLATION_CODE);
}

export function amountOutOfRange(): EngineValidationException {
  return new EngineValidationException(
    `Billing amount exceeds the largest integer JavaScript represents exactly (${MAX_SAFE_AMOUNT_MINOR} minor units)`,
    undefined,
    BUSINESS_VIOLATION_CODE
  );
}
