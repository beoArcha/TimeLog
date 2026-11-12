import type { ReportDay } from '@bindings/ReportDay';
import { DAY_MS, localDateAt, resolveLocal, wallMsFromFields, type WallMs } from '../range/zonedTime';
import type { Bounds, MeasuredEntry } from './entries';
import { formatDay, wholeSecondsBetween } from './instants';

/** Seconds keyed by the local calendar day encoded as a wall-clock millisecond value. */
type SecondsByDay = Map<WallMs, number>;

function localDayOf(instantMs: number, timeZone: string): WallMs {
  const { year, month, day } = localDateAt(instantMs, timeZone);
  return wallMsFromFields(year, month, day) as WallMs;
}

function dayLabel(day: WallMs): string {
  const date = new Date(day);
  return formatDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function buildDays(measured: readonly MeasuredEntry[], bounds: Bounds): ReportDay[] {
  const secondsByDay: SecondsByDay = new Map();
  for (const entry of measured) {
    splitAcrossDays(entry, bounds.timeZone, secondsByDay);
  }
  if (bounds.from !== undefined && bounds.to !== undefined) {
    seedZeroDays(bounds.from, bounds.to, bounds.timeZone, secondsByDay);
  }
  return [...secondsByDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, seconds]) => ({ date: dayLabel(day), seconds }));
}

/**
 * Each day gets the whole seconds elapsed up to its closing midnight minus what earlier days already
 * took, so the segments always add up to the entry's `seconds` even when a stored instant carries a
 * sub-second fraction.
 */
function splitAcrossDays(entry: MeasuredEntry, timeZone: string, secondsByDay: SecondsByDay): void {
  let assigned = 0;
  let day = localDayOf(entry.inRangeStartMs, timeZone);
  for (;;) {
    const nextDay = day + DAY_MS;
    const segmentEndMs = Math.min(resolveLocal(nextDay, timeZone), entry.inRangeEndMs);
    const elapsed = Math.max(wholeSecondsBetween(entry.inRangeStartMs, segmentEndMs), assigned);
    secondsByDay.set(day, (secondsByDay.get(day) ?? 0) + elapsed - assigned);
    assigned = elapsed;
    if (segmentEndMs >= entry.inRangeEndMs) return;
    day = nextDay;
  }
}

/** `to` is exclusive: a range ending exactly at local midnight does not include that day. */
function seedZeroDays(fromMs: number, toMs: number, timeZone: string, secondsByDay: SecondsByDay): void {
  const lastDay = localDayOf(toMs - 1, timeZone);
  for (let day = localDayOf(fromMs, timeZone); day <= lastDay; day += DAY_MS) {
    if (!secondsByDay.has(day)) secondsByDay.set(day, 0);
  }
}
