/**
 * Presentation-layer timezone resolution and date-time formatting utilities.
 *
 * The core domain engine, SQLite database, and persistence layer operate strictly
 * on UTC ISO timestamps. Timezone transformations are confined entirely to the
 * presentation layer to ensure consistent data storage while honoring user display
 * preferences or operating system localization.
 */

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
export function isValidTimezone(tz: string): boolean {
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
 * Resolves the host system's active timezone using Intl.DateTimeFormat.
 * Falls back deterministically to UTC when the host runtime environment omits
 * or invalidates the system timezone string.
 *
 * @returns The resolved host timezone identifier or FALLBACK_TIMEZONE ("UTC")
 */
export function resolveSystemTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && isValidTimezone(tz)) {
      return tz;
    }
  } catch (err) {
    if (err instanceof RangeError || err instanceof TypeError) {
      return FALLBACK_TIMEZONE;
    }
    throw err;
  }
  return FALLBACK_TIMEZONE;
}

/**
 * Resolves the effective presentation timezone by evaluating user preference against
 * system capabilities. Setting "System" delegates resolution to the host operating system.
 *
 * @param tzPreference - Optional user-configured timezone identifier or 'System'
 * @returns Validated IANA timezone identifier ready for presentation formatting
 */
export function resolveEffectiveTimezone(tzPreference?: string | null): string {
  if (!tzPreference || tzPreference === DEFAULT_TIMEZONE || tzPreference.toLowerCase() === 'system') {
    return resolveSystemTimezone();
  }
  if (isValidTimezone(tzPreference)) {
    return tzPreference;
  }
  return resolveSystemTimezone();
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
      if (err instanceof RangeError || err instanceof TypeError) {
        return [...POPULAR_TIMEZONES];
      }
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
      throw err;
    }
  }

  // 2. Try fallback 'en' locale with target timezone
  try {
    return new Intl.DateTimeFormat('en', normalizedOptions);
  } catch (err) {
    if (!(err instanceof RangeError)) {
      throw err;
    }
  }

  // 3. Try requested locale with UTC timezone
  try {
    return new Intl.DateTimeFormat(locale, { ...normalizedOptions, timeZone: FALLBACK_TIMEZONE });
  } catch (err) {
    if (!(err instanceof RangeError)) {
      throw err;
    }
  }

  // 4. Try 'en' with UTC timezone
  try {
    return new Intl.DateTimeFormat('en', { ...normalizedOptions, timeZone: FALLBACK_TIMEZONE });
  } catch (err) {
    if (!(err instanceof RangeError)) {
      throw err;
    }
  }

  // 5. Ultimate fallback without custom options
  return new Intl.DateTimeFormat('en', { timeZone: FALLBACK_TIMEZONE });
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
    throw err;
  }
}
