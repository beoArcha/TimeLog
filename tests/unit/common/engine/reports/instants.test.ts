import { describe, it, expect } from 'vitest';
import {
  formatDay,
  localDateString,
  normalizeInstant,
  parseInstant,
  wholeSecondsBetween,
} from '@common/engine/reports/instants';
import { INVALID_TIMESTAMP_CODE } from '@common/engine/reports/errors';

describe('parseInstant', () => {
  it.each([
    ['a Z suffix', '2026-06-15T10:00:00Z', Date.UTC(2026, 5, 15, 10)],
    ['a lowercase z and t', '2026-06-15t10:00:00z', Date.UTC(2026, 5, 15, 10)],
    ['a space separator', '2026-06-15 10:00:00Z', Date.UTC(2026, 5, 15, 10)],
    ['a positive offset', '2026-06-15T12:00:00+02:00', Date.UTC(2026, 5, 15, 10)],
    ['a negative offset', '2026-06-15T05:30:00-04:30', Date.UTC(2026, 5, 15, 10)],
    ['milliseconds', '2026-06-15T10:00:00.123Z', Date.UTC(2026, 5, 15, 10, 0, 0, 123)],
    ['the largest valid offset', '2026-06-15T23:59:00+23:59', Date.UTC(2026, 5, 15, 0, 0)],
    ['an offset with 59 minutes', '2026-06-15T10:59:00+00:59', Date.UTC(2026, 5, 15, 10)],
    ['more than three fractional digits', '2026-06-15T10:00:00.123456789Z', Date.UTC(2026, 5, 15, 10, 0, 0, 123)],
  ])('should accept %s', (_label, raw, expected) => {
    // Arrange
    const input = raw;

    // Act
    const result = parseInstant(input);

    // Assert
    expect(result).toBe(expected);
  });

  it.each([
    ['an empty string', ''],
    ['a date without time', '2026-06-15'],
    ['a missing zone', '2026-06-15T10:00:00'],
    ['a compact offset', '2026-06-15T10:00:00+0200'],
    ['free text', 'yesterday'],
    ['a non-existent day', '2026-06-31T10:00:00Z'],
    ['trailing text', '2026-06-15T10:00:00Z later'],
    ['leading whitespace', ' 2026-06-15T10:00:00Z'],
    ['an offset of 24 hours', '2026-06-15T10:00:00+24:00'],
    ['an offset of 60 minutes', '2026-06-15T10:00:00+00:60'],
  ])('should reject %s with the invalid timestamp code', (_label, raw) => {
    // Arrange
    const input = raw;

    // Act
    const act = () => parseInstant(input);

    // Assert
    expect(act).toThrow(expect.objectContaining({ code: INVALID_TIMESTAMP_CODE }));
  });
});

describe('invalidTimestamp message', () => {
  it('should name the offending value', () => {
    // Arrange
    const raw = 'yesterday';

    // Act
    const act = () => parseInstant(raw);

    // Assert
    expect(act).toThrow("Parse time error: invalid timestamp 'yesterday'");
  });
});

describe('normalizeInstant', () => {
  it('should convert an offset instant to UTC and drop the fraction', () => {
    // Arrange
    const raw = '2026-06-15T12:00:00.750+02:00';

    // Act
    const result = normalizeInstant(raw);

    // Assert
    expect(result).toBe('2026-06-15T10:00:00Z');
  });
});

describe('formatDay', () => {
  it('should zero-pad year, month and day', () => {
    // Arrange
    const [year, month, day] = [987, 3, 4];

    // Act
    const result = formatDay(year, month, day);

    // Assert
    expect(result).toBe('0987-03-04');
  });
});

describe('localDateString', () => {
  it('should read the calendar day in the given zone rather than in UTC', () => {
    // Arrange
    const instant = Date.parse('2026-06-15T22:30:00Z');

    // Act
    const result = localDateString(instant, 'Europe/Warsaw');

    // Assert
    expect(result).toBe('2026-06-16');
  });
});

describe('wholeSecondsBetween', () => {
  it('should truncate sub-second parts', () => {
    // Arrange
    const [from, to] = [0, 1999];

    // Act
    const result = wholeSecondsBetween(from, to);

    // Assert
    expect(result).toBe(1);
  });

  it('should never go negative', () => {
    // Arrange
    const [from, to] = [5000, 1000];

    // Act
    const result = wholeSecondsBetween(from, to);

    // Assert
    expect(result).toBe(0);
  });
});
