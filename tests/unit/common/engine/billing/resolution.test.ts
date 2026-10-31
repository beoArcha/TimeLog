import { describe, it, expect } from 'vitest';
import {
  resolveEffectiveRate,
  calculateRangeBillingFromSnapshot,
} from '@common/engine/billing/resolution';

describe('Unit Tests: Pure Billing Resolution & Calculator', () => {
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
