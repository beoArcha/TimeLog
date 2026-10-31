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

  describe('Rate Resolution & Billing Calculation', () => {
    let billingEngine: BrowserBillingEngine;
    let mockPersistence: {
      core: { load: ReturnType<typeof vi.fn> };
      patches: { getAll: ReturnType<typeof vi.fn> };
    };

    beforeEach(() => {
      mockPersistence = {
        core: {
          load: vi.fn(),
        },
        patches: {
          getAll: vi.fn().mockResolvedValue([]),
        },
      };
      billingEngine = new BrowserBillingEngine(mockPersistence as unknown as PersistenceRouter);
    });

    it.each(parityVectors.rateResolutionVectors)(
      '$description',
      async ({ taskRate, projectRate, projectCurrency, expectedStatus, expectedRate, expectedSource }) => {
        mockPersistence.core.load.mockResolvedValue({
          projects: [
            {
              id: 'p1',
              name: 'Project 1',
              color: 'blue',
              archived: false,
              hourlyRate: projectRate,
              currency: projectCurrency,
            },
          ],
          tasks: [
            {
              id: 't1',
              projectId: 'p1',
              name: 'Task 1',
              completed: false,
              hourlyRate: taskRate,
            },
          ],
          logs: [],
        });

        const res = await billingEngine.resolveEffectiveTaskRate('t1');
        expect(res.status).toBe(expectedStatus);
        expect(res.rate).toBe(expectedRate);
        expect(res.source).toBe(expectedSource);
        expect(res.currency).toBe(projectCurrency);
      }
    );
  });
});
