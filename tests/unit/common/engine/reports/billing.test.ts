import { describe, it, expect } from 'vitest';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';
import { RateResolver, amountMinor, ensureSafe, toReportRateStatus } from '@common/engine/reports/billing';
import { Catalog } from '@common/engine/reports/catalog';
import { BUSINESS_VIOLATION_CODE } from '@common/engine/reports/errors';

const SAFE_LIMIT = Number.MAX_SAFE_INTEGER;

describe('amountMinor', () => {
  it('should round an exact half down to the even cent', () => {
    // Arrange: 18 s at 100 minor units per hour is 0.5
    const [seconds, rate] = [18, 100];

    // Act
    const result = amountMinor(seconds, rate);

    // Assert
    expect(result).toBe(0);
  });

  it('should round an exact half up to the even cent', () => {
    // Arrange: 54 s at 100 minor units per hour is 1.5
    const [seconds, rate] = [54, 100];

    // Act
    const result = amountMinor(seconds, rate);

    // Assert
    expect(result).toBe(2);
  });

  it('should keep the even cent when the half follows an even quotient', () => {
    // Arrange: 90 s at 100 minor units per hour is 2.5
    const [seconds, rate] = [90, 100];

    // Act
    const result = amountMinor(seconds, rate);

    // Assert
    expect(result).toBe(2);
  });

  it('should round above half up', () => {
    // Arrange: 1 s at 1801 per hour is 0.5003
    const [seconds, rate] = [1, 1801];

    // Act
    const result = amountMinor(seconds, rate);

    // Assert
    expect(result).toBe(1);
  });

  it('should round below half down', () => {
    // Arrange: 1 s at 1799 per hour is 0.4997
    const [seconds, rate] = [1, 1799];

    // Act
    const result = amountMinor(seconds, rate);

    // Assert
    expect(result).toBe(0);
  });

  it('should accept an amount exactly at the safe integer limit', () => {
    // Arrange
    const [seconds, rate] = [3600, SAFE_LIMIT];

    // Act
    const result = amountMinor(seconds, rate);

    // Assert
    expect(result).toBe(SAFE_LIMIT);
  });

  it('should reject a floor beyond the safe integer limit', () => {
    // Arrange
    const [seconds, rate] = [7200, SAFE_LIMIT];

    // Act
    const act = () => amountMinor(seconds, rate);

    // Assert
    expect(act).toThrow(expect.objectContaining({ code: BUSINESS_VIOLATION_CODE }));
  });

  it('should reject a rounding carry that lands one past the safe integer limit', () => {
    // Arrange: the floor is exactly the limit and the remainder (2892/3600) rounds it up to 2^53
    const [seconds, rate] = [3603, 8_999_699_505_153_364];

    // Act
    const act = () => amountMinor(seconds, rate);

    // Assert
    expect(act).toThrow(expect.objectContaining({ code: BUSINESS_VIOLATION_CODE }));
  });
});

describe('ensureSafe', () => {
  it('should return the amount when it equals the safe integer limit', () => {
    // Arrange
    const amount = SAFE_LIMIT;

    // Act
    const result = ensureSafe(amount);

    // Assert
    expect(result).toBe(SAFE_LIMIT);
  });

  it('should throw when the amount is one past the safe integer limit', () => {
    // Arrange
    const amount = SAFE_LIMIT + 1;

    // Act
    const act = () => ensureSafe(amount);

    // Assert
    expect(act).toThrow(expect.objectContaining({ code: BUSINESS_VIOLATION_CODE }));
  });
});

describe('toReportRateStatus', () => {
  it.each([
    ['inherited', 'inherited'],
    ['custom', 'custom'],
    ['non_billable', 'nonBillable'],
    ['unconfigured', 'unconfigured'],
  ] as const)('should map %s to the camelCase value %s', (status, expected) => {
    // Arrange
    const input = status;

    // Act
    const result = toReportRateStatus(input);

    // Assert
    expect(result).toBe(expected);
  });
});

describe('RateResolver', () => {
  const resolverFor = (project: ReturnType<typeof aProject>, defaultRateCents: number | null = null) =>
    new RateResolver(new Catalog([project], []), defaultRateCents);

  it('should leave rate and amount absent when nothing configures a rate', () => {
    // Arrange
    const resolver = resolverFor(aProject({ currency: 'usd' }));

    // Act
    const billing = resolver.bill(aTask(), 3600);

    // Assert
    expect(billing).toEqual({
      rateMinor: undefined,
      currency: 'USD',
      rateStatus: 'unconfigured',
      amountMinor: undefined,
    });
  });

  it('should bill zero for a non-billable task', () => {
    // Arrange
    const resolver = resolverFor(aProject({ hourlyRate: '50.00' }));
    const task = aTask({ hourlyRate: '0' });

    // Act
    const billing = resolver.bill(task, 3600);

    // Assert
    expect(billing).toMatchObject({ rateMinor: 0, rateStatus: 'nonBillable', amountMinor: 0 });
  });

  it('should round the amount once from the given seconds at the inherited rate', () => {
    // Arrange
    const resolver = resolverFor(aProject({ hourlyRate: '60.00', currency: 'EUR' }));

    // Act
    const billing = resolver.bill(aTask(), 1800);

    // Assert
    expect(billing).toEqual({ rateMinor: 6000, currency: 'EUR', rateStatus: 'inherited', amountMinor: 3000 });
  });

  it('should use the default rate when task and project configure none', () => {
    // Arrange
    const resolver = resolverFor(aProject(), 4200);

    // Act
    const billing = resolver.bill(aTask(), 3600);

    // Assert
    expect(billing).toMatchObject({ rateMinor: 4200, rateStatus: 'inherited', amountMinor: 4200 });
  });

  it('should fail with a not-found error when the task project is unknown', () => {
    // Arrange
    const resolver = resolverFor(aProject({ id: 'other' }));

    // Act
    const act = () => resolver.bill(aTask({ projectId: 'ghost' }), 60);

    // Assert
    expect(act).toThrow(expect.objectContaining({ code: 'DOM_ENTITY_NOT_FOUND' }));
  });
});
