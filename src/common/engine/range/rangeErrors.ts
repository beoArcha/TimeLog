import { EngineValidationException } from '@common/exceptions';

/** Same strings as the Rust `EngineError::code()` for these variants. */
export const INVALID_RANGE_INPUT_CODE = 'DOM_INVALID_RANGE_INPUT';
export const INVALID_TIMEZONE_CODE = 'DOM_INVALID_TIMEZONE';

export const MSG_PRESET_WITH_BOUNDS = 'preset cannot be combined with from/to';
export const MSG_UNPARSEABLE_BOUND = 'unrecognized date/time value';
export const MSG_EMPTY_BOUNDS = 'from must be earlier than to';
export const MSG_DATE_OUT_OF_RANGE = 'date is out of the supported range';
export const MSG_UNRESOLVABLE_LOCAL = 'local time cannot be resolved in the timezone';

export function invalidRangeInput(message: string): EngineValidationException {
  return new EngineValidationException(message, undefined, INVALID_RANGE_INPUT_CODE);
}

export function invalidTimezone(name: string): EngineValidationException {
  return new EngineValidationException(`invalid timezone: '${name}'`, undefined, INVALID_TIMEZONE_CODE);
}
