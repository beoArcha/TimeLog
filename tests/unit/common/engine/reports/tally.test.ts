import { describe, it, expect } from 'vitest';
import type { Billing } from '@common/engine/reports/billing';
import { BUSINESS_VIOLATION_CODE } from '@common/engine/reports/errors';
import { Tally } from '@common/engine/reports/tally';

const billing = (overrides: Partial<Billing>): Billing => ({ rateStatus: 'inherited', ...overrides });

describe('Tally', () => {
  it('should split document seconds by rate status', () => {
    // Arrange
    const tally = new Tally();

    // Act
    tally.addTask(billing({ rateStatus: 'custom', currency: 'USD', amountMinor: 10 }), 100);
    tally.addTask(billing({ rateStatus: 'nonBillable', currency: 'USD', amountMinor: 0 }), 20);
    tally.addTask(billing({ rateStatus: 'unconfigured' }), 3);
    tally.addTaskless(4);

    // Assert
    expect(tally.split()).toEqual({ billable: 100, nonBillable: 20, unconfigured: 7 });
  });

  it('should ignore a task without direct seconds', () => {
    // Arrange
    const tally = new Tally();

    // Act
    tally.addTask(billing({ currency: 'USD', amountMinor: 99 }), 0);

    // Assert
    expect(tally.currencyTotals()).toEqual([]);
  });

  it('should leave time without a currency out of every bucket but keep it in the split', () => {
    // Arrange
    const tally = new Tally();

    // Act
    tally.addTask(billing({ amountMinor: 500 }), 60);

    // Assert
    expect([tally.currencyTotals(), tally.split().billable]).toEqual([[], 60]);
  });

  it('should list currencies ascending regardless of insertion order', () => {
    // Arrange
    const tally = new Tally();
    tally.addTask(billing({ currency: 'USD', amountMinor: 1 }), 1);
    tally.addTask(billing({ currency: 'EUR', amountMinor: 2 }), 1);
    tally.addTask(billing({ currency: 'PLN', amountMinor: 3 }), 1);

    // Act
    const currencies = tally.currencyTotals().map((total) => total.currency);

    // Assert
    expect(currencies).toEqual(['EUR', 'PLN', 'USD']);
  });

  it('should sum amounts and split seconds within a currency bucket', () => {
    // Arrange
    const tally = new Tally();
    tally.addTask(billing({ currency: 'USD', amountMinor: 100 }), 10);
    tally.addTask(billing({ rateStatus: 'nonBillable', currency: 'USD', amountMinor: 0 }), 5);
    tally.addTask(billing({ rateStatus: 'unconfigured', currency: 'USD' }), 2);

    // Act
    const [usd] = tally.currencyTotals();

    // Assert
    expect(usd).toEqual({
      currency: 'USD',
      amountMinor: 100,
      billableSeconds: 10,
      nonBillableSeconds: 5,
      unconfiguredSeconds: 2,
    });
  });

  it('should add another tally into this one bucket by bucket', () => {
    // Arrange
    const first = new Tally();
    first.addTask(billing({ currency: 'USD', amountMinor: 100 }), 10);
    first.addTaskless(1);
    const second = new Tally();
    second.addTask(billing({ currency: 'USD', amountMinor: 50 }), 5);
    second.addTask(billing({ currency: 'EUR', amountMinor: 7 }), 1);

    // Act
    first.merge(second);

    // Assert
    expect(first.currencyTotals()).toEqual([
      { currency: 'EUR', amountMinor: 7, billableSeconds: 1, nonBillableSeconds: 0, unconfiguredSeconds: 0 },
      { currency: 'USD', amountMinor: 150, billableSeconds: 15, nonBillableSeconds: 0, unconfiguredSeconds: 0 },
    ]);
    expect(first.split()).toEqual({ billable: 16, nonBillable: 0, unconfigured: 1 });
  });

  it('should fail when adding a task pushes a bucket past the safe integer limit', () => {
    // Arrange
    const tally = new Tally();
    tally.addTask(billing({ currency: 'USD', amountMinor: Number.MAX_SAFE_INTEGER }), 1);

    // Act
    const act = () => tally.addTask(billing({ currency: 'USD', amountMinor: 1 }), 1);

    // Assert
    expect(act).toThrow(expect.objectContaining({ code: BUSINESS_VIOLATION_CODE }));
  });

  it('should fail when merging pushes a bucket past the safe integer limit', () => {
    // Arrange
    const first = new Tally();
    first.addTask(billing({ currency: 'USD', amountMinor: Number.MAX_SAFE_INTEGER }), 1);
    const second = new Tally();
    second.addTask(billing({ currency: 'USD', amountMinor: 1 }), 1);

    // Act
    const act = () => first.merge(second);

    // Assert
    expect(act).toThrow(expect.objectContaining({ code: BUSINESS_VIOLATION_CODE }));
  });

  it('should accept a bucket sitting exactly at the safe integer limit', () => {
    // Arrange
    const tally = new Tally();

    // Act
    tally.addTask(billing({ currency: 'USD', amountMinor: Number.MAX_SAFE_INTEGER }), 1);

    // Assert
    expect(tally.currencyTotals()[0].amountMinor).toBe(Number.MAX_SAFE_INTEGER);
  });
});
