import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';

export type RateMode = 'inherit' | 'custom' | 'non_billable';

export type RateStatus = 'inherited' | 'custom' | 'non_billable' | 'unconfigured';

export interface EffectiveRateResult {
  readonly rate: string | null;
  readonly currency: string | null;
  readonly status: RateStatus;
  readonly source: 'task' | 'project' | 'none';
}

export interface TaskBillingSummary {
  readonly taskId: string;
  readonly taskName: string;
  readonly projectId: string;
  readonly durationSeconds: number;
  readonly effectiveRate: string | null;
  readonly currency: string | null;
  readonly rateStatus: RateStatus;
  readonly amount: string | null;
}

export interface CurrencyBillingSummary {
  readonly currency: string;
  readonly totalAmount: string;
  readonly billableDurationSeconds: number;
  readonly nonBillableDurationSeconds: number;
  readonly unconfiguredDurationSeconds: number;
}

export interface RangeBillingResult {
  readonly byCurrency: Record<string, CurrencyBillingSummary>;
  readonly byTask: TaskBillingSummary[];
  readonly totalBillableSeconds: number;
  readonly totalNonBillableSeconds: number;
  readonly totalUnconfiguredSeconds: number;
}

export interface IBillingEngine {
  calculateRangeBilling(range: ElapsedRangeFilter, nowIso?: string): Promise<RangeBillingResult>;
  resolveEffectiveTaskRate(taskId: string): Promise<EffectiveRateResult>;
}
