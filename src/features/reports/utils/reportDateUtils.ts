import { resolveSystemLocale } from '@common/i18n/locales';
import type { Locale } from '@bindings/Locale';

/** Matches strictly YYYY-MM-DD format */
const CALENDAR_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Matches strictly ISO 8601 calendar datetime strings with optional millisecond precision
 * and optional UTC or timezone offset.
 * Examples: 2026-06-15T12:00:00Z, 2026-06-15T12:00:00.123+02:00, 2026-06-15T12:00:00
 */
const ISO_DATETIME_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(?:Z|([+-]\d{2}:?\d{2}))?$/i;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

/**
 * Normalizes an application locale (which can include 'system' or 'custom')
 * into a valid BCP 47 language tag accepted by Intl.DateTimeFormat.
 * Validates the candidate tag against Intl.DateTimeFormat and safely falls back
 * to 'en' when an invalid, malformed, or unsupported locale tag is encountered.
 * Non-RangeError exceptions are re-thrown to avoid masking unexpected issues.
 */
export function resolveDateTimeLocale(locale?: string): string {
  if (!locale || locale === 'system') {
    return resolveSystemLocale();
  }
  if (locale === 'custom') {
    return 'en';
  }

  const trimmed = locale.trim();
  if (!trimmed) {
    return 'en';
  }

  try {
    const supported = Intl.DateTimeFormat.supportedLocalesOf(trimmed);
    if (supported.length > 0) {
      return trimmed;
    }
    return 'en';
  } catch (err) {
    if (err instanceof RangeError) {
      return 'en';
    }
    throw err;
  }
}

/**
 * Parses a dateKey (such as 'YYYY-MM-DD' or strict ISO timestamp) into a JavaScript Date
 * strictly anchored at 00:00:00.000 UTC on that calendar day.
 * Performs calendar validation (days, months, leap years) and accounts for timezone
 * offsets so the resulting date accurately reflects the UTC calendar day.
 * Returns null if the input is malformed, invalid, or impossible on the calendar.
 */
export function parseUtcCalendarDate(dateKey: string | Date): Date | null {
  if (dateKey instanceof Date) {
    if (isNaN(dateKey.getTime())) {
      return null;
    }
    return new Date(
      Date.UTC(
        dateKey.getUTCFullYear(),
        dateKey.getUTCMonth(),
        dateKey.getUTCDate()
      )
    );
  }

  if (typeof dateKey !== 'string') {
    return null;
  }

  const trimmed = dateKey.trim();

  // Pattern 1: Pure calendar date (YYYY-MM-DD)
  const dateMatch = CALENDAR_DATE_REGEX.exec(trimmed);
  if (dateMatch) {
    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    const day = parseInt(dateMatch[3], 10);

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return parsed;
    }
    return null;
  }

  // Pattern 2: Full ISO 8601 datetime (e.g. 2026-06-15T10:00:00Z or 2026-06-15T01:00:00+04:00)
  const dateTimeMatch = ISO_DATETIME_REGEX.exec(trimmed);
  if (dateTimeMatch) {
    const year = parseInt(dateTimeMatch[1], 10);
    const month = parseInt(dateTimeMatch[2], 10);
    const day = parseInt(dateTimeMatch[3], 10);
    const hour = parseInt(dateTimeMatch[4], 10);
    const minute = parseInt(dateTimeMatch[5], 10);
    const second = parseInt(dateTimeMatch[6], 10);

    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59 ||
      second < 0 ||
      second > 59
    ) {
      return null;
    }

    // Calendar check on date component (catches Feb 31, non-leap Feb 29, etc.)
    const calendarCheck = new Date(Date.UTC(year, month - 1, day));
    if (
      calendarCheck.getUTCFullYear() !== year ||
      calendarCheck.getUTCMonth() !== month - 1 ||
      calendarCheck.getUTCDate() !== day
    ) {
      return null;
    }

    // Parse timestamp to respect timezone offsets and midnight shifts
    const hasTimezone = /[zZ]|[+-]\d{2}(?::?\d{2})?$/.test(trimmed);
    const isoString = hasTimezone ? trimmed : `${trimmed}Z`;
    const timestamp = Date.parse(isoString);
    if (isNaN(timestamp)) {
      return null;
    }

    const d = new Date(timestamp);
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    );
  }

  return null;
}

/**
 * Extracts a normalized 'YYYY-MM-DD' calendar date key in UTC from an ISO date string
 * or Date object, accurately accounting for timezone offsets.
 * Returns null if the input is malformed or invalid.
 */
export function getUtcDateKey(dateInput: string | Date): string | null {
  const parsed = parseUtcCalendarDate(dateInput);
  if (!parsed) {
    return null;
  }
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retrieves or caches an Intl.DateTimeFormat instance configured for short weekday
 * and numeric day formatting in the UTC time zone.
 * Falls back safely to 'en' when an invalid locale causes a RangeError.
 */
export function getChartDateFormatter(locale?: string | Locale): Intl.DateTimeFormat {
  const resolvedLocale = resolveDateTimeLocale(locale);
  const cacheKey = resolvedLocale;

  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat(resolvedLocale, {
        weekday: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
    } catch (err) {
      if (err instanceof RangeError) {
        formatter = new Intl.DateTimeFormat('en', {
          weekday: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        });
      } else {
        throw err;
      }
    }
    formatterCache.set(cacheKey, formatter);
  }

  return formatter;
}

/**
 * Formats a calendar date key for the XAxis of activity charts into a localized
 * short weekday and day label (e.g. 'czw., 10' for pl, '10 Thu' for en, 'Do., 10.' for de)
 * in UTC to prevent timezone day-shifting.
 *
 * Falls back safely to the raw input string (or empty string for invalid Date instances)
 * when parsing fails or when a RangeError occurs during formatting. Non-RangeError exceptions
 * are logged via console.error and re-thrown to prevent silent defect suppression.
 */
export function formatChartDate(
  dateKey: string | Date,
  locale?: string | Locale
): string {
  const parsedDate = parseUtcCalendarDate(dateKey);
  if (!parsedDate) {
    return typeof dateKey === 'string' ? dateKey : '';
  }

  try {
    const formatter = getChartDateFormatter(locale);
    return formatter.format(parsedDate);
  } catch (err) {
    if (err instanceof RangeError) {
      return typeof dateKey === 'string' ? dateKey : '';
    }
    console.error('Failed to format chart date:', err);
    throw err;
  }
}

