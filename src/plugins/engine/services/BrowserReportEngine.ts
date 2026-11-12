import type { ReportDocument } from '@bindings/ReportDocument';
import type { ReportRequest } from '@bindings/ReportRequest';
import { defaultRateCentsFromConfigs } from '@common/engine/billing/defaultRate';
import { resolveRangeAt } from '@common/engine/range/resolveRange';
import { resolveTimezone } from '@common/engine/range/timezone';
import { buildReportAt, includesPatches, type ReportSnapshot } from '@common/engine/reports';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';

export class BrowserReportEngine {
  private persistence: PersistenceRouter;

  constructor(persistence?: PersistenceRouter) {
    this.persistence = persistence ?? PersistenceRouter.getInstance();
  }

  async buildReport(request: ReportRequest): Promise<ReportDocument> {
    // One instant drives both range presets and running-entry measurement.
    const now = new Date();
    const settings = await this.persistence.settings.get();
    const timeZone = resolveTimezone(request.range.timezone, settings.timezone);
    const range = resolveRangeAt(request.range, now, timeZone);
    const snapshot = await this.loadSnapshot(includesPatches(request));
    return buildReportAt(snapshot, request, range, now);
  }

  private async loadSnapshot(includePatches: boolean): Promise<ReportSnapshot> {
    const state = await this.persistence.core.load();
    const patches = includePatches ? await this.persistence.patches.getAll() : [];
    const configs = await this.persistence.runtimeConfigs.getAll();
    return {
      projects: state?.projects ?? [],
      tasks: state?.tasks ?? [],
      logs: state?.logs ?? [],
      patches,
      defaultRateCents: defaultRateCentsFromConfigs(configs),
    };
  }
}
