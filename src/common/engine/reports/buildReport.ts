import type { ReportDocument } from '@bindings/ReportDocument';
import type { ReportRequest } from '@bindings/ReportRequest';
import type { ResolvedRange } from '@bindings/ResolvedRange';
import { formatUtc } from '../range/formatUtc';
import { RateResolver } from './billing';
import { Catalog } from './catalog';
import {
  GENERATOR_NAME,
  GENERATOR_VERSION,
  REPORT_SCHEMA_NAME,
  REPORT_SCHEMA_VERSION,
} from './constants';
import { buildDays } from './days';
import { boundsFromRange, buildEntries, measureEntries, type Scope } from './entries';
import { definedOnly } from './serialize';
import { Aggregate, buildProjects } from './tree';
import type { ReportSnapshot } from './types';

export function includesPatches(request: ReportRequest): boolean {
  return request.includePatches ?? false;
}

function toScope(request: ReportRequest): Scope {
  return {
    projectId: request.projectId ?? undefined,
    taskId: request.taskId ?? undefined,
    includePatches: includesPatches(request),
  };
}

/** Rebuilt so the key order follows the contract no matter how the caller spelled the range. */
function echoRange(range: ResolvedRange): ResolvedRange {
  return {
    ...definedOnly({ from: range.from ?? undefined, to: range.to ?? undefined }),
    timezone: range.timezone,
    ...definedOnly({ preset: range.preset ?? undefined }),
  };
}

/**
 * Pure core of the browser report build: the clock is injected so the same inputs always yield the
 * same document. Mirrors `build_report_at` in `src-tauri/src/engine/reports/mod.rs`.
 *
 * Task and subtask amounts are authoritative: each is rounded once from its own `directSeconds`, and
 * the billing totals sum exactly those. Entry amounts are rounded individually, so they may not add up
 * to the task amount they belong to.
 */
export function buildReportAt(
  snapshot: ReportSnapshot,
  request: ReportRequest,
  range: ResolvedRange,
  generatedAt: Date
): ReportDocument {
  const scope = toScope(request);
  const bounds = boundsFromRange(range, generatedAt.getTime());
  const catalog = new Catalog(snapshot.projects, snapshot.tasks);

  const measured = measureEntries(snapshot, catalog, scope, bounds);
  const totalSeconds = measured.reduce((sum, entry) => sum + entry.seconds, 0);
  const rates = new RateResolver(catalog, snapshot.defaultRateCents ?? null);
  const { projects, tally } = buildProjects(catalog, new Aggregate(measured), rates, totalSeconds);
  const entries = request.variant === 'full' ? buildEntries(measured, catalog, rates) : undefined;
  const days = buildDays(measured, bounds);
  const split = tally.split();

  return {
    schema: REPORT_SCHEMA_NAME,
    schemaVersion: REPORT_SCHEMA_VERSION,
    variant: request.variant,
    generatedAt: formatUtc(generatedAt.getTime()),
    generator: { name: GENERATOR_NAME, version: GENERATOR_VERSION },
    range: echoRange(range),
    filters: {
      ...definedOnly({ projectId: scope.projectId, taskId: scope.taskId }),
      includePatches: scope.includePatches,
    },
    totals: {
      seconds: totalSeconds,
      entryCount: measured.length,
      billableSeconds: split.billable,
      nonBillableSeconds: split.nonBillable,
      unconfiguredSeconds: split.unconfigured,
      billing: tally.currencyTotals(),
    },
    projects,
    days,
    ...definedOnly({ entries }),
  };
}
