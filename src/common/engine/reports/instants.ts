import { formatUtc } from '../range/formatUtc';
import { localDateAt, wallMsFromFields } from '../range/zonedTime';
import { invalidTimestamp } from './errors';

const RFC3339_INSTANT =
  /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:[Zz]|([+-])(\d{2}):(\d{2}))$/;
const MILLISECOND_DIGITS = 3;

function instantFromMatch(match: RegExpExecArray): number | null {
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  // Date.parse rolls non-existent days such as 31 June over to the next month; chrono rejects them.
  const wall = wallMsFromFields(year, month, day, hour, minute, second);
  const [sign, offsetHours, offsetMinutes] = [match[8], Number(match[9] ?? 0), Number(match[10] ?? 0)];
  if (wall === null || offsetHours > 23 || offsetMinutes > 59) return null;

  const fraction = (match[7] ?? '').slice(0, MILLISECOND_DIGITS).padEnd(MILLISECOND_DIGITS, '0');
  const offsetMs = (offsetHours * 60 + offsetMinutes) * 60_000 * (sign === '-' ? -1 : 1);
  return wall + Number(fraction) - offsetMs;
}

/**
 * Strict on shape and calendar because the Rust parser rejects what `Date.parse` leniently accepts.
 * Precision is milliseconds; chrono keeps nanoseconds, which only matters for whole-second results
 * when a stored value carries more than three fractional digits.
 */
export function parseInstant(raw: string): number {
  const match = RFC3339_INSTANT.exec(raw);
  const instantMs = match ? instantFromMatch(match) : null;
  if (instantMs === null) throw invalidTimestamp(raw);
  return instantMs;
}

export function normalizeInstant(raw: string): string {
  return formatUtc(parseInstant(raw));
}

const pad = (value: number, width: number): string => String(value).padStart(width, '0');

export function formatDay(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

/** Local `YYYY-MM-DD` of an instant in `timeZone`. */
export function localDateString(instantMs: number, timeZone: string): string {
  const { year, month, day } = localDateAt(instantMs, timeZone);
  return formatDay(year, month, day);
}

export function wholeSecondsBetween(fromMs: number, toMs: number): number {
  return Math.max(0, Math.trunc((toMs - fromMs) / 1000));
}
