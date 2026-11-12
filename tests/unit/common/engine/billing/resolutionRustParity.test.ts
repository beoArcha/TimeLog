import { describe, it, expect } from 'vitest';
import { MAX_BILLING_RATE_CENTS } from '@common/engine/billing/utils';
import { normalizeCurrency, resolveEffectiveRate } from '@common/engine/billing/resolution';

describe('resolveEffectiveRate stored cents validation', () => {
  it('should skip a negative stored task rate and inherit the project rate', () => {
    // Arrange
    const task = { billingRateCents: -5, hourlyRate: '99.00' };
    const project = { hourlyRate: '40.00' };

    // Act
    const result = resolveEffectiveRate(task, project);

    // Assert
    expect(result).toMatchObject({ rate: '40.00', status: 'inherited', source: 'project' });
  });

  it('should not fall back to the legacy hourly rate string when the stored cents are invalid', () => {
    // Arrange
    const task = { billingRateCents: -1, hourlyRate: '99.00' };

    // Act
    const result = resolveEffectiveRate(task, null);

    // Assert
    expect(result.status).toBe('unconfigured');
  });

  it('should skip stored cents above the supported maximum', () => {
    // Arrange
    const task = { billingRateCents: BigInt(MAX_BILLING_RATE_CENTS) + 1n };
    const project = { billingRateCents: 2500 };

    // Act
    const result = resolveEffectiveRate(task, project);

    // Assert
    expect(result).toMatchObject({ rate: '25.00', source: 'project' });
  });

  it('should accept stored cents exactly at the supported maximum', () => {
    // Arrange
    const task = { billingRateCents: BigInt(MAX_BILLING_RATE_CENTS) };

    // Act
    const result = resolveEffectiveRate(task, null);

    // Assert
    expect(result).toMatchObject({ rate: '90071992547409.91', status: 'custom' });
  });

  it('should treat zero stored cents as non-billable', () => {
    // Arrange
    const task = { billingRateCents: 0 };

    // Act
    const result = resolveEffectiveRate(task, { hourlyRate: '50.00' });

    // Assert
    expect(result).toMatchObject({ rate: '0.00', status: 'non_billable', source: 'task' });
  });

  it('should skip a non-integer stored number', () => {
    // Arrange
    const task = { billingRateCents: 12.5 };

    // Act
    const result = resolveEffectiveRate(task, { billingRateCents: 700 });

    // Assert
    expect(result).toMatchObject({ rate: '7.00', source: 'project' });
  });

  it('should prefer stored cents over the legacy hourly rate string', () => {
    // Arrange
    const project = { billingRateCents: BigInt(777), hourlyRate: '1.00' };

    // Act
    const result = resolveEffectiveRate({}, project);

    // Assert
    expect(result).toMatchObject({ rate: '7.77', source: 'project' });
  });
});

describe('normalizeCurrency ASCII casing', () => {
  it('should leave non-ASCII letters untouched like the Rust engine', () => {
    // Arrange
    const raw = ' ßx ';

    // Act
    const result = normalizeCurrency(raw);

    // Assert
    expect(result).toBe('ßX');
  });
});
