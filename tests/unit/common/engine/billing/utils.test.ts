import { describe, it, expect } from 'vitest';
import {
  parseRateToCents,
  parseRateOrCents,
  formatCents,
  calculateBankersAmount,
  MAX_BILLING_RATE_CENTS,
} from '@common/engine/billing/utils';

describe('Unit Tests: billing/utils - parseRateToCents, parseRateOrCents, formatCents', () => {
  describe('parseRateToCents - strict parser parity with Rust', () => {
    it('accepts valid decimal rates', () => {
      expect(parseRateToCents('150.00')).toBe(15000);
      expect(parseRateToCents('150.5')).toBe(15050);
      expect(parseRateToCents('150.55')).toBe(15055);
      expect(parseRateToCents('150')).toBe(15000);
      expect(parseRateToCents('0')).toBe(0);
      expect(parseRateToCents('0.00')).toBe(0);
      expect(parseRateToCents('150.')).toBe(15000);
      expect(parseRateToCents('  125.75  ')).toBe(12575);
    });

    it('rejects invalid inputs without whole component or with scientific/hex notation', () => {
      expect(parseRateToCents('.5')).toBeNull();
      expect(parseRateToCents('.50')).toBeNull();
      expect(parseRateToCents('1e2')).toBeNull();
      expect(parseRateToCents('0x10')).toBeNull();
      expect(parseRateToCents('-0')).toBeNull();
      expect(parseRateToCents('-0.00')).toBeNull();
      expect(parseRateToCents('+150.00')).toBeNull();
      expect(parseRateToCents('+150')).toBeNull();
      expect(parseRateToCents('-150.00')).toBeNull();
      expect(parseRateToCents('abc')).toBeNull();
      expect(parseRateToCents('')).toBeNull();
      expect(parseRateToCents('   ')).toBeNull();
    });

    it('rejects precision greater than two decimal places', () => {
      expect(parseRateToCents('150.999')).toBeNull();
      expect(parseRateToCents('150.1234')).toBeNull();
      expect(parseRateToCents('0.001')).toBeNull();
    });

    it('handles boundary values and rejects overflow beyond safe integers', () => {
      expect(parseRateToCents('90071992547409')).toBe(9007199254740900);
      expect(parseRateToCents('90071992547409.91')).toBe(MAX_BILLING_RATE_CENTS);
      expect(parseRateToCents('90071992547409.92')).toBeNull();
      expect(parseRateToCents('999999999999999999999999999999999999')).toBeNull();
    });
  });

  describe('parseRateOrCents - cents suffix and major units', () => {
    it('accepts integer cents with c or ¢ suffix', () => {
      expect(parseRateOrCents('15000c')).toBe(15000);
      expect(parseRateOrCents('15000¢')).toBe(15000);
      expect(parseRateOrCents('9007199254740991c')).toBe(MAX_BILLING_RATE_CENTS);
      expect(parseRateOrCents('9007199254740992c')).toBeNull();
      expect(parseRateOrCents('0c')).toBe(0);
      expect(parseRateOrCents('  2500c  ')).toBe(2500);
    });

    it('accepts standard decimal and integer major units', () => {
      expect(parseRateOrCents('150.00')).toBe(15000);
      expect(parseRateOrCents('150')).toBe(15000);
      expect(parseRateOrCents('0')).toBe(0);
    });

    it('rejects invalid cents syntax and invalid numeric input', () => {
      expect(parseRateOrCents('15000cc')).toBeNull();
      expect(parseRateOrCents('-15000c')).toBeNull();
      expect(parseRateOrCents('.5c')).toBeNull();
      expect(parseRateOrCents('.5')).toBeNull();
      expect(parseRateOrCents('1e2')).toBeNull();
      expect(parseRateOrCents('0x10')).toBeNull();
      expect(parseRateOrCents('-0')).toBeNull();
      expect(parseRateOrCents('150.999')).toBeNull();
      expect(parseRateOrCents('abc')).toBeNull();
      expect(parseRateOrCents('')).toBeNull();
    });
  });

  describe('formatCents & calculateBankersAmount', () => {
    it('formats cents correctly', () => {
      expect(formatCents(15000)).toBe('150.00');
      expect(formatCents(50)).toBe('0.50');
      expect(formatCents(5)).toBe('0.05');
      expect(formatCents(0)).toBe('0.00');
    });

    it('calculates banker rounding half to even', () => {
      // 50s at 0.36 -> 1800/3600 = 0.5 -> round to even (0) -> 0 cents
      expect(calculateBankersAmount(50, 36)).toBe(0);
      // 150s at 0.36 -> 5400/3600 = 1.5 -> round to even (2) -> 2 cents
      expect(calculateBankersAmount(150, 36)).toBe(2);
      // 3600s at 15000 -> 15000 cents
      expect(calculateBankersAmount(3600, 15000)).toBe(15000);
    });
  });
});
