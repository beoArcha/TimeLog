import type { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';
import type { RangePreset } from '@bindings/RangePreset';
import { resolveRangeAt } from '@common/engine/range/resolveRange';
import { DAY_MS, localDateAt, wallMsFromFields, type WallMs } from '@common/engine/range/zonedTime';
import { ReportPeriodType } from '../types';

export interface ReportPeriodOptions {
  period: string;
  now: Date;
  /** IANA zone whose local calendar defines the period edges and the day count. */
  timeZone: string;
  /** Date-only values are local days of `timeZone`; the `customTo` day is part of the range. */
  customFrom?: string;
  customTo?: string;
  includePatches?: boolean;
  /** Start of the earliest entry in scope; anchors the open start of `all` and of a custom range without `customFrom`. */
  earliestEntryIso?: string | null;
}

export interface ReportPeriodRange {
  filter: ElapsedRangeFilter;
  /** Local calendar days the daily average is divided by; always at least 1. */
  days: number;
}

interface ResolvedBounds {
  from?: string;
  to?: string;
}

const PRESET_BY_PERIOD: Partial<Record<ReportPeriodType, RangePreset>> = {
  today: 'today',
  yesterday: 'yesterday',
  week: 'week',
  lastWeek: 'lastWeek',
  month: 'month',
  lastMonth: 'lastMonth',
  last30Days: 'last30Days',
  year: 'year',
};

// The date inputs can transiently describe an inverted range while the user edits one of them. Each
// bound is resolved on its own so that state yields an empty report instead of an engine error.
function resolveCustomBounds({ customFrom, customTo, now, timeZone }: ReportPeriodOptions): ResolvedBounds {
  return {
    from: customFrom ? resolveRangeAt({ from: customFrom }, now, timeZone).from : undefined,
    to: customTo ? resolveRangeAt({ to: customTo }, now, timeZone).to : undefined,
  };
}

function resolveBounds(options: ReportPeriodOptions): ResolvedBounds {
  if (options.period === 'custom') return resolveCustomBounds(options);

  const preset = PRESET_BY_PERIOD[options.period as ReportPeriodType] ?? 'all';
  const { from, to } = resolveRangeAt({ preset }, options.now, options.timeZone);
  return { from, to };
}

function localDayOf(instantMs: number, timeZone: string): WallMs {
  const { year, month, day } = localDateAt(instantMs, timeZone);
  return wallMsFromFields(year, month, day) as WallMs;
}

function localDayOfIso(iso: string, timeZone: string): WallMs {
  return localDayOf(Date.parse(iso), timeZone);
}

function countLocalDays(bounds: ResolvedBounds, options: ReportPeriodOptions): number {
  const { now, timeZone, earliestEntryIso, period } = options;
  const today = localDayOf(now.getTime(), timeZone);
  const firstDay = bounds.from ?? earliestEntryIso;
  const first = firstDay ? localDayOfIso(firstDay, timeZone) : today;

  // `to` is an exclusive bound, so the last day of the range is the one containing the instant just before it.
  const lastInRange = bounds.to ? localDayOf(Date.parse(bounds.to) - 1, timeZone) : today;
  const last = period === 'custom' ? lastInRange : Math.min(lastInRange, today);

  return Math.max(1, Math.round((last - first) / DAY_MS) + 1);
}

/**
 * Resolves the report period on the local calendar of `options.timeZone` through the engine's
 * range resolution. Unknown period names resolve like `all`.
 */
export function getRangeFilterForPeriod(options: ReportPeriodOptions): ReportPeriodRange {
  const bounds = resolveBounds(options);
  return {
    filter: { from: bounds.from, to: bounds.to, includePatches: options.includePatches },
    days: countLocalDays(bounds, options),
  };
}
