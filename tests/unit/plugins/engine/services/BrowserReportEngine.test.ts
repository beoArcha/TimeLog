import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aPatchLog, aProject, aSettings, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import type { ReportRequest } from '@bindings/ReportRequest';
import type { RuntimeConfig } from '@bindings/RuntimeConfig';
import type { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EnginePlugin } from '@plugins/engine/EnginePlugin';
import { BrowserReportEngine } from '@plugins/engine/services/BrowserReportEngine';

interface MockPersistence {
  settings: { get: ReturnType<typeof vi.fn> };
  core: { load: ReturnType<typeof vi.fn> };
  patches: { getAll: ReturnType<typeof vi.fn> };
  runtimeConfigs: { getAll: ReturnType<typeof vi.fn> };
}

const NOW = '2026-06-20T12:00:00.000Z';

const customRequest = (overrides?: Partial<ReportRequest>): ReportRequest => ({
  range: { from: '2026-06-15', to: '2026-06-15' },
  variant: 'full',
  ...overrides,
});

describe('BrowserReportEngine', () => {
  let persistence: MockPersistence;
  let engine: BrowserReportEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    persistence = {
      settings: { get: vi.fn().mockResolvedValue(aSettings({ timezone: 'UTC' })) },
      core: {
        load: vi.fn().mockResolvedValue({
          projects: [aProject()],
          tasks: [aTask()],
          logs: [aTimeLog({ startTime: '2026-06-15T10:00:00Z', endTime: '2026-06-15T11:00:00Z' })],
        }),
      },
      patches: { getAll: vi.fn().mockResolvedValue([]) },
      runtimeConfigs: { getAll: vi.fn().mockResolvedValue([]) },
    };
    engine = new BrowserReportEngine(persistence as unknown as PersistenceRouter);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve the request range in the stored settings timezone', async () => {
    // Arrange
    persistence.settings.get.mockResolvedValue(aSettings({ timezone: 'Europe/Warsaw' }));

    // Act
    const document = await engine.buildReport(customRequest());

    // Assert
    expect(document.range).toEqual({
      from: '2026-06-14T22:00:00Z',
      to: '2026-06-15T22:00:00Z',
      timezone: 'Europe/Warsaw',
    });
  });

  it('should prefer the timezone named in the request over the stored setting', async () => {
    // Arrange
    persistence.settings.get.mockResolvedValue(aSettings({ timezone: 'Europe/Warsaw' }));
    const request = customRequest({ range: { from: '2026-06-15', to: '2026-06-15', timezone: 'UTC' } });

    // Act
    const document = await engine.buildReport(request);

    // Assert
    expect(document.range.timezone).toBe('UTC');
  });

  it('should stamp the document with the current instant', async () => {
    // Arrange
    const request = customRequest();

    // Act
    const document = await engine.buildReport(request);

    // Assert
    expect(document.generatedAt).toBe('2026-06-20T12:00:00Z');
  });

  it('should report the persisted logs and apply the default billing rate', async () => {
    // Arrange
    persistence.runtimeConfigs.getAll.mockResolvedValue([
      { id: 'default_billing_rate', runtime: 'billing_default', config: '60.00', createdAt: NOW } satisfies RuntimeConfig,
    ]);

    // Act
    const document = await engine.buildReport(customRequest());

    // Assert
    expect(document.totals).toMatchObject({ seconds: 3600, entryCount: 1, billableSeconds: 3600 });
  });

  it('should read patches only when the request includes them', async () => {
    // Arrange
    persistence.patches.getAll.mockResolvedValue([
      aPatchLog({ taskId: undefined, startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T12:30:00Z' }),
    ]);

    // Act
    const without = await engine.buildReport(customRequest());
    const withPatches = await engine.buildReport(customRequest({ includePatches: true }));

    // Assert
    expect(persistence.patches.getAll).toHaveBeenCalledTimes(1);
    expect([without.totals.seconds, withPatches.totals.seconds]).toEqual([3600, 5400]);
  });

  it('should build an empty report when nothing is stored', async () => {
    // Arrange
    persistence.core.load.mockResolvedValue(null);

    // Act
    const document = await engine.buildReport(customRequest());

    // Assert
    expect(document.totals.seconds).toBe(0);
    expect(document.entries).toEqual([]);
  });

  it('should propagate a persistence failure instead of building a partial report', async () => {
    // Arrange
    persistence.runtimeConfigs.getAll.mockRejectedValue(new Error('storage offline'));

    // Act
    const act = engine.buildReport(customRequest());

    // Assert
    await expect(act).rejects.toThrow('storage offline');
  });

  it('should be reachable through the EnginePlugin', async () => {
    // Arrange
    const plugin = new EnginePlugin({}, engine);

    // Act
    const document = await plugin.buildReport(customRequest({ variant: 'summary' }));

    // Assert
    expect(document.variant).toBe('summary');
  });
});
