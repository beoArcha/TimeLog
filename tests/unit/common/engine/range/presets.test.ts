import { describe, it, expect } from 'vitest';
import { presetDays } from '@common/engine/range/presets';
import { resolveRangeAt } from '@common/engine/range/resolveRange';

const NOW = new Date('2026-11-11T21:30:00Z');

describe('presetDays', () => {
  it('should span 30 local days ending today when preset is last30Days', () => {
    // Arrange
    const expected = [Date.parse('2026-10-13T00:00:00Z'), Date.parse('2026-11-12T00:00:00Z')];

    // Act
    const result = presetDays('last30Days', NOW, 'UTC');

    // Assert
    expect(result).toEqual(expected);
  });

  it('should span the local calendar year when preset is year', () => {
    // Arrange
    const expected = [Date.parse('2026-01-01T00:00:00Z'), Date.parse('2027-01-01T00:00:00Z')];

    // Act
    const result = presetDays('year', NOW, 'UTC');

    // Assert
    expect(result).toEqual(expected);
  });

  it('should include the leap day when last30Days ends on 29 February', () => {
    // Arrange
    const leapDay = new Date('2028-02-29T12:00:00Z');

    // Act
    const result = presetDays('last30Days', leapDay, 'UTC');

    // Assert
    expect(result).toEqual([Date.parse('2028-01-31T00:00:00Z'), Date.parse('2028-03-01T00:00:00Z')]);
  });
});

describe('resolveRangeAt', () => {
  it('should keep local midnights across the Warsaw DST end when preset is last30Days', () => {
    // Arrange
    const request = { preset: 'last30Days' } as const;

    // Act
    const result = resolveRangeAt(request, NOW, 'Europe/Warsaw');

    // Assert
    expect(result.from).toBe('2026-10-12T22:00:00Z');
    expect(result.to).toBe('2026-11-11T23:00:00Z');
  });

  it('should use the local year when UTC is still the previous year and preset is year', () => {
    // Arrange
    const request = { preset: 'year' } as const;
    const now = new Date('2026-12-31T23:30:00Z');

    // Act
    const result = resolveRangeAt(request, now, 'Europe/Warsaw');

    // Assert
    expect(result.from).toBe('2026-12-31T23:00:00Z');
    expect(result.to).toBe('2027-12-31T23:00:00Z');
  });
});
