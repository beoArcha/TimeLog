import { describe, it, expect } from 'vitest';
import type { ResolvedRange } from '@bindings/ResolvedRange';
import { isStartInRange, localDateOfRange, parseLogTimestampMs } from '@common/engine/range/logRange';
import { EngineValidationException } from '@common/exceptions';

const DAY: ResolvedRange = {
  from: '2026-10-14T00:00:00Z',
  to: '2026-10-15T00:00:00Z',
  timezone: 'UTC',
};
const UNBOUNDED: ResolvedRange = { timezone: 'UTC' };

describe('parseLogTimestampMs', () => {
  it('should read a naive timestamp as UTC regardless of the host timezone', () => {
    // Arrange
    const raw = '2026-01-01T10:00:00';

    // Act
    const ms = parseLogTimestampMs(raw);

    // Assert
    expect(ms).toBe(Date.UTC(2026, 0, 1, 10, 0, 0));
  });

  it('should use an RFC3339 timestamp with an offset as an exact instant', () => {
    // Arrange
    const raw = '2026-01-01T10:00:00+02:00';

    // Act
    const ms = parseLogTimestampMs(raw);

    // Assert
    expect(ms).toBe(Date.UTC(2026, 0, 1, 8, 0, 0));
  });

  it('should accept fractional seconds on an RFC3339 timestamp', () => {
    // Arrange
    const raw = '2026-01-01T10:00:00.250Z';

    // Act
    const ms = parseLogTimestampMs(raw);

    // Assert
    expect(ms).toBe(Date.UTC(2026, 0, 1, 10, 0, 0, 250));
  });

  it.each(['not-a-timestamp', '2026-01-01', '2026-01-01 10:00:00', '2026-02-30T10:00:00', '2026-01-01T24:00:00'])(
    'should treat %s as unparseable',
    (raw) => {
      // Arrange
      const input = raw;

      // Act
      const ms = parseLogTimestampMs(input);

      // Assert
      expect(ms).toBeNull();
    }
  );
});

describe('isStartInRange', () => {
  it('should include a log starting exactly at the lower bound', () => {
    // Arrange
    const startTime = '2026-10-14T00:00:00Z';

    // Act
    const included = isStartInRange(startTime, DAY);

    // Assert
    expect(included).toBe(true);
  });

  it('should exclude a log starting exactly at the exclusive upper bound', () => {
    // Arrange
    const startTime = '2026-10-15T00:00:00Z';

    // Act
    const included = isStartInRange(startTime, DAY);

    // Assert
    expect(included).toBe(false);
  });

  it('should count a naive log timestamp as UTC when checking a bounded range', () => {
    // Arrange
    const startTime = '2026-10-14T23:59:59';

    // Act
    const included = isStartInRange(startTime, DAY);

    // Assert
    expect(included).toBe(true);
  });

  it('should compare an offset log timestamp as an exact instant', () => {
    // Arrange
    const startTime = '2026-10-15T00:30:00+02:00';

    // Act
    const included = isStartInRange(startTime, DAY);

    // Assert
    expect(included).toBe(true);
  });

  it('should exclude an unparseable log timestamp when the range is bounded', () => {
    // Arrange
    const startTime = 'not-a-timestamp';

    // Act
    const included = isStartInRange(startTime, DAY);

    // Assert
    expect(included).toBe(false);
  });

  it('should include an unparseable log timestamp when the range is unbounded on both sides', () => {
    // Arrange
    const startTime = 'not-a-timestamp';

    // Act
    const included = isStartInRange(startTime, UNBOUNDED);

    // Assert
    expect(included).toBe(true);
  });

  it('should exclude an unparseable log timestamp when only one side is bounded', () => {
    // Arrange
    const range: ResolvedRange = { from: '2026-10-14T00:00:00Z', timezone: 'UTC' };

    // Act
    const included = isStartInRange('not-a-timestamp', range);

    // Assert
    expect(included).toBe(false);
  });

  it('should throw a range error when a resolved bound is not RFC3339', () => {
    // Arrange
    const range: ResolvedRange = { from: 'garbage', timezone: 'UTC' };

    // Act
    const check = () => isStartInRange('2026-10-14T00:00:00Z', range);

    // Assert
    expect(check).toThrow(EngineValidationException);
  });
});

describe('localDateOfRange', () => {
  it('should return the calendar day in which the range begins in its own timezone', () => {
    // Arrange
    const range: ResolvedRange = {
      from: '2026-11-11T23:00:00Z',
      to: '2026-11-12T23:00:00Z',
      timezone: 'Europe/Warsaw',
    };

    // Act
    const date = localDateOfRange(range);

    // Assert
    expect(date).toBe('2026-11-12');
  });

  it('should throw a range error when the range has no from bound', () => {
    // Arrange
    const range: ResolvedRange = { timezone: 'UTC' };

    // Act
    const read = () => localDateOfRange(range);

    // Assert
    expect(read).toThrow(EngineValidationException);
  });
});
