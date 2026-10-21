import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';
import { ReportPeriodType } from '../types';

/**
 * Calculates start of Monday 00:00:00 for a given reference date.
 * Maintained as pure helper for backward compatibility with date calculation tests.
 */
export function calculateStartOfWeek(now: Date): number {
  const dWeek = new Date(now);
  const wDay = dWeek.getDay();
  const diffToMonday = (wDay + 6) % 7;
  dWeek.setDate(dWeek.getDate() - diffToMonday);
  dWeek.setHours(0, 0, 0, 0);
  return dWeek.getTime();
}

/**
 * Pure calculation: Evaluates non-negative elapsed seconds between start and end.
 * Maintained as pure helper for backward compatibility with helper tests.
 */
export function calculateLogDurationSeconds(
  startTime: string,
  endTime: string | null | undefined,
  referenceNowMs: number
): number {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : referenceNowMs;
  return Math.max(0, Math.floor((end - start) / 1000));
}

/**
 * Resolves a date range filter and period duration (in days) for a given preset.
 */
export function getRangeFilterForPeriod(
  period: string,
  now: Date,
  customFrom?: string,
  customTo?: string,
  includePatches?: boolean
): { filter: ElapsedRangeFilter; days: number } {
  const nowMs = now.getTime();

  switch (period as ReportPeriodType) {
    case 'today': {
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      return {
        filter: { from: startOfDay.toISOString(), includePatches },
        days: 1,
      };
    }
    case 'yesterday': {
      const yStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0, 0));
      const yEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 23, 59, 59, 999));
      return {
        filter: { from: yStart.toISOString(), to: yEnd.toISOString(), includePatches },
        days: 1,
      };
    }
    case 'week': {
      const day = now.getUTCDay();
      const diffToMonday = (day + 6) % 7;
      const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday, 0, 0, 0, 0));
      return {
        filter: { from: weekStart.toISOString(), includePatches },
        days: diffToMonday + 1,
      };
    }
    case 'lastWeek': {
      const day = now.getUTCDay();
      const diffToMonday = (day + 6) % 7;
      const lastWeekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday - 7, 0, 0, 0, 0));
      const lastWeekEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday - 1, 23, 59, 59, 999));
      return {
        filter: { from: lastWeekStart.toISOString(), to: lastWeekEnd.toISOString(), includePatches },
        days: 7,
      };
    }
    case 'month': {
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      return {
        filter: { from: monthStart.toISOString(), includePatches },
        days: now.getUTCDate(),
      };
    }
    case 'lastMonth': {
      const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
      const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
      return {
        filter: { from: lastMonthStart.toISOString(), to: lastMonthEnd.toISOString(), includePatches },
        days: lastMonthEnd.getUTCDate(),
      };
    }
    case 'last30Days': {
      const last30Start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30, 0, 0, 0, 0));
      return {
        filter: { from: last30Start.toISOString(), includePatches },
        days: 30,
      };
    }
    case 'year': {
      const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
      return {
        filter: { from: yearStart.toISOString(), includePatches },
        days: Math.max(1, Math.round((nowMs - yearStart.getTime()) / (1000 * 60 * 60 * 24))),
      };
    }
    case 'custom': {
      const from = customFrom ? new Date(customFrom.includes('T') ? customFrom : `${customFrom}T00:00:00Z`).toISOString() : undefined;
      const to = customTo ? new Date(customTo.includes('T') ? customTo : `${customTo}T23:59:59.999Z`).toISOString() : undefined;
      const fromMs = from ? new Date(from).getTime() : nowMs;
      const toMs = to ? new Date(to).getTime() : nowMs;
      const days = Math.max(1, Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24)));
      return {
        filter: { from, to, includePatches },
        days,
      };
    }
    case 'all':
    default: {
      return {
        filter: { includePatches },
        days: 1,
      };
    }
  }
}
