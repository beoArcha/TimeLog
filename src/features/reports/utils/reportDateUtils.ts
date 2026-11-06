import { resolveSystemLocale } from '@common/i18n/locales';
import type { Locale } from '@bindings/Locale';

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

/**
 * Normalizes an application locale (which can include 'system' or 'custom')
 * into a valid BCP 47 language tag accepted by Intl.DateTimeFormat.
 */
export function resolveDateTimeLocale(locale?: string): string {
  if (!locale || locale === 'system') {
    return resolveSystemLocale();
  }
  if (locale === 'custom') {
    return 'en';
  }
  return locale;
}

/**
 * Parses a dateKey (such as 'YYYY-MM-DD' or ISO timestamp) into a JavaScript Date
 * strictly anchored at 00:00:00.000 UTC on that calendar day.
 * Returns null if the input is malformed or invalid.
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

  const match = ISO_DATE_REGEX.exec(dateKey.trim());
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

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

  const fallback = new Date(dateKey);
  if (isNaN(fallback.getTime())) {
    return null;
  }

  return new Date(
    Date.UTC(
      fallback.getUTCFullYear(),
      fallback.getUTCMonth(),
      fallback.getUTCDate()
    )
  );
}

/**
 * Retrieves or caches an Intl.DateTimeFormat instance configured for short weekday
 * and numeric day formatting in the UTC time zone.
 */
export function getChartDateFormatter(locale?: string | Locale): Intl.DateTimeFormat {
  const resolvedLocale = resolveDateTimeLocale(locale);
  const cacheKey = resolvedLocale;

  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(resolvedLocale, {
      weekday: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    formatterCache.set(cacheKey, formatter);
  }

  return formatter;
}

/**
 * Formats a calendar date key for the XAxis of activity charts into a localized
 * short weekday and day label (e.g. 'czw., 10' for pl, '10 Thu' for en, 'Do., 10.' for de)
 * in UTC to prevent timezone day-shifting.
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
  } catch {
    return typeof dateKey === 'string' ? dateKey : '';
  }
}
