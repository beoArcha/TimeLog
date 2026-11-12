import { describe, it, expect } from 'vitest';
import { aPatchLog, aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import type { ReportRequest } from '@bindings/ReportRequest';
import type { ResolvedRange } from '@bindings/ResolvedRange';
import { buildReportAt } from '@common/engine/reports';
import { GENERATOR_NAME, GENERATOR_VERSION, REPORT_SCHEMA_NAME, REPORT_SCHEMA_VERSION } from '@common/engine/reports/constants';
import type { ReportSnapshot } from '@common/engine/reports';

const GENERATED_AT = new Date('2026-06-20T12:00:00.900Z');
const JUNE_15: ResolvedRange = { from: '2026-06-15T00:00:00Z', to: '2026-06-16T00:00:00Z', timezone: 'UTC' };

const request = (overrides?: Partial<ReportRequest>): ReportRequest => ({
  range: { preset: 'all' },
  variant: 'summary',
  ...overrides,
});

const snapshot = (overrides?: Partial<ReportSnapshot>): ReportSnapshot => ({
  projects: [aProject()],
  tasks: [aTask()],
  logs: [aTimeLog({ startTime: '2026-06-15T10:00:00Z', endTime: '2026-06-15T11:00:00Z' })],
  patches: [],
  ...overrides,
});

function keysDeep(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(keysDeep);
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => [key, ...keysDeep(child)]);
}

describe('buildReportAt', () => {
  it('should stamp the schema, generator and a whole-second generation time', () => {
    // Arrange
    const data = snapshot({ logs: [] });

    // Act
    const document = buildReportAt(data, request(), JUNE_15, GENERATED_AT);

    // Assert
    expect(document).toMatchObject({
      schema: REPORT_SCHEMA_NAME,
      schemaVersion: REPORT_SCHEMA_VERSION,
      generator: { name: GENERATOR_NAME, version: GENERATOR_VERSION },
      generatedAt: '2026-06-20T12:00:00Z',
    });
  });

  it('should never serialize undefined optional fields', () => {
    // Arrange
    const data = snapshot();

    // Act
    const document = buildReportAt(data, request({ variant: 'full' }), JUNE_15, GENERATED_AT);

    // Assert
    // JSON.stringify drops keys holding undefined, so any such key makes the two lists differ.
    expect(keysDeep(document)).toEqual(keysDeep(JSON.parse(JSON.stringify(document))));
  });

  it('should omit entries for the summary variant and keep an empty array for an empty full report', () => {
    // Arrange
    const empty = snapshot({ logs: [] });

    // Act
    const summary = buildReportAt(empty, request({ variant: 'summary' }), JUNE_15, GENERATED_AT);
    const full = buildReportAt(empty, request({ variant: 'full' }), JUNE_15, GENERATED_AT);

    // Assert
    expect('entries' in summary).toBe(false);
    expect(full.entries).toEqual([]);
  });

  it('should echo the resolved range in contract key order', () => {
    // Arrange
    const range: ResolvedRange = { preset: 'week', timezone: 'UTC', to: JUNE_15.to, from: JUNE_15.from };

    // Act
    const document = buildReportAt(snapshot(), request(), range, GENERATED_AT);

    // Assert
    expect(Object.keys(document.range)).toEqual(['from', 'to', 'timezone', 'preset']);
  });

  it('should leave the filters empty and patches off by default', () => {
    // Arrange
    const data = snapshot();

    // Act
    const { filters } = buildReportAt(data, request(), JUNE_15, GENERATED_AT);

    // Assert
    expect(filters).toStrictEqual({ includePatches: false });
  });

  it('should echo the project and task filters and the patch flag', () => {
    // Arrange
    const filtered = request({ projectId: 'p1', taskId: 't1', includePatches: true });

    // Act
    const { filters } = buildReportAt(snapshot(), filtered, JUNE_15, GENERATED_AT);

    // Assert
    expect(Object.keys(filters)).toEqual(['projectId', 'taskId', 'includePatches']);
  });

  it('should treat null filters from untyped callers as absent', () => {
    // Arrange
    const loose = request({ projectId: null as unknown as string, taskId: null as unknown as string });

    // Act
    const { filters, totals } = buildReportAt(snapshot(), loose, JUNE_15, GENERATED_AT);

    // Assert
    expect([filters, totals.seconds]).toStrictEqual([{ includePatches: false }, 3600]);
  });

  it('should count a patch only when patches are included', () => {
    // Arrange
    const data = snapshot({
      logs: [],
      patches: [aPatchLog({ taskId: undefined, startTime: '2026-06-15T10:00:00Z', endTime: '2026-06-15T10:30:00Z' })],
    });

    // Act
    const without = buildReportAt(data, request(), JUNE_15, GENERATED_AT);
    const withPatches = buildReportAt(data, request({ includePatches: true }), JUNE_15, GENERATED_AT);

    // Assert
    expect([without.totals.seconds, withPatches.totals.seconds]).toEqual([0, 1800]);
  });

  it('should measure a running entry up to the injected clock', () => {
    // Arrange
    const running = aTimeLog({ startTime: '2026-06-20T10:30:00Z', endTime: undefined });
    const range: ResolvedRange = { from: '2026-06-20T00:00:00Z', to: '2026-06-21T00:00:00Z', timezone: 'UTC' };

    // Act
    const document = buildReportAt(snapshot({ logs: [running] }), request({ variant: 'full' }), range, GENERATED_AT);

    // Assert
    expect(document.entries?.[0]).toMatchObject({ seconds: 5400, originalSeconds: 5400 });
    expect(document.entries?.[0] && 'end' in document.entries[0]).toBe(false);
  });

  it('should fail with the invalid timezone code when the range names an unknown zone', () => {
    // Arrange
    const range: ResolvedRange = { ...JUNE_15, timezone: 'Mars/Olympus' };

    // Act
    const act = () => buildReportAt(snapshot(), request(), range, GENERATED_AT);

    // Assert
    expect(act).toThrow(expect.objectContaining({ code: 'DOM_INVALID_TIMEZONE' }));
  });

  it('should group a task-less patch under its project as direct seconds', () => {
    // Arrange
    const data = snapshot({
      logs: [],
      patches: [aPatchLog({ taskId: undefined, startTime: '2026-06-15T10:00:00Z', endTime: '2026-06-15T10:30:00Z' })],
    });

    // Act
    const { projects } = buildReportAt(data, request({ includePatches: true }), JUNE_15, GENERATED_AT);

    // Assert
    expect(projects[0]).toMatchObject({ directSeconds: 1800, seconds: 1800, shareBasisPoints: 10_000, tasks: [] });
  });
});
