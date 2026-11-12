import type { ReportRateStatus } from '@bindings/ReportRateStatus';
import type { Task } from '@bindings/Task';
import { resolveEffectiveRate } from '../billing/resolution';
import type { RateStatus } from '../billing/types';
import { calculateBankersAmount, parseRateToCents } from '../billing/utils';
import type { Catalog } from './catalog';
import { MAX_SAFE_AMOUNT_MINOR, MSG_UNPARSEABLE_RATE } from './constants';
import { amountOutOfRange, businessViolation } from './errors';

/** What one task (or one of its entries) earns for a given number of seconds. */
export interface Billing {
  readonly rateMinor?: number;
  readonly currency?: string;
  readonly rateStatus: ReportRateStatus;
  readonly amountMinor?: number;
}

const REPORT_RATE_STATUS: Record<RateStatus, ReportRateStatus> = {
  inherited: 'inherited',
  custom: 'custom',
  non_billable: 'nonBillable',
  unconfigured: 'unconfigured',
};

export function toReportRateStatus(status: RateStatus): ReportRateStatus {
  return REPORT_RATE_STATUS[status];
}

export function ensureSafe(amount: number): number {
  if (amount > MAX_SAFE_AMOUNT_MINOR) throw amountOutOfRange();
  return amount;
}

/** Banker's rounding per call, so a task is rounded once and an entry once; the two need not agree. */
export function amountMinor(seconds: number, rateMinor: number): number {
  // Unlike Rust there is no u64 narrowing to guard against: a rounded value past 2^53 is already above the limit.
  return ensureSafe(calculateBankersAmount(seconds, rateMinor));
}

/**
 * Resolves rates through the same inheritance chain as `calculateRangeBillingFromSnapshot`, so reports
 * can never disagree with range billing.
 */
export class RateResolver {
  constructor(
    private readonly catalog: Catalog,
    private readonly defaultRateCents: number | null
  ) {}

  bill(task: Task, seconds: number): Billing {
    const project = this.catalog.project(task.projectId);
    const effective = resolveEffectiveRate(task, project, this.defaultRateCents);
    const rateMinor = effective.rate === null ? undefined : this.parseRate(effective.rate);
    return {
      rateMinor,
      currency: effective.currency ?? undefined,
      rateStatus: toReportRateStatus(effective.status),
      amountMinor: rateMinor === undefined ? undefined : amountMinor(seconds, rateMinor),
    };
  }

  private parseRate(rate: string): number {
    const cents = parseRateToCents(rate);
    if (cents === null) throw businessViolation(`${MSG_UNPARSEABLE_RATE} '${rate}'`);
    return cents;
  }
}
