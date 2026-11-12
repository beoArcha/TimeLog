import type { ReportEntry } from '@bindings/ReportEntry';
import type { ResolvedRange } from '@bindings/ResolvedRange';
import type { Task } from '@bindings/Task';
import { clampInterval } from '@plugins/engine/metrics/clamping';
import { isKnownTimeZone } from '../range/timezone';
import { invalidTimezone } from '../range/rangeErrors';
import type { RateResolver } from './billing';
import type { Catalog } from './catalog';
import { localDateString, normalizeInstant, parseInstant } from './instants';
import { sortEntries } from './ordering';
import { definedOnly } from './serialize';
import type { ReportSnapshot } from './types';

export interface Bounds {
  readonly from?: number;
  readonly to?: number;
  readonly timeZone: string;
  readonly nowMs: number;
}

export interface Scope {
  readonly projectId?: string;
  readonly taskId?: string;
  readonly includePatches: boolean;
}

/** A log or patch with time inside the range, already clamped and placed in its task hierarchy. */
export interface MeasuredEntry {
  readonly id: string;
  readonly projectId: string;
  /** The entry's own task first, its root task last; empty for a task-less patch. */
  readonly chain: readonly Task[];
  readonly start: string;
  readonly end?: string;
  readonly date: string;
  /** The in-range portion of the interval; day splitting works on these, not on the stored instants. */
  readonly inRangeStartMs: number;
  readonly inRangeEndMs: number;
  readonly note?: string;
  readonly isPatch: boolean;
  readonly seconds: number;
  readonly originalSeconds: number;
  readonly clamped: boolean;
}

interface RawInterval {
  readonly id: string;
  readonly projectId: string;
  readonly taskId?: string;
  readonly start: string;
  readonly end?: string;
  readonly note?: string;
  readonly isPatch: boolean;
}

export function boundsFromRange(range: ResolvedRange, nowMs: number): Bounds {
  if (!isKnownTimeZone(range.timezone)) throw invalidTimezone(range.timezone);
  return {
    from: range.from == null ? undefined : parseInstant(range.from),
    to: range.to == null ? undefined : parseInstant(range.to),
    timeZone: range.timezone,
    nowMs,
  };
}

function* rawIntervals(snapshot: ReportSnapshot, includePatches: boolean): Generator<RawInterval> {
  for (const log of snapshot.logs) {
    yield {
      id: log.id,
      projectId: log.projectId,
      taskId: log.taskId,
      start: log.startTime,
      end: log.endTime ?? undefined,
      note: log.note ?? undefined,
      isPatch: false,
    };
  }
  if (!includePatches) return;
  for (const patch of snapshot.patches) {
    yield {
      id: patch.id,
      projectId: patch.projectId,
      taskId: patch.taskId ?? undefined,
      start: patch.startTime,
      end: patch.endTime,
      note: patch.patchNote,
      isPatch: true,
    };
  }
}

export function measureEntries(
  snapshot: ReportSnapshot,
  catalog: Catalog,
  scope: Scope,
  bounds: Bounds
): MeasuredEntry[] {
  const measured: MeasuredEntry[] = [];
  for (const raw of rawIntervals(snapshot, scope.includePatches)) {
    const entry = measure(raw, catalog, scope, bounds);
    if (entry) measured.push(entry);
  }
  return measured;
}

function measure(raw: RawInterval, catalog: Catalog, scope: Scope, bounds: Bounds): MeasuredEntry | null {
  const chain = raw.taskId === undefined ? [] : catalog.chain(raw.taskId);
  // The task's own project wins so the entry always lands under the project that owns its task.
  const projectId = chain[0]?.projectId ?? raw.projectId;

  const inProject = scope.projectId === undefined || scope.projectId === projectId;
  const inTask = scope.taskId === undefined || chain.some((task) => task.id === scope.taskId);
  if (!inProject || !inTask) return null;

  // Parsed here, after filtering, so an unparseable entry outside the filter never fails the report.
  const startMs = parseInstant(raw.start);
  const endMs = raw.end === undefined ? undefined : parseInstant(raw.end);
  const clamped = clampInterval(
    {
      id: raw.id,
      projectId,
      taskId: raw.taskId ?? '',
      startTime: new Date(startMs).toISOString(),
      endTime: endMs === undefined ? undefined : new Date(endMs).toISOString(),
      note: raw.note,
      isPatch: raw.isPatch,
    },
    bounds.from ?? -Infinity,
    bounds.to ?? Infinity,
    bounds.nowMs
  );
  if (!clamped) return null;

  const inRangeStartMs = Date.parse(clamped.clampedStartTime);
  return {
    id: raw.id,
    projectId,
    chain,
    start: normalizeInstant(raw.start),
    end: raw.end === undefined ? undefined : normalizeInstant(raw.end),
    date: localDateString(inRangeStartMs, bounds.timeZone),
    inRangeStartMs,
    inRangeEndMs: Date.parse(clamped.clampedEndTime),
    note: raw.note,
    isPatch: raw.isPatch,
    seconds: clamped.clampedDurationSeconds,
    originalSeconds: clamped.originalDurationSeconds,
    clamped: clamped.isMultiDaySegment,
  };
}

export function buildEntries(measured: readonly MeasuredEntry[], catalog: Catalog, rates: RateResolver): ReportEntry[] {
  const entries = measured.map((entry) => toReportEntry(entry, catalog, rates));
  sortEntries(entries);
  return entries;
}

function toReportEntry(entry: MeasuredEntry, catalog: Catalog, rates: RateResolver): ReportEntry {
  const project = catalog.project(entry.projectId);
  const task = entry.chain[0];
  const parent = entry.chain[1];
  const billing = task ? rates.bill(task, entry.seconds) : undefined;

  return {
    id: entry.id,
    projectId: entry.projectId,
    projectName: project.name,
    ...definedOnly({
      taskId: task?.id,
      taskName: task?.name,
      rootTaskId: entry.chain.at(-1)?.id,
      parentTaskId: parent?.id,
      parentTaskName: parent?.name,
    }),
    start: entry.start,
    ...definedOnly({ end: entry.end }),
    date: entry.date,
    seconds: entry.seconds,
    originalSeconds: entry.originalSeconds,
    clamped: entry.clamped,
    isPatch: entry.isPatch,
    ...definedOnly({
      note: entry.note,
      rateMinor: billing?.rateMinor,
      currency: billing?.currency,
      amountMinor: billing?.amountMinor,
    }),
  };
}
