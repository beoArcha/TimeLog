import { describe, it, expect } from 'vitest';
import parityVectors from '../../../tests/fixtures/billing-parity-vectors.json';
import {
  calculateBankersAmount,
  formatCents,
  parseRateToCents,
  parseRateOrCents,
} from '@common/engine/billing/utils';
import { resolveEffectiveRate } from '@common/engine/billing/resolution';

describe('Integration Tests: Cross-Runtime Shared Billing Parity Fixture (TypeScript)', () => {
  describe('Rounding Vectors Parity', () => {
    it.each(parityVectors.roundingVectors)(
      '$description: $durationSeconds s @ $rate = $expectedAmount',
      ({ durationSeconds, rate, expectedAmount }) => {
        const rateCents = parseRateToCents(rate);
        expect(rateCents).not.toBeNull();
        const amountCents = calculateBankersAmount(durationSeconds, rateCents!);
        expect(formatCents(amountCents)).toBe(expectedAmount);
      }
    );
  });

  describe('Rate Parsing Vectors Parity (Strict Decimal Syntax)', () => {
    it.each(parityVectors.rateParsingVectors)(
      '$description: "$input"',
      ({ input, expectedCents, valid }) => {
        const parsed = parseRateToCents(input);
        if (valid) {
          expect(parsed).toBe(expectedCents);
        } else {
          expect(parsed).toBeNull();
        }
      }
    );
  });

  describe('Rate or Cents Parsing Vectors Parity (Major Units & "c" Suffix)', () => {
    it.each(parityVectors.rateOrCentsParsingVectors)(
      '$description: "$input"',
      ({ input, expectedCents, valid }) => {
        const parsed = parseRateOrCents(input);
        if (valid) {
          expect(parsed).toBe(expectedCents);
        } else {
          expect(parsed).toBeNull();
        }
      }
    );
  });

  describe('Rate Resolution Vectors Parity (Precedence, Inheritance, Normalization)', () => {
    it.each(parityVectors.rateResolutionVectors)(
      '$description',
      (vec) => {
        const task = {
          hourlyRate: vec.taskRate ?? null,
          currency: vec.taskCurrency ?? null,
          billingCurrency: vec.taskBillingCurrency ?? null,
          billingRateCents: vec.taskBillingRateCents !== undefined ? BigInt(vec.taskBillingRateCents) : null,
        };

        const project = {
          hourlyRate: vec.projectRate ?? null,
          currency: vec.projectCurrency ?? null,
          billingCurrency: vec.projectBillingCurrency ?? null,
          billingRateCents: vec.projectBillingRateCents !== undefined ? BigInt(vec.projectBillingRateCents) : null,
        };

        const defaultRateCents = vec.runtimeDefaultRate ? parseRateToCents(vec.runtimeDefaultRate) : null;

        const result = resolveEffectiveRate(task, project, defaultRateCents);

        expect(result.status).toBe(vec.expectedStatus);
        expect(result.rate).toBe(vec.expectedRate);
        expect(result.currency).toBe(vec.expectedCurrency);
        expect(result.source).toBe(vec.expectedSource);
      }
    );
  });
});
