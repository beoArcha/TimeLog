import { MSG_DATE_OUT_OF_RANGE, MSG_UNRESOLVABLE_LOCAL, invalidRangeInput } from './rangeErrors';

export const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;
// Real-world DST gaps are at most a couple of hours; a full day bounds the search.
const MAX_GAP_MINUTES = 24 * 60;

export interface LocalDate {
  year: number;
  month: number;
  day: number;
}

/**
 * A wall-clock reading encoded as if it were UTC milliseconds. It carries no zone, so calendar
 * arithmetic on it is immune to DST.
 */
export type WallMs = number;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Returns `null` for non-existent calendar fields (e.g. 30 February) instead of letting Date roll over. */
export function wallMsFromFields(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): WallMs | null {
  // setUTCFullYear avoids Date.UTC mapping years 0-99 onto 1900-1999.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  const roundTrips =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second;
  return roundTrips ? date.getTime() : null;
}

function readFields(instantMs: number, timeZone: string): Record<string, number> {
  if (!Number.isFinite(new Date(instantMs).getTime())) {
    throw invalidRangeInput(MSG_DATE_OUT_OF_RANGE);
  }
  const fields: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(new Date(instantMs))) {
    fields[part.type] = Number(part.value);
  }
  return fields;
}

function wallMsOf(fields: Record<string, number>): WallMs {
  const wall = wallMsFromFields(fields.year, fields.month, fields.day, fields.hour % 24, fields.minute, fields.second);
  if (wall === null) throw invalidRangeInput(MSG_DATE_OUT_OF_RANGE);
  return wall;
}

export function localDateAt(instantMs: number, timeZone: string): LocalDate {
  const { year, month, day } = readFields(instantMs, timeZone);
  return { year, month, day };
}

export function offsetMsAt(instantMs: number, timeZone: string): number {
  return wallMsOf(readFields(instantMs, timeZone)) - Math.floor(instantMs / 1000) * 1000;
}

// An instant maps to `wall` only if the zone's offset at that instant is the offset used to derive it.
// Probing a day to each side finds every offset in play around a transition.
function candidateInstants(wall: WallMs, timeZone: string): number[] {
  const offsets = new Set([offsetMsAt(wall - DAY_MS, timeZone), offsetMsAt(wall + DAY_MS, timeZone)]);
  return [...offsets]
    .map((offset) => ({ offset, instant: wall - offset }))
    .filter(({ offset, instant }) => offsetMsAt(instant, timeZone) === offset)
    .map(({ instant }) => instant);
}

/** Overlaps resolve to the earlier instant; gaps resolve to the first local minute that exists. */
export function resolveLocal(wall: WallMs, timeZone: string): number {
  const exact = candidateInstants(wall, timeZone);
  if (exact.length > 0) return Math.min(...exact);
  return firstValidAfterGap(wall, timeZone);
}

function firstValidAfterGap(wall: WallMs, timeZone: string): number {
  for (let minutes = 1; minutes <= MAX_GAP_MINUTES; minutes += 1) {
    const found = candidateInstants(wall + minutes * MINUTE_MS, timeZone);
    if (found.length > 0) return Math.min(...found);
  }
  throw invalidRangeInput(MSG_UNRESOLVABLE_LOCAL);
}
