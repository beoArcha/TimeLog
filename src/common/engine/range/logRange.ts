import type { ResolvedRange } from '@bindings/ResolvedRange';
import { invalidRangeInput } from './rangeErrors';
import { localDateAt } from './zonedTime';

const MSG_UNPARSEABLE_RESOLVED_BOUND = 'resolved range bound is not RFC3339';
const MSG_RANGE_WITHOUT_FROM = 'resolved range has no from bound';

const DATE_TIME = '(\\d{4})-(\\d{2})-(\\d{2})T([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d';
const OFFSET_TIMESTAMP = new RegExp(`^${DATE_TIME}(?:\\.\\d+)?(?:Z|[+-](?:[01]\\d|2[0-3]):[0-5]\\d)$`);
const NAIVE_TIMESTAMP = new RegExp(`^${DATE_TIME}$`);

function isRealCalendarDay(year: string, month: string, day: string): boolean {
  const probe = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return probe.getUTCMonth() === Number(month) - 1 && probe.getUTCDate() === Number(day);
}

function parseMatched(raw: string, match: RegExpExecArray | null, suffix: string): number | null {
  if (!match || !isRealCalendarDay(match[1], match[2], match[3])) return null;
  const ms = Date.parse(raw + suffix);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Mirrors `parse_log_timestamp` in `src-tauri/src/cli/shared/range_bounds.rs`: RFC3339 with an offset is used
 * as is, a naive `YYYY-MM-DDTHH:MM:SS` is read as UTC (`Date.parse` alone would read it as local time), and
 * anything else is unparseable.
 */
export function parseLogTimestampMs(raw: string): number | null {
  const withOffset = parseMatched(raw, OFFSET_TIMESTAMP.exec(raw), '');
  return withOffset ?? parseMatched(raw, NAIVE_TIMESTAMP.exec(raw), 'Z');
}

function resolvedBoundMs(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const ms = parseLogTimestampMs(raw);
  if (ms === null) throw invalidRangeInput(`${MSG_UNPARSEABLE_RESOLVED_BOUND}: '${raw}'`);
  return ms;
}

/**
 * Mirrors `RangeBounds::contains` in `src-tauri/src/cli/shared/range_bounds.rs`: a half-open `[from, to)` check
 * where an unbounded range keeps every log, including ones whose timestamp cannot be parsed.
 */
export function isStartInRange(startTime: string, range: ResolvedRange): boolean {
  const fromMs = resolvedBoundMs(range.from);
  const toMs = resolvedBoundMs(range.to);
  if (fromMs === undefined && toMs === undefined) return true;

  const startMs = parseLogTimestampMs(startTime);
  if (startMs === null) return false;
  return (fromMs === undefined || startMs >= fromMs) && (toMs === undefined || startMs < toMs);
}

/**
 * Mirrors `local_date_of_range` in `src-tauri/src/engine/range.rs`: the calendar day (`YYYY-MM-DD`) in which
 * the range begins, in the range's own timezone.
 */
export function localDateOfRange(range: ResolvedRange): string {
  const fromMs = resolvedBoundMs(range.from);
  if (fromMs === undefined) throw invalidRangeInput(MSG_RANGE_WITHOUT_FROM);

  const { year, month, day } = localDateAt(fromMs, range.timezone);
  const pad = (value: number, width: number) => String(value).padStart(width, '0');
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}
