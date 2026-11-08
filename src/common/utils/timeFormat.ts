export const DEFAULT_TIMEZONE = 'System';
export const FALLBACK_TIMEZONE = 'UTC';

export const POPULAR_TIMEZONES = [
  'UTC', 'Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'Europe/Kyiv', 'Europe/Amsterdam', 'Europe/Rome', 'America/New_York',
  'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney',
] as const;

export function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== 'string') return false;
  try { new Intl.DateTimeFormat(undefined, { timeZone: tz }); return true; } catch { return false; }
}

export function resolveSystemTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && isValidTimezone(tz)) return tz;
  } catch { /* fallback */ }
  return FALLBACK_TIMEZONE;
}

export function resolveEffectiveTimezone(tzPreference?: string | null): string {
  if (!tzPreference || tzPreference === DEFAULT_TIMEZONE || tzPreference.toLowerCase() === 'system') return resolveSystemTimezone();
  return isValidTimezone(tzPreference) ? tzPreference : resolveSystemTimezone();
}

export function getSupportedTimezones(): string[] {
  if (typeof Intl.supportedValuesOf === 'function') {
    try { return Array.from(new Set(['UTC', ...Intl.supportedValuesOf('timeZone')])); } catch { /* fallback */ }
  }
  return [...POPULAR_TIMEZONES];
}

function parseInputDate(input: Date | string | number): Date | null {
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(input: Date | string | number, timezone?: string, locale = 'en', options?: Intl.DateTimeFormatOptions): string {
  const d = parseInputDate(input);
  return d ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, ...options, timeZone: resolveEffectiveTimezone(timezone) }).format(d) : '';
}

export function formatDate(input: Date | string | number, timezone?: string, locale = 'en', options?: Intl.DateTimeFormatOptions): string {
  const d = parseInputDate(input);
  return d ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', ...options, timeZone: resolveEffectiveTimezone(timezone) }).format(d) : '';
}

export function formatTime(input: Date | string | number, timezone?: string, locale = 'en', options?: Intl.DateTimeFormatOptions): string {
  const d = parseInputDate(input);
  return d ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, ...options, timeZone: resolveEffectiveTimezone(timezone) }).format(d) : '';
}
