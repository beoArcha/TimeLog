import type { RangePreset } from '@bindings/RangePreset';
import { DAY_MS, localDateAt, wallMsFromFields, type WallMs } from './zonedTime';

export type PresetDays = readonly [from: WallMs, to: WallMs];

// Month starts are always day 1, so shifting the month can never overflow into the next one.
function shiftMonths(monthStart: WallMs, months: number): WallMs {
  const date = new Date(monthStart);
  date.setUTCMonth(date.getUTCMonth() + months, 1);
  return date.getTime();
}

function mondayOffsetOf(day: WallMs): number {
  return (new Date(day).getUTCDay() + 6) % 7;
}

/** Local-midnight wall bounds `[from, to)` for a preset, or `null` for `all`. Weeks start on Monday. */
export function presetDays(preset: RangePreset, now: Date, timeZone: string): PresetDays | null {
  const { year, month, day } = localDateAt(now.getTime(), timeZone);
  const today = wallMsFromFields(year, month, day) as WallMs;
  const weekStart = today - mondayOffsetOf(today) * DAY_MS;
  const monthStart = wallMsFromFields(year, month, 1) as WallMs;

  switch (preset) {
    case 'all':
      return null;
    case 'today':
      return [today, today + DAY_MS];
    case 'yesterday':
      return [today - DAY_MS, today];
    case 'week':
      return [weekStart, weekStart + 7 * DAY_MS];
    case 'lastWeek':
      return [weekStart - 7 * DAY_MS, weekStart];
    case 'month':
      return [monthStart, shiftMonths(monthStart, 1)];
    case 'lastMonth':
      return [shiftMonths(monthStart, -1), monthStart];
  }
}
