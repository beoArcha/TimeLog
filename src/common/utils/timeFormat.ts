/**
 * Presentation-layer timezone resolution and date-time formatting utilities.
 *
 * The core domain engine, SQLite database, and persistence layer operate strictly
 * on UTC ISO timestamps. Timezone transformations are confined entirely to the
 * presentation layer to ensure consistent data storage while honoring user display
 * preferences or operating system localization.
 */

import { ErrorHandler } from '@common/exceptions/ErrorHandler';

export const DEFAULT_TIMEZONE = 'System';
export const FALLBACK_TIMEZONE = 'UTC';

/**
 * Standard list of globally recognized IANA timezones used as a deterministic fallback
 * when runtime reflection is unavailable in restricted or older webview environments.
 */
export const POPULAR_TIMEZONES = [
  'UTC', 'Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'Europe/Kyiv', 'Europe/Amsterdam', 'Europe/Rome', 'America/New_York',
  'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney',
] as const;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

/**
 * Clears the internal Intl.DateTimeFormat formatter cache.
 * Primarily intended for testing environments.
 */
export function clearDateTimeFormatCache(): void {
  formatterCache.clear();
}

/**
 * Validates whether a given timezone string conforms to a valid IANA identifier
 * recognized by the JavaScript Intl runtime.
 *
 * @param tz - IANA timezone identifier to test (e.g. "Europe/Warsaw")
 * @returns True if the timezone is supported and syntactically valid; otherwise false
 */
function isValidTimezoneInternal(tz: string): boolean {
  if (!tz || typeof tz !== 'string') {
    return false;
  }
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (err) {
    if (err instanceof RangeError) {
      return false;
    }
    throw err;
  }
}

/**
 * Validates whether a given timezone string conforms to a valid IANA identifier
 * recognized by the JavaScript Intl runtime.
 *
 * @param tz - IANA timezone identifier to test (e.g. "Europe/Warsaw")
 * @returns True if the timezone is supported and syntactically valid; otherwise false
 */
export function isValidTimezone(tz: string): boolean {
  try {
    return isValidTimezoneInternal(tz);
  } catch (err) {
    ErrorHandler.handle(err);
    throw err;
  }
}

function resolveSystemTimezoneInternal(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && isValidTimezoneInternal(tz)) {
      return tz;
    }
  } catch (err) {
    if (err instanceof RangeError) {
      return FALLBACK_TIMEZONE;
    }
    throw err;
  }
  return FALLBACK_TIMEZONE;
}

/**
 * Resolves the host system's active timezone using Intl.DateTimeFormat.
 * Falls back deterministically to UTC when the host runtime environment omits
 * or invalidates the system timezone string.
 *
 * @returns The resolved host timezone identifier or FALLBACK_TIMEZONE ("UTC")
 */
export function resolveSystemTimezone(): string {
  try {
    return resolveSystemTimezoneInternal();
  } catch (err) {
    ErrorHandler.handle(err);
    throw err;
  }
}

function resolveEffectiveTimezoneInternal(tzPreference?: string | null): string {
  try {
    if (!tzPreference || tzPreference === DEFAULT_TIMEZONE || tzPreference.toLowerCase() === 'system') {
      return resolveSystemTimezoneInternal();
    }
    if (isValidTimezoneInternal(tzPreference)) {
      return tzPreference;
    }
    return resolveSystemTimezoneInternal();
  } catch (err) {
    if (err instanceof RangeError) {
      return resolveSystemTimezoneInternal();
    }
    throw err;
  }
}

/**
 * Resolves the effective presentation timezone by evaluating user preference against
 * system capabilities. Setting "System" delegates resolution to the host operating system.
 *
 * @param tzPreference - Optional user-configured timezone identifier or 'System'
 * @returns Validated IANA timezone identifier ready for presentation formatting
 */
export function resolveEffectiveTimezone(tzPreference?: string | null): string {
  try {
    return resolveEffectiveTimezoneInternal(tzPreference);
  } catch (err) {
    ErrorHandler.handle(err);
    throw err;
  }
}

/**
 * Retrieves the complete set of supported IANA timezones supported by the runtime.
 * Older webviews or embedded Chromium engines may lack Intl.supportedValuesOf, in which
 * case POPULAR_TIMEZONES is supplied as a deterministic fallback list.
 *
 * @returns Array of unique supported timezone strings
 */
export function getSupportedTimezones(): string[] {
  if (typeof Intl.supportedValuesOf === 'function') {
    try {
      const supported = Intl.supportedValuesOf('timeZone');
      return Array.from(new Set(['UTC', ...supported]));
    } catch (err) {
      if (err instanceof RangeError) {
        return [...POPULAR_TIMEZONES];
      }
      ErrorHandler.handle(err);
      throw err;
    }
  }
  return [...POPULAR_TIMEZONES];
}

function parseInputDate(input: Date | string | number): Date | null {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/**
 * Constructs an Intl.DateTimeFormat instance with layered fallbacks for unsupported locales,
 * invalid timezones, or constrained runtime environments.
 *
 * @param locale - Requested BCP 47 locale tag
 * @param options - Formatting options
 * @returns A guaranteed valid Intl.DateTimeFormat instance
 */
export function getSafeDateTimeFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  const targetTimezone = options.timeZone ? resolveEffectiveTimezone(options.timeZone) : resolveEffectiveTimezone();
  const normalizedOptions: Intl.DateTimeFormatOptions = {
    ...options,
    timeZone: targetTimezone,
  };

  // 1. Try requested locale with target timezone
  try {
    return new Intl.DateTimeFormat(locale, normalizedOptions);
  } catch (err) {
    if (!(err instanceof RangeError)) {
      ErrorHandler.handle(err);
      throw err;
    }
  }

  // 2. Try fallback 'en' locale with target timezone
  try {
    return new Intl.DateTimeFormat('en', normalizedOptions);
  } catch (err) {
    if (!(err instanceof RangeError)) {
      ErrorHandler.handle(err);
      throw err;
    }
  }

  // 3. Try requested locale with UTC timezone
  try {
    return new Intl.DateTimeFormat(locale, { ...normalizedOptions, timeZone: FALLBACK_TIMEZONE });
  } catch (err) {
    if (!(err instanceof RangeError)) {
      ErrorHandler.handle(err);
      throw err;
    }
  }

  // 4. Try 'en' with UTC timezone
  try {
    return new Intl.DateTimeFormat('en', { ...normalizedOptions, timeZone: FALLBACK_TIMEZONE });
  } catch (err) {
    if (!(err instanceof RangeError)) {
      ErrorHandler.handle(err);
      throw err;
    }
  }

  // 5. Ultimate fallback without custom options
  try {
    return new Intl.DateTimeFormat('en', { timeZone: FALLBACK_TIMEZONE });
  } catch (err) {
    ErrorHandler.handle(err);
    throw err;
  }
}

function getCachedDateTimeFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  const cacheKey = `${locale}:${JSON.stringify(options)}`;
  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    formatter = getSafeDateTimeFormat(locale, options);
    formatterCache.set(cacheKey, formatter);
  }
  return formatter;
}

/**
 * Formats an input date or timestamp into a full localized date and 24-hour time string
 * within the resolved target presentation timezone.
 *
 * @param input - Date object, ISO timestamp string, or Unix epoch millisecond count
 * @param timezone - Optional target timezone identifier (defaults to resolved system timezone)
 * @param locale - BCP-47 language tag (defaults to 'en')
 * @param options - Additional Intl.DateTimeFormatOptions overrides
 * @returns Formatted date-time string, or empty string if input date is invalid
 */
export function formatDateTime(
  input: Date | string | number,
  timezone?: string,
  locale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseInputDate(input);
  if (!date) {
    return '';
  }

  const effectiveTimezone = resolveEffectiveTimezone(timezone);
  const intlOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options,
    timeZone: effectiveTimezone,
  };

  const formatter = getCachedDateTimeFormat(locale, intlOptions);
  try {
    return formatter.format(date);
  } catch (err) {
    if (err instanceof RangeError) {
      const fallbackFormatter = getSafeDateTimeFormat('en', {
        ...intlOptions,
        timeZone: FALLBACK_TIMEZONE,
      });
      return fallbackFormatter.format(date);
    }
    ErrorHandler.handle(err);
    throw err;
  }
}

/**
 * Formats an input date or timestamp into a localized date string (year, month, day)
 * within the resolved target presentation timezone.
 *
 * @param input - Date object, ISO timestamp string, or Unix epoch millisecond count
 * @param timezone - Optional target timezone identifier (defaults to resolved system timezone)
 * @param locale - BCP-47 language tag (defaults to 'en')
 * @param options - Additional Intl.DateTimeFormatOptions overrides
 * @returns Formatted date string, or empty string if input date is invalid
 */
export function formatDate(
  input: Date | string | number,
  timezone?: string,
  locale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseInputDate(input);
  if (!date) {
    return '';
  }

  const effectiveTimezone = resolveEffectiveTimezone(timezone);
  const intlOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
    timeZone: effectiveTimezone,
  };

  const formatter = getCachedDateTimeFormat(locale, intlOptions);
  try {
    return formatter.format(date);
  } catch (err) {
    if (err instanceof RangeError) {
      const fallbackFormatter = getSafeDateTimeFormat('en', {
        ...intlOptions,
        timeZone: FALLBACK_TIMEZONE,
      });
      return fallbackFormatter.format(date);
    }
    ErrorHandler.handle(err);
    throw err;
  }
}

/**
 * Formats an input date or timestamp into a localized 24-hour time string (hour, minute, second)
 * within the resolved target presentation timezone.
 *
 * @param input - Date object, ISO timestamp string, or Unix epoch millisecond count
 * @param timezone - Optional target timezone identifier (defaults to resolved system timezone)
 * @param locale - BCP-47 language tag (defaults to 'en')
 * @param options - Additional Intl.DateTimeFormatOptions overrides
 * @returns Formatted time string, or empty string if input date is invalid
 */
export function formatTime(
  input: Date | string | number,
  timezone?: string,
  locale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseInputDate(input);
  if (!date) {
    return '';
  }

  const effectiveTimezone = resolveEffectiveTimezone(timezone);
  const intlOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options,
    timeZone: effectiveTimezone,
  };

  const formatter = getCachedDateTimeFormat(locale, intlOptions);
  try {
    return formatter.format(date);
  } catch (err) {
    if (err instanceof RangeError) {
      const fallbackFormatter = getSafeDateTimeFormat('en', {
        ...intlOptions,
        timeZone: FALLBACK_TIMEZONE,
      });
      return fallbackFormatter.format(date);
    }
    ErrorHandler.handle(err);
    throw err;
  }
}

/**
 * Formats an input date or timestamp into a normalized standard 'YYYY-MM-DD HH:mm:ss' string
 * representing the date and time in the specified timezone.
 * Primarily intended for form input presentation in timezone-aware modals.
 *
 * @param input - Date object, ISO timestamp string, Unix epoch millisecond count, or null/undefined
 * @param timezone - Optional target timezone identifier (defaults to resolved system timezone)
 * @returns Normalized 'YYYY-MM-DD HH:mm:ss' string, or empty string if input is null or invalid
 */
export function formatDateTimeInTimezone(
  input: Date | string | number | null | undefined,
  timezone?: string
): string {
  if (input === null || input === undefined || input === '') {
    return '';
  }
  const date = parseInputDate(input);
  if (!date) {
    return '';
  }

  const effectiveTimezone = resolveEffectiveTimezone(timezone);
  try {
    const formatter = getSafeDateTimeFormat('en-US', {
      timeZone: effectiveTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }
    let hour = map.hour || '00';
    if (hour === '24') {
      hour = '00';
    }
    return `${map.year}-${map.month}-${map.day} ${hour}:${map.minute}:${map.second}`;
  } catch (err) {
    ErrorHandler.handle(err);
    throw err;
  }
}

/**
 * Parses a date-time string in a specified timezone (e.g. 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DDTHH:mm:ss')
 * into a UTC JavaScript Date object. Also accepts explicit ISO 8601 strings with a UTC 'Z' or offset indicator.
 * Performs rigorous calendar validation (e.g. leap years, valid day and month counts).
 *
 * @param input - Form input string containing date and time
 * @param timezone - Target timezone to interpret local date-time strings within
 * @returns JavaScript Date representing the exact UTC moment, or null if invalid or malformed
 */
export function parseDateTimeInTimezone(
  input: string,
  timezone?: string
): Date | null {
  if (!input || typeof input !== 'string') {
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // If input contains an explicit UTC or timezone offset, parse directly
  const hasExplicitOffset = /[zZ]|[+-]\d{2}(?::?\d{2})?$/.test(trimmed);
  if (hasExplicitOffset) {
    const directDate = new Date(trimmed);
    if (!isNaN(directDate.getTime())) {
      return directDate;
    }
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = match[6] ? parseInt(match[6], 10) : 0;

  if (
    month < 1 || month > 12 ||
    day < 1 || day > 31 ||
    hour < 0 || hour > 23 ||
    minute < 0 || minute > 59 ||
    second < 0 || second > 59
  ) {
    return null;
  }

  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day
  ) {
    return null;
  }

  const effectiveTimezone = resolveEffectiveTimezone(timezone);
  const targetLocalMs = Date.UTC(year, month - 1, day, hour, minute, second);
  let utcMs = targetLocalMs;

  const dtf = getSafeDateTimeFormat('en-US', {
    timeZone: effectiveTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  for (let i = 0; i < 4; i++) {
    const parts = dtf.formatToParts(new Date(utcMs));
    const p: Record<string, string> = {};
    for (const part of parts) {
      p[part.type] = part.value;
    }
    let h = parseInt(p.hour, 10);
    if (h === 24) {
      h = 0;
    }
    const localMs = Date.UTC(
      parseInt(p.year, 10),
      parseInt(p.month, 10) - 1,
      parseInt(p.day, 10),
      h,
      parseInt(p.minute, 10),
      parseInt(p.second, 10)
    );
    const diff = targetLocalMs - localMs;
    if (diff === 0) {
      break;
    }
    utcMs += diff;
  }

  return new Date(utcMs);
}

