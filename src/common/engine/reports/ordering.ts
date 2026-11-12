import type { ReportEntry } from '@bindings/ReportEntry';
import { BASIS_POINTS_FULL, MAX_BASIS_POINTS } from './constants';

export interface Ranked {
  readonly id: string;
  readonly seconds: number;
}

/** Plain `<` compares UTF-16 code units, matching Rust's byte order for the ASCII ids the app generates. */
export function compareIds(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Projects, root tasks and sibling subtasks share one rule: most time first, `id` breaks ties. */
export function compareSecondsDescThenId(a: Ranked, b: Ranked): number {
  if (a.seconds !== b.seconds) return a.seconds < b.seconds ? 1 : -1;
  return compareIds(a.id, b.id);
}

/** `start` is normalized to fixed-width RFC3339 UTC, so string order equals chronological order. */
export function sortEntries(entries: ReportEntry[]): void {
  entries.sort((a, b) => compareIds(a.start, b.start) || compareIds(a.id, b.id));
}

/** Round-half-to-even keeps repeated rounding unbiased; integer math keeps output identical across runtimes. */
export function shareBasisPoints(seconds: number, totalSeconds: number): number {
  if (totalSeconds === 0) return 0;
  // seconds × 10 000 can pass 2^53 for very large totals, so the product is exact only as a BigInt.
  const numerator = BigInt(seconds) * BASIS_POINTS_FULL;
  const total = BigInt(totalSeconds);
  const quotient = numerator / total;
  const doubledRemainder = (numerator % total) * 2n;

  const roundedUp = doubledRemainder > total || (doubledRemainder === total && quotient % 2n === 1n);
  const rounded = quotient + (roundedUp ? 1n : 0n);
  return rounded > BigInt(MAX_BASIS_POINTS) ? MAX_BASIS_POINTS : Number(rounded);
}
