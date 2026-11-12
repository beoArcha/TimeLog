import { describe, it, expect } from 'vitest';
import { aTimeLog } from '@tests/shared/builders/entity-builders';
import type { ReportEntry } from '@bindings/ReportEntry';
import {
  compareIds,
  compareSecondsDescThenId,
  shareBasisPoints,
  sortEntries,
} from '@common/engine/reports/ordering';

describe('shareBasisPoints', () => {
  it('should return 0 when the total is zero', () => {
    // Arrange
    const [seconds, total] = [0, 0];

    // Act
    const result = shareBasisPoints(seconds, total);

    // Assert
    expect(result).toBe(0);
  });

  it('should return 10000 when the item holds all the time', () => {
    // Arrange
    const [seconds, total] = [3600, 3600];

    // Act
    const result = shareBasisPoints(seconds, total);

    // Assert
    expect(result).toBe(10_000);
  });

  it('should return 0 when the item holds no time of a non-zero total', () => {
    // Arrange
    const [seconds, total] = [0, 3600];

    // Act
    const result = shareBasisPoints(seconds, total);

    // Assert
    expect(result).toBe(0);
  });

  it('should keep the even quotient when the remainder is exactly half', () => {
    // Arrange: 1/32 of 10000 is 312.5
    const [seconds, total] = [1, 32];

    // Act
    const result = shareBasisPoints(seconds, total);

    // Assert
    expect(result).toBe(312);
  });

  it('should round the odd quotient up when the remainder is exactly half', () => {
    // Arrange: 3/32 of 10000 is 937.5
    const [seconds, total] = [3, 32];

    // Act
    const result = shareBasisPoints(seconds, total);

    // Assert
    expect(result).toBe(938);
  });

  it('should round up when the remainder is above half', () => {
    // Arrange: 2/3 of 10000 is 6666.67
    const [seconds, total] = [2, 3];

    // Act
    const result = shareBasisPoints(seconds, total);

    // Assert
    expect(result).toBe(6667);
  });

  it('should round down when the remainder is below half', () => {
    // Arrange: 1/3 of 10000 is 3333.33
    const [seconds, total] = [1, 3];

    // Act
    const result = shareBasisPoints(seconds, total);

    // Assert
    expect(result).toBe(3333);
  });

  it('should stay exact when seconds times 10000 exceeds the safe integer range', () => {
    // Arrange
    const seconds = Number.MAX_SAFE_INTEGER - 1;
    const total = Number.MAX_SAFE_INTEGER;

    // Act
    const result = shareBasisPoints(seconds, total);

    // Assert
    expect(result).toBe(10_000);
  });

  it('should saturate at the u32 maximum when the item exceeds the total', () => {
    // Arrange
    const [seconds, total] = [Number.MAX_SAFE_INTEGER, 1];

    // Act
    const result = shareBasisPoints(seconds, total);

    // Assert
    expect(result).toBe(4_294_967_295);
  });
});

describe('compareSecondsDescThenId', () => {
  it('should rank the item with more seconds first', () => {
    // Arrange
    const more = { id: 'z', seconds: 20 };
    const less = { id: 'a', seconds: 10 };

    // Act
    const sorted = [less, more].sort(compareSecondsDescThenId);

    // Assert
    expect(sorted).toEqual([more, less]);
  });

  it('should rank the lower id first when seconds tie', () => {
    // Arrange
    const first = { id: 'a', seconds: 10 };
    const second = { id: 'b', seconds: 10 };

    // Act
    const sorted = [second, first].sort(compareSecondsDescThenId);

    // Assert
    expect(sorted).toEqual([first, second]);
  });

  it('should treat identical items as equal', () => {
    // Arrange
    const item = { id: 'a', seconds: 10 };

    // Act
    const result = compareSecondsDescThenId(item, { ...item });

    // Assert
    expect(result).toBe(0);
  });
});

describe('compareIds', () => {
  it('should order ids by code unit rather than by locale', () => {
    // Arrange
    const ids = ['b', 'B', 'a', 'A'];

    // Act
    const sorted = [...ids].sort(compareIds);

    // Assert
    expect(sorted).toEqual(['A', 'B', 'a', 'b']);
  });
});

describe('sortEntries', () => {
  const entry = (id: string, start: string): ReportEntry => {
    const log = aTimeLog({ id, startTime: start });
    return { id: log.id, start: log.startTime } as ReportEntry;
  };

  it('should order entries by start and then by id', () => {
    // Arrange
    const entries = [
      entry('b', '2026-06-15T10:00:00Z'),
      entry('c', '2026-06-15T09:00:00Z'),
      entry('a', '2026-06-15T10:00:00Z'),
    ];

    // Act
    sortEntries(entries);

    // Assert
    expect(entries.map((item) => item.id)).toEqual(['c', 'a', 'b']);
  });
});
