import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseRateToCents,
  formatCents,
  calculateBankersAmount,
  BrowserBillingEngine,
} from '@plugins/engine/services/BrowserBillingEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import parityVectors from '../../../../fixtures/billing-parity-vectors.json';

describe('BrowserBillingEngine & Billing Helpers', () => {
  describe('Banker Rounding Parity Vectors', () => {
    it.each(parityVectors.roundingVectors)(
      '$description',
      ({ durationSeconds, rate, expectedAmount }) => {
        const rateCents = parseRateToCents(rate);
        expect(rateCents).not.toBeNull();
        const amtCents = calculateBankersAmount(durationSeconds, rateCents!);
        expect(formatCents(amtCents)).toBe(expectedAmount);
      }
    );
  });

  describe('Rate Parsing & Validation Parity Vectors', () => {
    it.each(parityVectors.rateParsingVectors)(
      '$description ($input)',
      ({ input, expectedCents, valid }) => {
        const result = parseRateToCents(input);
        if (valid) {
          expect(result).toBe(expectedCents);
        } else {
          expect(result).toBeNull();
        }
      }
    );
  });

  describe('Rate Resolution & Billing Calculation', () => {
    let billingEngine: BrowserBillingEngine;
    let mockPersistence: {
      core: { load: ReturnType<typeof vi.fn> };
      patches: { getAll: ReturnType<typeof vi.fn> };
      runtimeConfigs: { getAll: ReturnType<typeof vi.fn> };
    };

    beforeEach(() => {
      mockPersistence = {
        core: {
          load: vi.fn(),
        },
        patches: {
          getAll: vi.fn().mockResolvedValue([]),
        },
        runtimeConfigs: {
          getAll: vi.fn().mockResolvedValue([]),
        },
      };
      billingEngine = new BrowserBillingEngine(mockPersistence as unknown as PersistenceRouter);
    });

    it.each(parityVectors.rateResolutionVectors)(
      '$description',
      async (vec: (typeof parityVectors.rateResolutionVectors)[number]) => {
        if (vec.runtimeDefaultRate !== undefined) {
          mockPersistence.runtimeConfigs.getAll.mockResolvedValue([
            { id: 'default_billing_rate', config: vec.runtimeDefaultRate, runtime: 'billing_default' },
          ]);
        }

        mockPersistence.core.load.mockResolvedValue({
          projects: [
            {
              id: 'p1',
              name: 'Project 1',
              color: 'blue',
              archived: false,
              hourlyRate: vec.projectRate ?? null,
              currency: vec.projectCurrency ?? null,
              billingCurrency: vec.projectBillingCurrency ?? undefined,
              billingRateCents: vec.projectBillingRateCents !== undefined ? BigInt(vec.projectBillingRateCents) : undefined,
            },
          ],
          tasks: [
            {
              id: 't1',
              projectId: 'p1',
              name: 'Task 1',
              completed: false,
              hourlyRate: vec.taskRate ?? null,
              currency: vec.taskCurrency ?? undefined,
              billingCurrency: vec.taskBillingCurrency ?? undefined,
              billingRateCents: vec.taskBillingRateCents !== undefined ? BigInt(vec.taskBillingRateCents) : undefined,
            },
          ],
          logs: [],
        });

        const res = await billingEngine.resolveEffectiveTaskRate('t1');
        expect(res.status).toBe(vec.expectedStatus);
        expect(res.rate).toBe(vec.expectedRate);
        expect(res.source).toBe(vec.expectedSource);
        expect(res.currency).toBe(vec.expectedCurrency);
      }
    );

    it('groups range billing by effective task currency override', async () => {
      mockPersistence.core.load.mockResolvedValue({
        projects: [
          { id: 'p1', name: 'Proj 1', color: 'blue', currency: 'USD', hourlyRate: '100.00' },
        ],
        tasks: [
          { id: 't1', projectId: 'p1', name: 'Task USD', hourlyRate: null },
          { id: 't2', projectId: 'p1', name: 'Task EUR', currency: 'EUR', hourlyRate: '200.00' },
        ],
        logs: [
          { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-10-31T10:00:00Z', endTime: '2026-10-31T11:00:00Z' },
          { id: 'l2', taskId: 't2', projectId: 'p1', startTime: '2026-10-31T11:00:00Z', endTime: '2026-10-31T12:00:00Z' },
        ],
      });

      const res = await billingEngine.calculateRangeBilling({
        includePatches: false,
      });

      expect(res.byCurrency['USD']).toBeDefined();
      expect(res.byCurrency['USD'].totalAmount).toBe('100.00');
      expect(res.byCurrency['EUR']).toBeDefined();
      expect(res.byCurrency['EUR'].totalAmount).toBe('200.00');
      expect(res.byTask.find((t) => t.taskId === 't2')?.currency).toBe('EUR');
    });
  });
});
