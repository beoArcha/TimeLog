import { describe, it, expect } from 'vitest';
import {
  normalizeCurrency,
  resolveEffectiveCurrency,
  resolveEffectiveRate,
  calculateRangeBillingFromSnapshot,
} from '@common/engine/billing/resolution';

describe('Unit Tests: Pure Billing Resolution & Calculator', () => {
  describe('normalizeCurrency', () => {
    it('normalizes lowercase currency to uppercase', () => {
      expect(normalizeCurrency('usd')).toBe('USD');
      expect(normalizeCurrency('eur')).toBe('EUR');
    });

    it('trims surrounding whitespace and converts to uppercase', () => {
      expect(normalizeCurrency('  usd  ')).toBe('USD');
      expect(normalizeCurrency('   pln ')).toBe('PLN');
    });

    it('returns null for null, undefined, empty string, and whitespace-only', () => {
      expect(normalizeCurrency(null)).toBeNull();
      expect(normalizeCurrency(undefined)).toBeNull();
      expect(normalizeCurrency('')).toBeNull();
      expect(normalizeCurrency('   ')).toBeNull();
      expect(normalizeCurrency('\t\n ')).toBeNull();
    });
  });

  describe('resolveEffectiveCurrency precedence', () => {
    it('respects task billingCurrency over task currency', () => {
      const res = resolveEffectiveCurrency(
        { billingCurrency: 'usd', currency: 'eur' },
        { billingCurrency: 'pln', currency: 'gbp' }
      );
      expect(res).toBe('USD');
    });

    it('respects task currency over project billingCurrency', () => {
      const res = resolveEffectiveCurrency(
        { billingCurrency: '  ', currency: 'chf' },
        { billingCurrency: 'pln', currency: 'gbp' }
      );
      expect(res).toBe('CHF');
    });

    it('respects project billingCurrency over project currency', () => {
      const res = resolveEffectiveCurrency(
        { billingCurrency: null, currency: '' },
        { billingCurrency: 'cad', currency: 'gbp' }
      );
      expect(res).toBe('CAD');
    });

    it('falls back to project currency when other levels are absent or whitespace', () => {
      const res = resolveEffectiveCurrency(
        { billingCurrency: null, currency: '   ' },
        { billingCurrency: '', currency: ' aud ' }
      );
      expect(res).toBe('AUD');
    });

    it('returns null when all levels are null or whitespace', () => {
      const res = resolveEffectiveCurrency(
        { billingCurrency: '  ', currency: '' },
        { billingCurrency: null, currency: '   ' }
      );
      expect(res).toBeNull();
    });
  });

  describe('resolveEffectiveRate', () => {
    it('resolves task override directly without project', () => {
      const res = resolveEffectiveRate(
        { hourlyRate: '150.00', currency: 'USD' },
        null,
        null
      );
      expect(res).toEqual({
        rate: '150.00',
        currency: 'USD',
        status: 'custom',
        source: 'task',
      });
    });

    it('resolves project rate inheritance when task rate is null', () => {
      const res = resolveEffectiveRate(
        { hourlyRate: null, currency: null },
        { hourlyRate: '90.00', currency: 'EUR' },
        null
      );
      expect(res).toEqual({
        rate: '90.00',
        currency: 'EUR',
        status: 'inherited',
        source: 'project',
      });
    });

    it('resolves runtime default rate when both task and project rates are missing', () => {
      const res = resolveEffectiveRate(
        { hourlyRate: null, currency: null },
        { hourlyRate: null, currency: 'GBP' },
        4500
      );
      expect(res).toEqual({
        rate: '45.00',
        currency: 'GBP',
        status: 'inherited',
        source: 'default',
      });
    });

    it('falls back to unconfigured when no rate exists', () => {
      const res = resolveEffectiveRate(
        { hourlyRate: null, currency: null },
        { hourlyRate: null, currency: null },
        null
      );
      expect(res).toEqual({
        rate: null,
        currency: null,
        status: 'unconfigured',
        source: 'none',
      });
    });

    it('returns normalized currency in EffectiveRateResult', () => {
      const res = resolveEffectiveRate(
        { hourlyRate: '150.00', currency: '  usd ' },
        { currency: 'eur' }
      );
      expect(res.currency).toBe('USD');
      expect(res.status).toBe('custom');
      expect(res.rate).toBe('150.00');
      expect(res.source).toBe('task');
    });

    it('returns null currency when task and project currencies are whitespace-only', () => {
      const res = resolveEffectiveRate(
        { hourlyRate: '150.00', currency: '   ' },
        { currency: '  ' }
      );
      expect(res.currency).toBeNull();
    });
  });

  describe('calculateRangeBillingFromSnapshot', () => {
    it('aggregates billable and unconfigured tasks correctly', () => {
      const tasks = [
        {
          id: 't1',
          projectId: 'p1',
          name: 'Task 1',
          hourlyRate: '100.00',
          currency: 'USD',
          completed: false,
          createdAt: '2026-10-31T00:00:00Z',
        },
        {
          id: 't2',
          projectId: 'p1',
          name: 'Task 2',
          hourlyRate: null,
          currency: null,
          completed: false,
          createdAt: '2026-10-31T00:00:00Z',
        },
      ];
      const projects = [
        {
          id: 'p1',
          name: 'Project 1',
          color: '#3b82f6',
          currency: 'USD',
          hourlyRate: null,
          createdAt: '2026-10-31T00:00:00Z',
        },
      ];
      const metrics = {
        taskElapsed: {
          t1: 3600,
          t2: 1800,
        },
      };

      const result = calculateRangeBillingFromSnapshot(metrics, tasks, projects, null);

      expect(result.totalBillableSeconds).toBe(3600);
      expect(result.totalUnconfiguredSeconds).toBe(1800);
      expect(result.byCurrency['USD'].totalAmount).toBe('100.00');
      expect(result.byTask).toHaveLength(2);
    });
  });
});
