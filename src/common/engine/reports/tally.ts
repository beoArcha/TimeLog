import type { ReportBillingTotal } from '@bindings/ReportBillingTotal';
import type { ReportRateStatus } from '@bindings/ReportRateStatus';
import { type Billing, ensureSafe } from './billing';
import { compareIds } from './ordering';

/** Seconds split by rate status. */
export interface SecondsSplit {
  billable: number;
  nonBillable: number;
  unconfigured: number;
}

const emptySplit = (): SecondsSplit => ({ billable: 0, nonBillable: 0, unconfigured: 0 });

function addToSplit(split: SecondsSplit, status: ReportRateStatus, seconds: number): void {
  switch (status) {
    case 'inherited':
    case 'custom':
      split.billable += seconds;
      return;
    case 'nonBillable':
      split.nonBillable += seconds;
      return;
    case 'unconfigured':
      split.unconfigured += seconds;
  }
}

function mergeSplit(target: SecondsSplit, other: SecondsSplit): void {
  target.billable += other.billable;
  target.nonBillable += other.nonBillable;
  target.unconfigured += other.unconfigured;
}

interface Bucket {
  split: SecondsSplit;
  amountMinor: number;
}

/**
 * Seconds and amounts of one scope (a project or the whole document). Per-currency buckets only see
 * time whose task resolved a currency; the split sees all time.
 */
export class Tally {
  private readonly total = emptySplit();
  private readonly byCurrency = new Map<string, Bucket>();

  addTask(billing: Billing, directSeconds: number): void {
    if (directSeconds === 0) return;
    addToSplit(this.total, billing.rateStatus, directSeconds);
    if (billing.currency === undefined) return;
    const bucket = this.bucket(billing.currency);
    addToSplit(bucket.split, billing.rateStatus, directSeconds);
    // Two safe integers sum to at most 2^54, which still rounds to a value above the limit when it overflows.
    bucket.amountMinor = ensureSafe(bucket.amountMinor + (billing.amountMinor ?? 0));
  }

  /** Time without a task has no rate to resolve, so it is unconfigured and has no currency. */
  addTaskless(seconds: number): void {
    addToSplit(this.total, 'unconfigured', seconds);
  }

  merge(other: Tally): void {
    mergeSplit(this.total, other.total);
    for (const [currency, incoming] of other.byCurrency) {
      const bucket = this.bucket(currency);
      mergeSplit(bucket.split, incoming.split);
      bucket.amountMinor = ensureSafe(bucket.amountMinor + incoming.amountMinor);
    }
  }

  split(): Readonly<SecondsSplit> {
    return this.total;
  }

  /** Sorted explicitly because `Map` iterates in insertion order; the contract requires ascending currencies. */
  currencyTotals(): ReportBillingTotal[] {
    return [...this.byCurrency.keys()].sort(compareIds).map((currency) => {
      const bucket = this.bucket(currency);
      return {
        currency,
        amountMinor: bucket.amountMinor,
        billableSeconds: bucket.split.billable,
        nonBillableSeconds: bucket.split.nonBillable,
        unconfiguredSeconds: bucket.split.unconfigured,
      };
    });
  }

  private bucket(currency: string): Bucket {
    let bucket = this.byCurrency.get(currency);
    if (!bucket) {
      bucket = { split: emptySplit(), amountMinor: 0 };
      this.byCurrency.set(currency, bucket);
    }
    return bucket;
  }
}
