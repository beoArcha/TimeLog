import { MSG_DATE_OUT_OF_RANGE, MSG_UNPARSEABLE_BOUND, invalidRangeInput } from './rangeErrors';
import { DAY_MS, resolveLocal, wallMsFromFields, type WallMs } from './zonedTime';

/** A custom bound is either a calendar day (whose meaning depends on being `from` or `to`) or an exact instant. */
export type ParsedBound = { kind: 'day'; wall: WallMs } | { kind: 'instant'; instantMs: number };

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const NAIVE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})$/;
const OFFSET_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|([+-])(\d{2}):(\d{2}))$/;

function numbers(match: RegExpMatchArray): number[] {
  return match.slice(1).map((value) => (value === undefined ? 0 : Number(value)));
}

function unparseable(value: string) {
  return invalidRangeInput(`${MSG_UNPARSEABLE_BOUND}: '${value}'`);
}

function parseWithOffset(value: string): ParsedBound | null {
  const match = OFFSET_PATTERN.exec(value);
  if (!match) return null;

  const [year, month, day, hour, minute, second] = numbers(match);
  const wall = wallMsFromFields(year, month, day, hour, minute, second);
  if (wall === null) throw unparseable(value);

  // The fractional-seconds group is deliberately not read: bounds are whole-second instants before any comparison.
  const sign = match[7];
  const offsetHours = Number(match[8] ?? 0);
  const offsetMinutes = Number(match[9] ?? 0);
  if (offsetHours > 23 || offsetMinutes > 59) throw unparseable(value);
  const offsetMs = (offsetHours * 60 + offsetMinutes) * 60_000;
  return { kind: 'instant', instantMs: wall - (sign === '-' ? -offsetMs : offsetMs) };
}

function parseNaive(value: string, timeZone: string): ParsedBound | null {
  const match = NAIVE_PATTERN.exec(value);
  if (!match) return null;

  const [year, month, day, hour, minute, second] = numbers(match);
  const wall = wallMsFromFields(year, month, day, hour, minute, second);
  if (wall === null) throw unparseable(value);
  return { kind: 'instant', instantMs: resolveLocal(wall, timeZone) };
}

function parseDay(value: string): ParsedBound | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const [year, month, day] = numbers(match);
  const wall = wallMsFromFields(year, month, day);
  if (wall === null) throw unparseable(value);
  return { kind: 'day', wall };
}

export function parseBound(raw: string, timeZone: string): ParsedBound {
  const value = raw.trim();
  const parsed = parseWithOffset(value) ?? parseNaive(value, timeZone) ?? parseDay(value);
  if (parsed === null) throw unparseable(value);
  return parsed;
}

/** A date-only `to` covers the whole named day, so it resolves to the following local midnight. */
export function boundToInstant(bound: ParsedBound, timeZone: string, isUpper: boolean): number {
  if (bound.kind === 'instant') return bound.instantMs;
  const wall = isUpper ? bound.wall + DAY_MS : bound.wall;
  if (!Number.isFinite(new Date(wall).getTime())) throw invalidRangeInput(MSG_DATE_OUT_OF_RANGE);
  return resolveLocal(wall, timeZone);
}
