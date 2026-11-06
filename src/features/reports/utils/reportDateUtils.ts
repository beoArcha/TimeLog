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
 * Safely constructs a Date object in UTC, ensuring that years 0000–0099
 * are not incorrectly treated as 1900–1999 by Date.UTC.
 */
function createUtcDate(year: number, monthIndex: number, day: number): Date {
  const date = new Date(Date.UTC(year, monthIndex, day));
  date.setUTCFullYear(year);
  return date;
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
    return createUtcDate(
      dateKey.getUTCFullYear(),
      dateKey.getUTCMonth(),
      dateKey.getUTCDate()
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

    const parsed = createUtcDate(year, month - 1, day);
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
    const calendarCheck = createUtcDate(year, month - 1, day);
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
    return createUtcDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
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
  const year = String(parsed.getUTCFullYear()).padStart(4, '0');
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface FormatChartDateOptions {
  includeMonth?: boolean;
  includeYear?: boolean;
  yearFormat?: 'numeric' | '2-digit';
}

export interface DateRangeSpan {
  hasMultipleMonths: boolean;
  hasMultipleYears: boolean;
}

/**
 * Detects whether a set of dates spans across multiple calendar months
 * or multiple calendar years in UTC.
 */
export function detectDateSpan(dates: (string | Date)[]): DateRangeSpan {
  let firstYear: number | null = null;
  let firstMonth: number | null = null;
  let hasMultipleMonths = false;
  let hasMultipleYears = false;

  for (const date of dates) {
    const parsed = parseUtcCalendarDate(date);
    if (!parsed) continue;
    const y = parsed.getUTCFullYear();
    const m = parsed.getUTCMonth();

    if (firstYear === null || firstMonth === null) {
      firstYear = y;
      firstMonth = m;
    } else {
      if (y !== firstYear) {
        hasMultipleYears = true;
        hasMultipleMonths = true;
      }
      if (m !== firstMonth) {
        hasMultipleMonths = true;
      }
    }
  }

  return { hasMultipleMonths, hasMultipleYears };
}

/**
 * Retrieves or caches an Intl.DateTimeFormat instance configured for short weekday,
 * day, and optional month/year formatting in the UTC time zone.
 * Falls back safely to 'en' when an invalid locale causes a RangeError.
 */
export function getChartDateFormatter(
  locale?: string | Locale,
  options?: FormatChartDateOptions
): Intl.DateTimeFormat {
  const resolvedLocale = resolveDateTimeLocale(locale);
  const includeYear = Boolean(options?.includeYear);
  const includeMonth = options?.includeMonth ?? includeYear;
  const yearFormat = options?.yearFormat ?? 'numeric';

  const cacheKey = `${resolvedLocale}:${includeMonth ? 'M' : ''}:${includeYear ? yearFormat : ''}`;

  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    const intlOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    };
    if (includeMonth) {
      intlOptions.month = 'short';
    }
    if (includeYear) {
      intlOptions.year = yearFormat;
    }

    try {
      formatter = new Intl.DateTimeFormat(resolvedLocale, intlOptions);
    } catch (err) {
      if (err instanceof RangeError) {
        formatter = new Intl.DateTimeFormat('en', intlOptions);
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
 * label (e.g. 'czw., 10' for pl, '10 Thu' for en, 'Do., 10.' for de) in UTC to prevent
 * timezone day-shifting.
 *
 * Supports optional month and year inclusion for disambiguating multi-month or multi-year ranges.
 *
 * Falls back safely to the raw input string (or empty string for invalid Date instances)
 * when parsing fails or when a RangeError occurs during formatting. Non-RangeError exceptions
 * are logged via console.error and re-thrown to prevent silent defect suppression.
 */
export function formatChartDate(
  dateKey: string | Date,
  locale?: string | Locale,
  options?: FormatChartDateOptions
): string {
  const parsedDate = parseUtcCalendarDate(dateKey);
  if (!parsedDate) {
    return typeof dateKey === 'string' ? dateKey : '';
  }

  try {
    const formatter = getChartDateFormatter(locale, options);
    return formatter.format(parsedDate);
  } catch (err) {
    if (err instanceof RangeError) {
      return typeof dateKey === 'string' ? dateKey : '';
    }
    console.error('Failed to format chart date:', err);
    throw err;
  }
}

/**
 * Formats a calendar date in UTC for print headers and printed log timestamps
 * according to the active locale (e.g. '15.06.2026' in pl, '06/15/2026' in en, '2026-06-15' ISO fallback).
 * Returns empty string if the input date is malformed or invalid.
 */
export function formatCalendarDate(
  dateKey: string | Date,
  locale?: string | Locale
): string {
  const parsed = parseUtcCalendarDate(dateKey);
  if (!parsed) {
    return '';
  }
  const resolvedLocale = resolveDateTimeLocale(locale);
  try {
    return new Intl.DateTimeFormat(resolvedLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }).format(parsed);
  } catch (err) {
    if (err instanceof RangeError) {
      return getUtcDateKey(parsed) ?? '';
    }
    console.error('Failed to format calendar date:', err);
    throw err;
  }
}

export interface CustomDateRangeSummary {
  fromStr: string | null;
  toStr: string | null;
  label: string | null;
}

/**
 * Safely formats a custom date range for print headers (e.g. '15.06.2026 — 22.06.2026').
 * Handles incomplete (from only, to only) or invalid inputs safely without misleading displays.
 */
export function formatCustomDateRange(
  from?: string,
  to?: string,
  locale?: string | Locale
): CustomDateRangeSummary {
  const fromFormatted = from ? formatCalendarDate(from, locale) : '';
  const toFormatted = to ? formatCalendarDate(to, locale) : '';

  if (fromFormatted && toFormatted) {
    return {
      fromStr: fromFormatted,
      toStr: toFormatted,
      label: `${fromFormatted} — ${toFormatted}`,
    };
  }
  if (fromFormatted) {
    return {
      fromStr: fromFormatted,
      toStr: null,
      label: `≥ ${fromFormatted}`,
    };
  }
  if (toFormatted) {
    return {
      fromStr: null,
      toStr: toFormatted,
      label: `≤ ${toFormatted}`,
    };
  }
  return {
    fromStr: null,
    toStr: null,
    label: null,
  };
}



