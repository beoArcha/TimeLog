import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';
import {
  IBillingEngine,
  EffectiveRateResult,
  RangeBillingResult,
} from '@common/engine/billing/types';
import { calculateRangeMetrics } from '../elapsed';

import {
  parseRateToCents,
  formatCents,
  calculateBankersAmount,
} from '@common/engine/billing/utils';
import {
  resolveEffectiveRate,
  calculateRangeBillingFromSnapshot,
} from '@common/engine/billing/resolution';

export {
  parseRateToCents,
  formatCents,
  calculateBankersAmount,
  resolveEffectiveRate,
  calculateRangeBillingFromSnapshot,
};

export class BrowserBillingEngine implements IBillingEngine {
  private persistence: PersistenceRouter;

  constructor(persistence?: PersistenceRouter) {
    this.persistence = persistence ?? PersistenceRouter.getInstance();
  }

  private async getDefaultRateCents(): Promise<number | null> {
    try {
      const configs = await this.persistence.runtimeConfigs?.getAll();
      const cfg = configs?.find(
        (c) =>
          c.id === 'default_billing_rate' ||
          c.id === 'default_rate' ||
          c.runtime === 'billing_default'
      );
      if (cfg?.config) {
        return parseRateToCents(cfg.config);
      }
    } catch {
      // Fall through on config lookup errors
    }
    return null;
  }

  async resolveEffectiveTaskRate(taskId: string): Promise<EffectiveRateResult> {
    const state = await this.persistence.core.load();
    if (!state) {
      return {
        rate: null,
        currency: null,
        status: 'unconfigured',
        source: 'none',
      };
    }

    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) {
      return {
        rate: null,
        currency: null,
        status: 'unconfigured',
        source: 'none',
      };
    }

    const project = state.projects.find((p) => p.id === task.projectId);
    const defaultRateCents = await this.getDefaultRateCents();

    return resolveEffectiveRate(task, project, defaultRateCents);
  }

  async calculateRangeBilling(
    range: ElapsedRangeFilter,
    nowIso?: string
  ): Promise<RangeBillingResult> {
    const state = await this.persistence.core.load();
    if (!state) {
      return {
        byCurrency: {},
        byTask: [],
        totalBillableSeconds: 0,
        totalNonBillableSeconds: 0,
        totalUnconfiguredSeconds: 0,
      };
    }

    const patches = range.includePatches ? await this.persistence.patches.getAll() : [];
    const metrics = calculateRangeMetrics(range, state.tasks, state.logs, nowIso, patches);
    const defaultRateCents = await this.getDefaultRateCents();

    return calculateRangeBillingFromSnapshot(
      metrics,
      state.tasks,
      state.projects,
      defaultRateCents
    );
  }
}
