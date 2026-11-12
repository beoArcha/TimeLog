import { describe, it, expect } from 'vitest';
import type { RuntimeConfig } from '@bindings/RuntimeConfig';
import { defaultRateCentsFromConfigs } from '@common/engine/billing/defaultRate';

const aConfig = (overrides: Partial<RuntimeConfig>): RuntimeConfig => ({
  id: 'other',
  runtime: 'other',
  config: '',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('defaultRateCentsFromConfigs', () => {
  it.each([
    ['its id is default_billing_rate', { id: 'default_billing_rate' }],
    ['its id is default_rate', { id: 'default_rate' }],
    ['its runtime is billing_default', { runtime: 'billing_default' }],
  ])('should read the rate when %s', (_label, overrides) => {
    // Arrange
    const configs = [aConfig({ ...overrides, config: '42.50' })];

    // Act
    const result = defaultRateCentsFromConfigs(configs);

    // Assert
    expect(result).toBe(4250);
  });

  it('should return null when no config carries the default rate', () => {
    // Arrange
    const configs = [aConfig({ config: '42.50' })];

    // Act
    const result = defaultRateCentsFromConfigs(configs);

    // Assert
    expect(result).toBeNull();
  });

  it('should return null when the matching config holds an unparseable rate', () => {
    // Arrange
    const configs = [aConfig({ id: 'default_rate', config: 'abc' })];

    // Act
    const result = defaultRateCentsFromConfigs(configs);

    // Assert
    expect(result).toBeNull();
  });

  it('should read the first matching config only', () => {
    // Arrange
    const configs = [
      aConfig({ id: 'default_rate', config: '1.00' }),
      aConfig({ id: 'default_billing_rate', config: '2.00' }),
    ];

    // Act
    const result = defaultRateCentsFromConfigs(configs);

    // Assert
    expect(result).toBe(100);
  });
});
